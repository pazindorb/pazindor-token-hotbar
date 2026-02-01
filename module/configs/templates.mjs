export async function preloadHandlebarsTemplates() {
  return foundry.applications.handlebars.loadTemplates([
    "modules/pazindor-token-hotbar/templates/token-hotbar/effects-tracker.hbs"
  ]);
};