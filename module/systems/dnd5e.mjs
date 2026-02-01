import TokenHotbar from "../hotbar/hotbar.mjs";

export function dnd5eConfig() {
  const maxHP = game.settings.get("pazindor-token-hotbar", "maxHpPath");
  if (!maxHP) game.settings.set("pazindor-token-hotbar", "maxHpPath", "system.attributes.hp.max");

  const currentHP = game.settings.get("pazindor-token-hotbar", "currentHpPath");
  if (!currentHP) game.settings.set("pazindor-token-hotbar", "currentHpPath", "system.attributes.hp.value");

  const tempHP = game.settings.get("pazindor-token-hotbar", "tempHpPath");
  if (!tempHP) game.settings.set("pazindor-token-hotbar", "tempHpPath", "system.attributes.hp.temp");


  PTH.rollItem = (item, options) => item.use({event: options.event});
  PTH.getItemCharges = (item) => {
    const uses = item.system.uses;
    if (!uses?.max) return null;
    return uses?.value;
  }
  PTH.autofill = (actor) => {
    const itemsToAdd = [];
    for (const item of actor.items) {
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
      action: (actor) => actor.longRest()
    },
    {
      key: "shortRest",
      label: "PTH.DND5E.START_REST.SHORT",
      icon: "fas fa-utensils",
      action: (actor) => actor.shortRest()
    },
    {
      key: "initiative",
      label: "PTH.DND5E.INITIATIVE",
      icon: "fas fa-swords",
      action: (actor, event) => actor.rollInitiativeDialog({event: event})
    },
    {
      key: "basicRoll",
      label: "PTH.DND5E.BASIC_ROLL",
      icon: "fas fa-dice",
      action: (actor) => {console.log("TODO!!!!")}
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
  ]

  // Filters
  PTH.filters = [
    {
      label: "PTH.DND5E.FILTER.ACTION",
      icon: "fas fa-cube",
      filter: item => {
        if (!item.system.activities) return false;
        return !!item.system.activities.find(activity => activity.activation.type === "action");
      }
    },
    {
      label: "PTH.DND5E.FILTER.BONUS_ACTION",
      icon: "far fa-cube",
      filter: item => {
        if (!item.system.activities) return false;
        return !!item.system.activities.find(activity => activity.activation.type === "bonus");
      }
    },
    {
      label: "PTH.DND5E.FILTER.REACTION",
      icon: "fas fa-reply",
      filter: item => {
        if (!item.system.activities) return false;
        return !!item.system.activities.find(activity => activity.activation.type === "reaction");
      }
    },
  ]
}