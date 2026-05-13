import { registerHotbarRefreshHooks } from "./configs/hooks.mjs";
import { registerTokenHotbarKeybindings } from "./configs/keybindings.mjs";
import { registerTokenHotbarSettings } from "./configs/settings.mjs";
import { preloadHandlebarsTemplates } from "./configs/templates.mjs";
import TokenHotbar from "./hotbar/hotbar.mjs";
import { dnd5eConfig, dnd5eSpecificSettings } from "./systems/dnd5e.mjs";
import { pf1Config, pf1SpecificSettings } from "./systems/pf1.mjs";
import { pf2eConfig, pf2eSpecificSettings } from "./systems/pf2e.mjs";

Hooks.once("init", async function() {
  registerTokenHotbarSettings();
  registerTokenHotbarKeybindings();
  CONFIG.ui.hotbar = TokenHotbar;

  window.PTH = {
    handleSlotUse: () => {ui.notifications.warn(game.i18n.localize("PTH.NO_SLOT_USE_CONFIGURED"))}
  };
  switch (game.system.id) {
    case "dnd5e": dnd5eConfig(); break;
    case "pf1": pf1Config(); break;
    case "pf2e": pf2eConfig(); break;
  }
});

Hooks.once("ready", async function() {
  preloadHandlebarsTemplates();
  registerHotbarRefreshHooks();

  switch (game.system.id) {
    case "dnd5e": dnd5eSpecificSettings(); break;
    case "pf1": pf1SpecificSettings(); break;
    case "pf2e": pf2eSpecificSettings(); break;
  }
});