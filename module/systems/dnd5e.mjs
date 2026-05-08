import TokenHotbar from "../hotbar/hotbar.mjs";
import { RollDialog } from "../hotbar/roll-dialog.mjs";

export function dnd5eSpecificSettings() {
  const maxHP = game.settings.get("pazindor-token-hotbar", "maxHpPath");
  if (!maxHP) game.settings.set("pazindor-token-hotbar", "maxHpPath", "system.attributes.hp.max");
  const currentHP = game.settings.get("pazindor-token-hotbar", "currentHpPath");
  if (!currentHP) game.settings.set("pazindor-token-hotbar", "currentHpPath", "system.attributes.hp.value");
  const tempHP = game.settings.get("pazindor-token-hotbar", "tempHpPath");
  if (!tempHP) game.settings.set("pazindor-token-hotbar", "tempHpPath", "system.attributes.hp.temp");
}

export function dnd5eConfig() {
  PTH.customDropHandler = dropHandler;
  PTH.customSlotConfigHandler = (slot, actor) => {
    if (slot.slotType === "activity") {
      fromUuid(slot.uuid).then(activity => activity.sheet.render(true));
    }
  }

  PTH.handleSlotUse = (slot, options) => {
    switch (slot.slotType) {
      case "item":
        const item = ui.hotbar.actor.items.get(slot.itemId);
        if (item) item.use({event: options?.event});
        break;

      case "macro":
        fromUuid(slot.uuid).then(macro => macro.execute());
        break;

      case "activity":
        fromUuid(slot.uuid).then(activity => {if (activity.canUse) activity.use()});
        break;
    }
  };
  PTH.getItemCharges = (item) => {
    const uses = item.system.uses;
    if (!uses?.max) return null;
    return uses?.value;
  }
  PTH.getItemQuantity = (item) => {
    const quantity = item.system.quantity;
    if (quantity == null) return;

    if (quantity !== 1) return quantity;
    if (item.type === "consumable") return quantity; // For consumable always return quantity
  }
  PTH.generateMarker = (slot) => {
    if (slot.slotType === "item") {
      // Spell Prepared
      if (slot.type === "spell") {
        switch(slot.system.prepared) {
          case 0: return '<i class="fa-thin fa-sun"></i>';
          case 1: return '<i class="fa-solid fa-sun"></i>';
          case 2: return '<i class="fa-solid fa-certificate"></i>';
        }
      }

      // Item Equipment
      if (slot.system.equipped) {
        const attuned = slot.system.attuned ? 'style="color: #ddc12b"' : ''
        return `<i class="fa-solid fa-shield" ${attuned}></i>`;
      }
    }

    if (slot.slotType === "activity") {
      switch(slot.activityType) {
        case "attack": return '<i class="fa-solid fa-sword"></i>';
        case "cast": return '<i class="fa-solid fa-wand-magic-sparkles"></i>';
        case "save": return '<i class="fa-solid fa-block-brick-fire"></i>';
        case "check": return '<i class="fa-solid fa-hand-fist"></i>';
        case "heal": return '<i class="fa-solid fa-heart"></i>';
        case "damage": return '<i class="fa-solid fa-droplet"></i>';
        default: return '<i class="fa-solid fa-play"></i>';
      }
    }
  }
  PTH.autofill = (actor, options) => {
    const itemsToAdd = [];
    for (const item of actor.items) {
      if (!item.system.activities) continue;
      if (item.system.activities.size > 0) itemsToAdd.push(item);
    }
    return itemsToAdd;
  };

  // Action Buttons
  PTH.actions = [
    {
      key: "longRest",
      label: "PTH.DND5E.START_REST.LONG",
      icon: "fas fa-campground",
      action: (actor, options) => actor.longRest()
    },
    {
      key: "shortRest",
      label: "PTH.DND5E.START_REST.SHORT",
      icon: "fas fa-utensils",
      action: (actor, options) => actor.shortRest()
    },
    {
      key: "initiative",
      label: "PTH.DND5E.INITIATIVE",
      icon: "fas fa-swords",
      action: (actor, options) => actor.rollInitiativeDialog({event: options?.event, createCombatants: true})
    },
    {
      key: "basicRoll",
      label: "PTH.DND5E.BASIC_ROLL",
      icon: "fas fa-dice",
      action: (actor, options) => new RollDialog(actor, prepareRolls()).render(true)
    }
  ]

  // Context menu
  PTH.contextMenu = [
    {
      name: "PTH.DND5E.EQUIP_ITEM",
      icon: '<i class="fa-solid fa-shield-halved"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return item.system.hasOwnProperty("equipped") && !item.system.equipped;
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        item.update({["system.equipped"]: true})
      }
    },
    {
      name: "PTH.DND5E.UNEQUIP_ITEM",
      icon: '<i class="fa-solid fa-shield-halved"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return item.system.hasOwnProperty("equipped") && item.system.equipped;
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        item.update({["system.equipped"]: false})
      }
    },
    {
      name: "PTH.DND5E.ATTUNE_ITEM",
      icon: '<i class="fa-solid fa-sun"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return !!item.system.attunement && !item.system.attuned;
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        item.update({["system.attuned"]: true})
      }
    },
    {
      name: "PTH.DND5E.UNATTUNE_ITEM",
      icon: '<i class="fa-solid fa-sun"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;
        return !!item.system.attunement && item.system.attuned;
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        item.update({["system.attuned"]: false})
      }
    },
    {
      name: "PTH.DND5E.PREPARE_SPELL",
      icon: '<i class="fa-solid fa-sun"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;

        const prepared = item.system.prepared;
        if (!prepared == null) return false;
        return prepared === 0
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        item.update({["system.prepared"]: 1});
      }
    },
    {
      name: "PTH.DND5E.UNPREPARE_SPELL",
      icon: '<i class="fa-solid fa-sun"></i>',
      condition: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return false;

        const prepared = item.system.prepared;
        if (!prepared == null) return false;
        return prepared === 1
      },
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (!item) return;
        item.update({["system.prepared"]: 0});
      }
    },
  ]

  // Filters
  PTH.filters = [
    {
      label: "PTH.DND5E.FILTER.ACTIVITY",
      icon: "fas fa-play",
      filter: slot =>  slot.slotType === "activity"
    },
    {
      label: "PTH.DND5E.FILTER.ACTION",
      icon: "fas fa-cube",
      filter: slot => {
        if (slot.slotType === "item") {
          if (!slot.system.activities) return false;
          return !!slot.system.activities.find(activity => activity.activation.type === "action");
        }

        if (slot.slotType === "activity") {
          return slot.activation === "action"
        }
        return false;
      }
    },
    {
      label: "PTH.DND5E.FILTER.BONUS_ACTION",
      icon: "far fa-cube",
      filter: slot => {
        if (slot.slotType === "item") {
          if (!slot.system.activities) return false;
          return !!slot.system.activities.find(activity => activity.activation.type === "bonus");
        }

        if (slot.slotType === "activity") {
          return slot.activation === "bonus"
        }
        return false;
      }
    },
    {
      label: "PTH.DND5E.FILTER.REACTION",
      icon: "fas fa-reply",
      filter: slot => {
        if (slot.slotType === "item") {
          if (!slot.system.activities) return false;
          return !!slot.system.activities.find(activity => activity.activation.type === "reaction");
        }

        if (slot.slotType === "activity") {
          return slot.activation === "reaction"
        }
        return false;
      }
    },
  ]
}

