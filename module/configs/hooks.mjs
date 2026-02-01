export function registerHotbarRefreshHooks() {
  Hooks.on('controlToken', () => {if (ui.hotbar) ui.hotbar.render()});
  Hooks.on('updateActor', () => {if (ui.hotbar) ui.hotbar.render()});

  Hooks.on("createItem", (item) => {if (ui.hotbar && hasActorParent(item)) ui.hotbar.render()});
  Hooks.on("updateItem", (item) => {if (ui.hotbar && hasActorParent(item)) ui.hotbar.render()});
  Hooks.on("deleteItem", (item) => {if (ui.hotbar && hasActorParent(item)) ui.hotbar.render()});

  Hooks.on("createActiveEffect", (effect) => {if (ui.hotbar && hasActorParent(effect)) ui.hotbar.render()});
  Hooks.on("updateActiveEffect", (effect) => {if (ui.hotbar && hasActorParent(effect)) ui.hotbar.render()});
  Hooks.on("deleteActiveEffect", (effect) => {if (ui.hotbar && hasActorParent(effect)) ui.hotbar.render()});
}

function hasActorParent(object) {
  if (object.parent) return hasActorParent(object.parent);
  return object instanceof Actor;
}