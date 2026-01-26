export function registerTokenHotbarSettings() {
  game.settings.register("pth", "enableTokenHotbar", {
    scope: "user",
    config: true,
    type: Boolean,
    default: true,
    name: "Enable Token Hotbar"
  })
}