//============== OTHER FUNCTIONS ==============
function prepareRolls() {
  const rolls = [[],[],[]];
  for (const [key, ability] of Object.entries(CONFIG.DND5E.abilities)) {
    rolls[0].push({
      name: `${ability.label} ${game.i18n.localize("PTH.BASIC_ROLL.CHECK")}`,
      roll: (actor, event) => actor.rollAbilityCheck({ability: key, event: event})
    });
    rolls[1].push({
      name: `${ability.label} ${game.i18n.localize("PTH.BASIC_ROLL.SAVE")}`,
      roll: (actor, event) => actor.rollSavingThrow({ability: key, event: event})
    });
  }

  for (const [key, skill] of Object.entries(CONFIG.DND5E.skills)) {
    rolls[2].push({
      name: `${skill.label} ${game.i18n.localize("PTH.BASIC_ROLL.CHECK")}`,
      roll: (actor, event) => actor.rollSkill({skill: key, event: event})
    });
  }
  return rolls;
}

async function dropHandler(dropped, index, section, actor) {
  if (!actor) return;
  if (dropped.type !== "Activity") return;

  const activity = await fromUuid(dropped.uuid);
  await actor.update({[`flags.tokenHotbar.${section}.${index}`]: {
    slotType: "activity",
    img: activity.item.img,
    name: activity.item.name + " - " + activity.name,
    uuid: activity.uuid,
    activityType: activity.type,
    activation: activity.activation.type,
    description: `<p>@UUID[${activity.item.uuid}]</p>`
  }});
}