import { registerHotbarRefreshHooks } from "./configs/hooks.mjs";
import { registerTokenHotbarKeybindings } from "./configs/keybindings.mjs";
import { registerTokenHotbarSettings } from "./configs/settings.mjs";
import { preloadHandlebarsTemplates } from "./configs/templates.mjs";
import TokenHotbar from "./hotbar/hotbar.mjs";
import { dnd5eConfig } from "./systems/dnd5e.mjs";
import { pf2eConfig } from "./systems/pf2e.mjs";

Hooks.once("init", async function() {
  registerTokenHotbarSettings();
  registerTokenHotbarKeybindings();
  CONFIG.ui.hotbar = TokenHotbar;
});

Hooks.once("ready", async function() {
  preloadHandlebarsTemplates();
  registerHotbarRefreshHooks();

  switch (game.system.id) {
    case "dnd5e": dnd5eConfig(); break;
    case "pf2e": pf2eConfig(); break;
  }
});