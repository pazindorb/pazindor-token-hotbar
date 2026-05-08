import TokenHotbar from "../hotbar/hotbar.mjs";
import { RollDialog } from "../hotbar/roll-dialog.mjs";

export function pf1SpecificSettings() {
  const maxHP = game.settings.get("pazindor-token-hotbar", "maxHpPath");
  if (!maxHP) game.settings.set("pazindor-token-hotbar", "maxHpPath", "system.attributes.hp.max");
  const currentHP = game.settings.get("pazindor-token-hotbar", "currentHpPath");
  if (!currentHP) game.settings.set("pazindor-token-hotbar", "currentHpPath", "system.attributes.hp.value");
  const tempHP = game.settings.get("pazindor-token-hotbar", "tempHpPath");
  if (!tempHP) game.settings.set("pazindor-token-hotbar", "tempHpPath", "system.attributes.hp.temp");
}

export function pf1Config() {
  PTH.customDropHandler = dropHandler;
  PTH.customSlotConfigHandler = (slot) => {
    if (slot.slotType === "action") {
      fromUuid(slot.uuid).then(action => action?.sheet?.render(true));
    }
  }

  PTH.handleSlotUse = async (slot, options) => {
    const event = getEvent(options);
    switch (slot.slotType) {
      case "item": {
        const item = ui.hotbar.actor.items.get(slot.itemId);
        if (item) item.use({ev: event, token: ui.hotbar.token});
        break;
      }

      case "macro":
        fromUuid(slot.uuid).then(macro => macro.execute());
        break;

      case "action": {
        const action = await fromUuid(slot.uuid);
        if (action?.canUse !== false) action?.use({ev: event, token: ui.hotbar.token});
        break;
      }
    }
  };

  PTH.getItemCharges = (item) => {
    const uses = item?.system?.uses;
    if (uses?.max) return uses.value;
    return null;
  }
  PTH.getItemQuantity = (item) => {
    const quantity = item.system.quantity;
    if (quantity == null) return;

    if (quantity !== 1) return quantity;
    if (item.type === "consumable" || item.isSingleUse) return quantity;
  }
  PTH.generateMarker = (slot) => {
    if (slot.slotType === "action") return actionTypeMarker(slot.actionType);
    if (slot.slotType !== "item") return;

    if (slot.type === "spell") {
      if (slot.system.atWill) return '<i class="fa-solid fa-infinity"></i>';
      if (slot.system.preparation?.value > 0) return '<i class="fa-solid fa-sun"></i>';
      return '<i class="fa-thin fa-sun"></i>';
    }

    if (slot.system.equipped) return '<i class="fa-solid fa-shield"></i>';
    if (slot.system.carried === false) return '<i class="fa-solid fa-grip-lines"></i>';
    if (slot.system.carried === true) return '<i class="fa-solid fa-person-walking-luggage"></i>';
  }
  PTH.autofill = (actor) => actor.items.filter(item => item.hasaction && item.canUse !== false);

  PTH.actions = [
    {
      key: "rest",
      label: "PTH.PF1.START_REST",
      icon: "fas fa-bed",
      action: (actor) => actor.sheet?._onRest?.({preventDefault: () => {}, currentTarget: {disabled: false}})
        ?? actor.performRest({verbose: true})
    },
    {
      key: "initiative",
      label: "PTH.PF1.INITIATIVE",
      icon: "fas fa-swords",
      action: (actor) => actor.rollInitiative({createCombatants: true, rerollInitiative: true})
    },
    {
      key: "basicRoll",
      label: "PTH.PF1.BASIC_ROLL",
      icon: "fas fa-dice",
      action: (actor) => new RollDialog(actor, prepareRolls(actor)).render(true)
    }
  ]

  PTH.contextMenu = [
    {
      name: "PTH.PF1.EQUIP_ITEM",
      icon: '<i class="fa-solid fa-shield-halved"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return canEquip(item) && !item.system.equipped;
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (item) item.setActive?.(true) ?? item.update({["system.equipped"]: true});
      }
    },
    {
      name: "PTH.PF1.UNEQUIP_ITEM",
      icon: '<i class="fa-solid fa-shield-halved"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return canEquip(item) && item.system.equipped;
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (item) item.setActive?.(false) ?? item.update({["system.equipped"]: false});
      }
    },
    {
      name: "PTH.PF1.CARRY_ITEM",
      icon: '<i class="fa-solid fa-person-walking-luggage"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return item.isPhysical && item.system.carried === false;
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (item) item.update({["system.carried"]: true});
      }
    },
    {
      name: "PTH.PF1.DROP_ITEM",
      icon: '<i class="fa-solid fa-grip-lines"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return item.isPhysical && item.system.carried !== false;
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (item) item.update({["system.carried"]: false, ["system.equipped"]: false});
      }
    },
    {
      name: "PTH.PF1.PREPARE_SPELL",
      icon: '<i class="fa-solid fa-sun"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return item.type === "spell" && !item.system.atWill && item.system.preparation?.value <= 0;
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        const max = Math.max(item.system.preparation?.max ?? 1, 1);
        item.update({["system.preparation.value"]: 1, ["system.preparation.max"]: max});
      }
    },
    {
      name: "PTH.PF1.UNPREPARE_SPELL",
      icon: '<i class="fa-regular fa-sun"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return item.type === "spell" && !item.system.atWill && item.system.preparation?.value > 0;
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (item) item.update({["system.preparation.value"]: 0});
      }
    },
  ]

  PTH.filters = [
    {
      label: "PTH.PF1.FILTER.STANDARD",
      icon: "fas fa-cube",
      filter: slot => activationFilter(slot, "standard")
    },
    {
      label: "PTH.PF1.FILTER.MOVE",
      icon: "fas fa-person-walking",
      filter: slot => activationFilter(slot, "move")
    },
    {
      label: "PTH.PF1.FILTER.SWIFT",
      icon: "fas fa-bolt",
      filter: slot => activationFilter(slot, "swift")
    },
    {
      label: "PTH.PF1.FILTER.FREE",
      icon: "fas fa-f",
      filter: slot => activationFilter(slot, "free")
    },
    {
      label: "PTH.PF1.FILTER.FULL",
      icon: "fas fa-hourglass",
      filter: slot => activationFilter(slot, "full")
    },
  ]
}

