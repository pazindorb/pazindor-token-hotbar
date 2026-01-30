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
    label: "TODO",
    type: String
  });

  game.settings.register("pazindor-token-hotbar", "currentHpPath", {
    scope: "world",
    config: true,
    default: "",
    label: "TODO",
    type: String
  });
}