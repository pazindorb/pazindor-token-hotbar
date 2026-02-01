export function registerTokenHotbarSettings() {
  game.settings.register("pazindor-token-hotbar", "tokenHotbar", {
    scope: "client",
    config: false,
    default: false,
    type: Boolean
  });

  game.settings.register("pazindor-token-hotbar", "tokenHotbarSettings", {
    scope: "client",
    config: false,
    default: {
      sectionA: {
        columns: 7,
        rows: 3
      },
      sectionB: {
        columns: 3,
        rows: 3
      },
      effects: {
        rowSize: 6,
        position: "sectionA"
      },
      borderColor: true,
      markers: true,
      showCharges: true,
      displayToken: false,
    },
    type: Object
  });

  game.settings.register("pazindor-token-hotbar", "maxHpPath", {
    scope: "world",
    config: true,
    default: "",
    name: "PTH.SETTINGS.MAX_HP",
    type: String
  });

  game.settings.register("pazindor-token-hotbar", "currentHpPath", {
    scope: "world",
    config: true,
    default: "",
    name: "PTH.SETTINGS.CURRENT_HP",
    type: String
  });

  game.settings.register("pazindor-token-hotbar", "tempHpPath", {
    scope: "world",
    config: true,
    default: "",
    name: "PTH.SETTINGS.TEMP_HP",
    type: String
  });

  game.settings.register("pazindor-token-hotbar", "negativeHealth", {
    scope: "world",
    config: true,
    default: false,
    name: "PTH.SETTINGS.NEGATIVE_HEALTH",
    hint: "PTH.SETTINGS.NEGATIVE_HEALTH_HINT",
    type: Boolean
  });
}