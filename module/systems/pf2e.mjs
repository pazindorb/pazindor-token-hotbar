export function pf2eSpecificSettings() {
  const maxHP = game.settings.get("pazindor-token-hotbar", "maxHpPath");
  if (!maxHP) game.settings.set("pazindor-token-hotbar", "maxHpPath", "system.attributes.hp.max");
  const currentHP = game.settings.get("pazindor-token-hotbar", "currentHpPath");
  if (!currentHP) game.settings.set("pazindor-token-hotbar", "currentHpPath", "system.attributes.hp.value");
  const tempHP = game.settings.get("pazindor-token-hotbar", "tempHpPath");
  if (!tempHP) game.settings.set("pazindor-token-hotbar", "tempHpPath", "system.attributes.hp.temp");
}

export function pf2eConfig() {
  // TODO
}