function getEvent(options) {
  return options?.event ?? options ?? null;
}

function canEquip(item) {
  return item?.isPhysical && item.system.hasOwnProperty("equipped") && item.canEquip !== false;
}

function getDefaultaction(slot) {
  const item = slot.slotType === "item" ? slot : null;
  return item?.defaultAction;
}

function activationFilter(slot, activation) {
  const action = slot.slotType === "action" ? slot : getDefaultaction(slot);
  if (!action) return false;
  return action.activation?.type === activation;
}

function actionTypeMarker(actionType) {
  switch(actionType) {
    case "mwak":
    case "rwak":
    case "twak":
      return '<i class="fa-solid fa-sword"></i>';
    case "msak":
    case "rsak":
    case "spellsave":
      return '<i class="fa-solid fa-wand-magic-sparkles"></i>';
    case "save":
      return '<i class="fa-solid fa-block-brick-fire"></i>';
    case "heal":
      return '<i class="fa-solid fa-heart"></i>';
    case "mcman":
    case "rcman":
      return '<i class="fa-solid fa-hand-fist"></i>';
    default:
      return '<i class="fa-solid fa-play"></i>';
  }
}

//============== OTHER FUNCTIONS ==============
function prepareRolls(actor) {
  const rolls = [[], []];
  const config = CONFIG.PF1 ?? pf1.config;

  for (const [key, ability] of Object.entries(config.abilities)) {
    rolls[0].push({
      name: `${game.i18n.localize(ability)} ${game.i18n.localize("PTH.BASIC_ROLL.CHECK")}`,
      roll: (actor, event) => actor.rollAbilityTest(key, {ev: event})
    });
  }

  for (const [key, save] of Object.entries(config.savingThrows)) {
    rolls[0].push({
      name: `${game.i18n.localize(save)} ${game.i18n.localize("PTH.BASIC_ROLL.SAVE")}`,
      roll: (actor, event) => actor.rollSavingThrow(key, {ev: event})
    });
  }

  for (const skill of collectSkills(actor)) {
    rolls[1].push({
      name: `${skill.label} ${game.i18n.localize("PTH.BASIC_ROLL.CHECK")}`,
      roll: (actor, event) => actor.rollSkill(skill.key, {ev: event})
    });
  }

  return rolls;
}

function collectSkills(actor) {
  const skills = [];
  for (const [key, skill] of Object.entries(actor.system.skills ?? {})) {
    if (!skill) continue;
    const info = actor.getSkillInfo?.(key);
    skills.push({key, label: info?.fullName ?? game.i18n.localize(skill.label ?? skill.name ?? key)});

    for (const subKey of Object.keys(skill.subSkills ?? {})) {
      const composite = `${key}.${subKey}`;
      const subInfo = actor.getSkillInfo?.(composite);
      skills.push({key: composite, label: subInfo?.fullName ?? subInfo?.label ?? composite});
    }
  }
  return skills;
}

async function dropHandler(dropped, index, section, actor) {
  if (!actor) return;

  if (dropped.type === "action") {
    const action = await fromUuid(dropped.uuid);
    if (!action) return;

    await actor.update({[`flags.tokenHotbar.${section}.${index}`]: {
      slotType: "action",
      img: action.img,
      name: `${action.name} (${action.item.name})`,
      uuid: action.uuid,
      itemId: action.item.id,
      actionId: action.id,
      actionType: action.actionType,
      activation: action.activation,
      description: `<p>@UUID[${action.item.uuid}]</p>`
    }});
    return;
  }
}
