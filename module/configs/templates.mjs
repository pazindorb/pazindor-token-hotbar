export async function preloadHandlebarsTemplates() {
  return foundry.applications.handlebars.loadTemplates([
    "modules/pazindor-token-hotbar/template/token-hotbar/effects-tracker.hbs"
  ]);
};