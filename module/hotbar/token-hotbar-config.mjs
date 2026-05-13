import { BaseDialog } from "/modules/pazindor-dev-essentials/module/dialog/base-dialog.mjs";

export class TokenHotbarConfig extends BaseDialog {

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    this.data = actor.flags.tokenHotbar;
    this.settings = game.settings.get("pazindor-token-hotbar", "tokenHotbarSettings");
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "token-hotbar-config",
    classes: ["pth"],
    position: {width: 620},
    window: {
      title: "PTH.CONFIG_TITLE",
      icon: "fa-solid fa-gears",
    },
  }


  /** @override */
  static PARTS = {
    root: {
      template: "modules/pazindor-token-hotbar/templates/token-hotbar-config.hbs",
    }
  };

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.window.resizable = true;
    initialized.actions.save = this._onSave;
    initialized.actions.default = this._onDefault;
    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.data = this.data;
    context.settings = this.settings;
    context.sections = {
      sectionA: "Section A [Right]",
      sectionB: "Section B [Left]",
    }
    return context;
  }

  async _onSave(event, target) {
    event.preventDefault();
    await this.actor.update({["flags.tokenHotbar"]: this.data});
    await game.settings.set("pazindor-token-hotbar", "tokenHotbarSettings", this.settings);
    ui.hotbar.render();
    this.close();
  }

  async _onDefault(event, target) {
    event.preventDefault();
    this.data.resource1 = {
      color: game.settings.get("pazindor-token-hotbar", "resource1Color"),
      path: game.settings.get("pazindor-token-hotbar", "resource1Path"),
      label: game.settings.get("pazindor-token-hotbar", "resource1Name")
    },
    this.data.resource2 = {
      color: game.settings.get("pazindor-token-hotbar", "resource2Color"),
      path: game.settings.get("pazindor-token-hotbar", "resource2Path"),
      label: game.settings.get("pazindor-token-hotbar", "resource2Name")
    },
    this.data.resource3 = {
      color: game.settings.get("pazindor-token-hotbar", "resource3Color"),
      path: game.settings.get("pazindor-token-hotbar", "resource3Path"),
      label: game.settings.get("pazindor-token-hotbar", "resource3Name")
    }
    this.render();
  }
}

/**
 * Opens Transfer Dialog popup.
 */
export function openTokenHotbarConfig(actor, options={}) {
  new TokenHotbarConfig(actor, options).render(true);
}