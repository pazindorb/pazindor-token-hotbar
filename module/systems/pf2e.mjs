import TokenHotbar from "../hotbar/hotbar.mjs";
import { RollDialog } from "../hotbar/roll-dialog.mjs";

export function pf2eSpecificSettings() {
  const maxHP = game.settings.get("pazindor-token-hotbar", "maxHpPath");
  if (!maxHP) game.settings.set("pazindor-token-hotbar", "maxHpPath", "system.attributes.hp.max");
  const currentHP = game.settings.get("pazindor-token-hotbar", "currentHpPath");
  if (!currentHP) game.settings.set("pazindor-token-hotbar", "currentHpPath", "system.attributes.hp.value");
  const tempHP = game.settings.get("pazindor-token-hotbar", "tempHpPath");
  if (!tempHP) game.settings.set("pazindor-token-hotbar", "tempHpPath", "system.attributes.hp.temp");
}

export function pf2eConfig() {
  PTH.portraitOverlay = portraitOverlay;
  PTH.customDropHandler = dropHandler;

  PTH.handleSlotUse = (slot, options) => {
    switch (slot.slotType) {
      case "item":
        const item = ui.hotbar.actor.items.get(slot.itemId);
        if (item) rollPF2eItem(item, options);
        break;

      case "macro":
        fromUuid(slot.uuid).then(macro => macro.execute());
        break;
    }
  };
  PTH.getItemCharges = (item) => {
    const frequency = item.system?.frequency;
    if (frequency?.max) return frequency.value;
    
    const uses = item.system.uses;
    if (uses?.max) return uses.value;
    return null;
  }
  PTH.getItemQuantity = (item) => {
    const quantity = item.system.quantity;
    if (quantity == null) return;

    if (quantity !== 1) return quantity;
    if (item.type === "consumable") return quantity; // For consumable always return quantity
  }
  PTH.generateMarker = (slot) => {
    if (slot.slotType === "item") {
      const equipped = slot.system.equipped;
      if (!equipped) return;

      const invested = equipped.invested ? 'style="color: #93c5c9"' : '';

      switch (equipped.carryType) {
        case "held": 
          if (equipped.handsHeld === 1) return `<i class="fa-solid fa-hand-back-fist fa-fwt" ${invested}></i>`;
          if (equipped.handsHeld === 2) return `<span class="fa-stack fa-fw fa-2xs"><i class="fa-solid fa-hand-back-fist fa-stack-2x" ${invested}></i><i class="fa-solid fa-2 fa-inverse fa-stack-1x" style="color: #000000; font-size: 8px; left: 1px; bottom: 1px; text-shadow:none"></i></span>`

        case "worn": 
          return `<i class="fa-solid fa-shirt fa-fw" ${invested}></i>`;

        case "stowed": 
          return `<i class="fa-solid fa-box fa-fw"></i>`;

        case "dropped": 
          return `<i class="fa-solid fa-grip-lines fa-fw"></i>`
      }
    }
  }
  PTH.autofill = (actor) => {
    const itemsToAdd = [];
    const seen = new Set();
    const add = item => {
      if (!item || seen.has(item.id)) return;
      itemsToAdd.push(item);
      seen.add(item.id);
    }

    for (const action of actor.system.actions ?? []) add(action.item);

    for (const item of actor.itemTypes?.action ?? []) {
      if (hasUsableActionCost(item)) add(item);
    }

    for (const item of actor.itemTypes?.consumable ?? []) {
      if ((item.system.quantity ?? 0) > 0) add(item);
    }

    for (const item of actor.itemTypes?.spell ?? []) {
      if (canAutofillSpell(item)) add(item);
    }

    for (const item of actor.itemTypes?.feat ?? []) {
      if (hasUsableActionCost(item) || hasLimitedUses(item)) add(item);
    }

    return itemsToAdd;
  };

  // Action Buttons
  PTH.actions = [
    {
      key: "rest",
      label: "PTH.PF2E.START_REST",
      icon: "fas fa-bed",
      action: (actor, options) => game.pf2e.actions.restForTheNight({actors: [actor], event: options?.event})
    },
    {
      key: "initiative",
      label: "PTH.PF2E.INITIATIVE",
      icon: "fas fa-swords",
      action: (actor, options) => rollInitiative(actor)
    },
    {
      key: "basicRoll",
      label: "PTH.PF2E.BASIC_ROLL",
      icon: "fas fa-dice",
      action: (actor, options) => new RollDialog(actor, prepareRolls(actor)).render(true)
    },
    {
      key: "recovery",
      label: "PTH.PF2E.RECOVERY",
      icon: "fas fa-skull",
      action: async (actor, options) => {
        const result = await actor.rollRecovery(options?.event);

        const max = actor.system.attributes?.dying?.max ?? 4;
        const dying = actor.getCondition("dying");
        switch (result.degreeOfSuccess) {
          case 0:
            // Crit Fail
            await actor.increaseCondition("dying");
            await actor.increaseCondition("dying");
            break;

          case 1:
            // Fail
            await actor.increaseCondition("dying");
            break;

          case 2: 
            // Success
            await actor.decreaseCondition("dying");
            break;

          case 3: 
            // Crit Success
            await actor.decreaseCondition("dying");
            await actor.decreaseCondition("dying");
            break;
        }
      },
      hide: (actor) => !isCharacterDying(actor)
    }
  ]

  // Context Menu
  PTH.contextMenu = [
    {
      name: "PTH.PF2E.LOWER_SHIELD",
      icon: '<i class="fa-solid fa-shield fa-fw"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        if (item.type !== "shield") return false;
        return !!shieldRaised(item);
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        const raise = game.pf2e.actions?.raiseAShield;
        if (!raise) return;
        if (item.actor) raise({actors: [item.actor]})
      }
    },
    {
      name: "PTH.PF2E.RAISE_SHIELD",
      icon: '<i class="fa-solid fa-shield fa-fw"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        if (item.type !== "shield") return false;
        return !!!shieldRaised(item);
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        const raise = game.pf2e.actions?.raiseAShield;
        if (!raise) return;
        if (item.actor) raise({actors: [item.actor]})
      }
    },
    {
      name: "PTH.PF2E.HOLD_ITEM_1H",
      icon: '<span class="fa-stack fa-fw fa-2xs" style="margin-right: 7px; margin-left: -3px;"><i class="fa-solid fa-hand-back-fist fa-stack-2x"></i><i class="fa-solid fa-1 fa-inverse fa-stack-1x" style="color: #000000; font-size: 8px; left: 1px; bottom: 1px;"></i></span>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return item.system.hasOwnProperty("equipped");
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        equipChange(item, "held", 1);
      }
    },
    {
      name: "PTH.PF2E.HOLD_ITEM_2H",
      icon: '<span class="fa-stack fa-fw fa-2xs" style="margin-right: 7px; margin-left: -3px;"><i class="fa-solid fa-hand-back-fist fa-stack-2x"></i><i class="fa-solid fa-2 fa-inverse fa-stack-1x" style="color: #000000; font-size: 8px; left: 1px; bottom: 1px;"></i></span>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return item.system.hasOwnProperty("equipped");
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        equipChange(item, "held", 2);
      }
    },
    {
      name: "PTH.PF2E.WEAR_ITEM",
      icon: '<i class="fa-solid fa-shirt fa-fw"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return item.system.hasOwnProperty("equipped");
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        equipChange(item, "worn");
      }
    },
    {
      name: "PTH.PF2E.INVEST_ITEM",
      icon: '<i class="fa-solid fa-gem fa-fw"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        const canInvest = item.isInvested != null;
        return item.system.hasOwnProperty("equipped") && canInvest;
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        if (item.actor) item.actor.toggleInvested(item.id);
      }
    },
    {
      name: "PTH.PF2E.STOW_ITEM",
      icon: '<i class="fa-solid fa-box fa-fw"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        const canStow = item.actor.itemTypes.backpack.some(i => i.system.stowing && !i.isInContainer);
        return item.system.hasOwnProperty("equipped") && canStow;
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        equipChange(item, "stowed");
      }
    },
    {
      name: "PTH.PF2E.DROP_ITEM",
      icon: '<i class="fa-solid fa-grip-lines fa-fw"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return item.system.hasOwnProperty("equipped");
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        equipChange(item, "dropped");
      }
    },
  ]

  // Filters
  PTH.filters = [
    {
      label: "PTH.PF2E.FILTER.ACTION_1",
      icon: "fas fa-1",
      filter: item => itemCostFilter(item, 1)
    },
    {
      label: "PTH.PF2E.FILTER.ACTION_2",
      icon: "fas fa-2",
      filter: item => itemCostFilter(item, 2)
    },
    {
      label: "PTH.PF2E.FILTER.ACTION_3",
      icon: "fas fa-3",
      filter: item => itemCostFilter(item, 3)
    },
    {
      label: "PTH.PF2E.FILTER.FREE_ACTION",
      icon: "fas fa-f",
      filter: item => itemCostFilter(item, "free")
    },
    {
      label: "PTH.PF2E.FILTER.REACTION",
      icon: "fas fa-reply",
      filter: item => itemCostFilter(item, "reaction")
    },
  ]
}


