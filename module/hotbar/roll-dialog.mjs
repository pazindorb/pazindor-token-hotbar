import { BaseDialog } from "/modules/pazindor-dev-essentials/module/dialog/base-dialog.mjs";

export class RollDialog extends BaseDialog {

  constructor(actor, rolls, options = {}) {
    super(options);
    this.selectOptions = options.selectOptions || {};
    this.actor = actor;
    this.rolls = rolls;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "roll-dialog",
    classes: ["pth"],
    position: {width: "auto"},
    window: {
      title: "PTH.BASIC_ROLL.TITLE",
      icon: "fa-solid fa-dice",
    },
  }

  /** @override */
  static PARTS = {
    root: {
      template: "modules/pazindor-token-hotbar/template/roll-dialog.hbs",
      scrollable: [".scrollable"]
    }
  };

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.actions.roll = this._onRoll;
    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.rolls = this.rolls;
    return context;
  }

  async _onRoll(event) {
    event.preventDefault();
    const dataset = event.target.dataset;
    const indexA = dataset.indexA;
    const indexB = dataset.indexB;
    this.rolls[indexA][indexB].roll(this.actor, event);
    this.close();
  }
}