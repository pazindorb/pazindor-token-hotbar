export function registerTokenHotbarSettings() {
  game.settings.register("pazindor-token-hotbar", "tokenHotbar", {
    scope: "client",
    config: false,
    default: false,
    type: Boolean
  });

  game.settings.register("pazindor-token-hotbar", "lockHotbar", {
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
      showQuantity: true,
      displayToken: false,
      overlay: true,
    },
    type: Object
  });

  game.settings.register("pazindor-token-hotbar", "resource1Path", {
    scope: "world",
    config: true,
    default: "",
    name: "PTH.SETTINGS.RESOURCE_1_PATH",
    type: String
  });

  game.settings.register("pazindor-token-hotbar", "resource1Name", {
    scope: "world",
    config: true,
    default: "",
    name: "PTH.SETTINGS.RESOURCE_1_NAME",
    type: String
  });

  game.settings.register("pazindor-token-hotbar", "resource1Color", {
    scope: "world",
    config: true,
    default: "#ffffff",
    name: "PTH.SETTINGS.RESOURCE_1_COLOR",
    type: String
  });

  game.settings.register("pazindor-token-hotbar", "resource2Path", {
    scope: "world",
    config: true,
    default: "",
    name: "PTH.SETTINGS.RESOURCE_2_PATH",
    type: String
  });

  game.settings.register("pazindor-token-hotbar", "resource2Name", {
    scope: "world",
    config: true,
    default: "",
    name: "PTH.SETTINGS.RESOURCE_2_NAME",
    type: String
  });

  game.settings.register("pazindor-token-hotbar", "resource2Color", {
    scope: "world",
    config: true,
    default: "#ffffff",
    name: "PTH.SETTINGS.RESOURCE_2_COLOR",
    type: String
  });

  game.settings.register("pazindor-token-hotbar", "resource3Path", {
    scope: "world",
    config: true,
    default: "",
    name: "PTH.SETTINGS.RESOURCE_3_PATH",
    type: String
  });

  game.settings.register("pazindor-token-hotbar", "resource3Name", {
    scope: "world",
    config: true,
    default: "",
    name: "PTH.SETTINGS.RESOURCE_3_NAME",
    type: String
  });

  game.settings.register("pazindor-token-hotbar", "resource3Color", {
    scope: "world",
    config: true,
    default: "#ffffff",
    name: "PTH.SETTINGS.RESOURCE_3_COLOR",
    type: String
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