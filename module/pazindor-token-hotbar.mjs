import { registerTokenHotbarKeybindings } from "./configs/keybindings.mjs";
import { registerTokenHotbarSettings } from "./configs/settings.mjs";
import TokenHotbar from "./hotbar/hotbar.mjs";

Hooks.once("init", async function() {
  registerTokenHotbarSettings();
  registerTokenHotbarKeybindings();
  if (game.settings.get("pth", "enableTokenHotbar")) CONFIG.ui.hotbar = TokenHotbar;
})