//============== HANDLE ITEM ROLL ==============
async function rollPF2eItem(item, options) {
  const actor = item.actor;
  if (!actor) return;

  // Handle Weapon/Shield actions
  if (item.type === "weapon" || item.type === "shield") {
    const action = actor.system.actions.find(action => action.item.id === item.id);
    if (action) 
      return game.pf2e.rollActionMacro({
        actorUUID: actor.uuid,
        itemId: item.id,
        elementTrait: null,
        slug: action.slug,
        type: action.type
      });
  }

  // Consume consumbale
  if (item.type === 'consumable') 
    return item.consume();

  // Cast Spell
  if (item.type === "spell") 
    return castSpell(item);

  // Cast Feat or Action
  if (item.type === "action" || item.type === "feat") 
    return game.pf2e.rollItemMacro(item.uuid, options.event);

  item.toMessage(options?.event);
}

async function castSpell(item) {
  const spellcasting = item.spellcasting;
  if (!spellcasting) return;

  let spellRank = item.rank;
  const prepared = spellcasting.system.prepared?.value;
  if (prepared === "prepared") {
    let ranks = new Set();

    const slots = spellcasting.system.slots || {};
    let rank = 0;
    while (slots[`slot${rank}`]) {
      const slot = slots[`slot${rank}`];
      const hasSlot = prep => prep.id === item.id && !prep.expended;
      if (slot.prepared.find(prep => hasSlot(prep))) ranks.add(rank);
      rank++;
    }

    if (ranks.size === 0) {
      // NOTIFY - no spell left
      return;
    }
    if (ranks.size === 1) {
      spellRank = ranks.find(x => true);
    }
    if (ranks.size > 1) {
      const header = game.i18n.localize("PTH.PF2E.SPELL.SELECT_RANK");
      const options = toSelectOptions(ranks);
      const selected = await PDE.InputDialog.select(header, options);
      if (!selected) return;

      spellRank = parseInt(selected);
    }
  }
  spellcasting.cast(item, {rank: spellRank, consume: true});
}

function toSelectOptions(ranks) {
  const options = {};
  for (const rank of ranks) {
    options[rank] = `${game.i18n.localize("PTH.PF2E.SPELL.RANK")} ${rank}`;
  }
  return options;
}

//============== OTHER FUNCTIONS ==============
function hasUsableActionCost(item) {
  const type = item.system.actionType?.value ?? item.actionCost?.type;
  if (type) return type !== "passive";

  return item.system.time?.value || item.system.actions?.value;
}

function hasLimitedUses(item) {
  return !!(item.system.frequency?.max || item.system.uses?.max);
}

function canAutofillSpell(item) {
  const spellcasting = item.spellcasting;
  if (!spellcasting) return false;

  const prepared = spellcasting.system.prepared?.value;
  if (prepared !== "prepared") return true;

  const slots = spellcasting.system.slots || {};
  let rank = 0;
  while (slots[`slot${rank}`]) {
    const slot = slots[`slot${rank}`];
    const preparedSlot = slot.prepared?.find(prep => prep.id === item.id && !prep.expended);
    if (preparedSlot) return true;
    rank++;
  }

  return false;
}

function equipChange(item, type, hand) {
  if (!item.actor) return;

  item.actor.changeCarryType(item, {
    carryType: type,
    handsHeld: hand,
    inSlot: true
  })
}

function shieldRaised(item) {
  if (!item.actor) return;
  return item.actor.itemTypes?.effect?.find(effect => ['raise-a-shield', 'effect-raise-a-shield'].includes(effect.slug) || effect.sourceId === 'Compendium.pf2e.equipment-effects.Item.2YgXoHvJfrDHucMr');
}

async function rollInitiative(actor) {
  const preselected = actor.system.initiative.statistic;

  // Collect skills from Actor
  const options = {};
  for (const [key, skill] of Object.entries(actor.skills)) {
    options[key] = skill.label
  }

  const result = await PDE.InputDialog.open("input", {header: game.i18n.localize("PTH.PF2E.INITIATIVE"), inputs: [{
    header: "PTH.PF2E.INITIATIVE_SELECT", 
    type: "select",
    options: options,
    preselected: preselected
  }]})

  const selected = result ? result[0] : preselected;
  if (selected === preselected) return actor.rollInitiative({rerollInitiative: true, createCombatants: true});

  await actor.update({["system.initiative.statistic"]: selected});
  await actor.rollInitiative({rerollInitiative: true, createCombatants: true});
  await actor.update({["system.initiative.statistic"]: preselected});
}

function prepareRolls(act) {
  const rolls = [[],[]];
  rolls[0].push({
    name: `${game.i18n.localize("PF2E.PerceptionLabel")} ${game.i18n.localize("PTH.BASIC_ROLL.CHECK")}`,
    roll: (actor, event) => actor.perception.roll()
  })

  for (const [key, save] of Object.entries(CONFIG.PF2E.saves)) {
    rolls[0].push({
      name: `${game.i18n.localize(save)} ${game.i18n.localize("PTH.BASIC_ROLL.SAVE")}`,
      roll: (actor, event) => actor.saves[key].roll()
    })
  }

  for (const [key, skill] of Object.entries(act.skills)) {
    rolls[1].push({
      name: `${game.i18n.localize(skill.label)} ${game.i18n.localize("PTH.BASIC_ROLL.CHECK")}`,
      roll: (actor, event) => actor.skills[key].roll()
    })
  }
  return rolls;
}

async function dropHandler(dropped, index, section, actor) {
  if (!actor) return;
  if (dropped.type !== "Action") return;

  const action = actor.system.actions[dropped.index];
  if (!action) return;

  await actor.update({[`flags.tokenHotbar.${section}.${index}`]: {
    slotType: "item",
    img: action.item.img,
    name: action.item.name,
    uuid: action.item.uuid,
    itemId: action.item.id
  }});
}

function itemCostFilter(item, filterValue) {
  if (item.slotType !== "item") return false;
  if (item.system.time?.value) {
    return item.system.time.value.toLowerCase() == filterValue;
  }

  if (item.type === "weapon" || item.type === "shield") {
    if (filterValue === 1) return true;
    else return false;
  }

  const actionType = item.system.actionType?.value;
  if (actionType === filterValue) return true;

  const actionValue = item.system.actions?.value;
  if (actionValue == filterValue) return true;

  return false;
}

function portraitOverlay(actor) {
  if (!(actor.isDead || isCharacterDying(actor))) return "";

  if (actor.type === "character" && !isCharacterDead(actor)) {
    return printDyingOverlay(actor);
  }
  return printDeathOverlay();
}

function isCharacterDying(actor) {
  if (actor.type !== "character") return false; // Not a PC
  if (actor.statuses.has("dead")) return false; // Is dead already
  return actor.system.attributes.dying.value > 0;
}

function isCharacterDead(actor) {
  if (actor.statuses.has("dead")) return true; // Is dead already
  
  const dying = actor.system.attributes?.dying;
  return dying.value >= dying.max;
}

function printDeathOverlay(tooltipKey) {
  let content = '<div class="main-overlay" style="margin-top: 20px; padding: 2px;">';
  content += `<div style="display: flex; justify-content: center; align-items:center;" data-tooltip="${game.i18n.localize("PTH.PF2E.DEAD")}">`;
  content += '<i class="fa-solid fa-5x fa-skull" style="margin: 0px 3px; color: #ff0000; text-shadow: -1px 0 #000000, 0 1px #000000, 1px 0 #000000, 0 -1px #000000;"></i>';
  content += '</div>';
  content += '</div>';
  return content;
}

function printDyingOverlay(actor) {
  const dying = actor.system.attributes.dying;
  const doomed = actor.system.attributes.doomed?.value ?? 0;
  const max = dying.max + doomed;
  const value = dying.value;
  const maxed = value >= dying.max;

  let content = '<div class="main-overlay" style="margin-top: 70px; padding: 2px;">';
  content += `<div style="display: flex; justify-content: center; align-items:center; height:25px;" data-tooltip="${game.i18n.localize('PTH.PF2E.DYING')}">`;
  if (maxed) {
    for (let i = 0; i < max; i++) {
      content += '<i class="fa-solid fa-lg fa-skull" style="margin: 0px 3px; color: #ff0000; text-shadow: -1px 0 #000000, 0 1px #000000, 1px 0 #000000, 0 -1px #000000;"></i>';
    }
  } else {
    for (let i = 0; i < value; i++) {
      content += '<i class="fa-solid fa-lg fa-circle-xmark" style="margin: 0px 3px; color: #ff0000; text-shadow: -1px 0 #000000, 0 1px #000000, 1px 0 #000000, 0 -1px #000000;"></i>';
    }
    for (let i = value; i < dying.max; i++) {
      content += '<i class="fa-regular fa-lg fa-circle" style="margin: 0px 3px; color: #ffffff; text-shadow: -1px 0 #000000, 0 1px #000000, 1px 0 #000000, 0 -1px #000000;"></i>';
    }
    for (let i = 0; i < doomed; i++) {
      content += '<i class="fa-solid fa-lg fa-skull" style="margin: 0px 3px; color: #ff0000; text-shadow: -1px 0 #000000, 0 1px #000000, 1px 0 #000000, 0 -1px #000000;"></i>';
    }
  }
  content += '</div>';
  content += '</div>';
  return content;
}
