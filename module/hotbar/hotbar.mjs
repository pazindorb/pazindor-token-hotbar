import { openTokenHotbarConfig } from "./token-hotbar-config.mjs";

export default class TokenHotbar extends foundry.applications.ui.Hotbar { 
  constructor(options = {}) {
    super(options)
    this.tokenHotbar = game.settings.get("pazindor-token-hotbar", "tokenHotbar");
    this.filter = {} // TODO
  }

  /** @override */
  static PARTS = {
    hotbar: {
      root: true,
      template: "modules/pazindor-token-hotbar/template/hotbar.hbs"
    }
  };

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.actions.swap = this._onSwap;
    initialized.actions.config = this._onConfigTokenHotbar

    return initialized;
  }

  _attachFrameListeners() {
    super._attachFrameListeners();
    // this.element.addEventListener("dblclick", this._onDoubleClick.bind(this));
    // this.element.addEventListener("mousedown", this._onMouseDown.bind(this));
    this.element.addEventListener("mouseover", this._onHover.bind(this));
    this.element.addEventListener("mouseout", this._onHover.bind(this));
  }

  // ==================== CONTEXT =====================
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const tokens = PDE.utils.getSelectedTokens();
    let token = null;
    if (tokens && tokens.length === 1) token = tokens[0];

    if (this.tokenHotbar && token) {
      await this._prepareTokenContext(context, token);
    }
    else {
      this.actorId = ""; 
      this.tokenId = "";
      this.showTokenHotbar = false;
    };
    context.filter = this.filter;
    context.tokenHotbar = this.tokenHotbar;
    context.showTokenHotbar = this.showTokenHotbar;
    return context;
  }

  _getActorFrom(token) {
    const actorLink = token.document.actorLink;
    if (!actorLink && this.original) return game.actors.get(token.document.actorId);
    return token.actor;
  }

  async _prepareTokenContext(context, token) {
    this.showTokenHotbar = true;
    this.actor = this._getActorFrom(token);
    if (!this.actor) return;

    let actorConfig = this.actor.flags.tokenHotbar;
    if (!actorConfig) {
      actorConfig = prepareTokenHotbarActorConfig();
      this.actor.update({["flags.tokenHotbar"]: actorConfig})
    }

    this.actorId = this.actor.id;
    this.tokenId = token.id;
    context.actor = this.actor;
    context.original = this.original;

    const tokenHotbarSettings = game.settings.get("pazindor-token-hotbar", "tokenHotbarSettings");
    context.sectionA = await this._prepareSectionSlots("sectionA", tokenHotbarSettings, actorConfig);
    context.sectionB = await this._prepareSectionSlots("sectionB", tokenHotbarSettings, actorConfig);
    
    context.sectionARows = tokenHotbarSettings["sectionA"].rows;
    context.sectionBRows = tokenHotbarSettings["sectionB"].rows;
    context.effects = await this._prepareEffects(tokenHotbarSettings.effects);

    context.img = tokenHotbarSettings["displayToken"] ? token.document.texture.src : this.actor.img;
    context.health = this._prepareHealth(actorConfig);
    context.resources = this._prepareResources(actorConfig);
  }

  _prepareHealth() {
    const maxHpPath = game.settings.get("pazindor-token-hotbar", "maxHpPath") || "";
    const currentHpPath = game.settings.get("pazindor-token-hotbar", "currentHpPath") || "";
    const tempHpPath = game.settings.get("pazindor-token-hotbar", "tempHpPath") || "";

    const maxHP = PDE.utils.getValueFromPath(this.actor, maxHpPath);
    const currentHP = PDE.utils.getValueFromPath(this.actor, currentHpPath);
    const tempHP = PDE.utils.getValueFromPath(this.actor, tempHpPath);
    let hpPercent = Math.ceil(100 * currentHP/maxHP);
    if (isNaN(hpPercent)) hpPercent = 0; 

    return {
      percent: hpPercent,
      max: maxHP,
      current: currentHP,
      temp: tempHP,
      currentPath: currentHpPath,
      tempPath: tempHpPath
    }
  }

  _prepareResources(actorConfig) {
    if (actorConfig.resource1.path && actorConfig.resource2.path && actorConfig.resource3.path) {
      let content = "";
      content += this._resource(actorConfig.resource1, "resource-left-short");
      content += this._resource(actorConfig.resource3, "resource-middle");
      content += this._resource(actorConfig.resource2, "resource-right-short");
      return content;
    }
    if (actorConfig.resource1.path && actorConfig.resource2.path) {
      let content = "";
      content += this._resource(actorConfig.resource1, "resource-left");
      content += this._resource(actorConfig.resource2, "resource-right");
      return content;
    }
    if (actorConfig.resource1.path) {
      let content = "";
      content += this._resource(actorConfig.resource1, "resource-wide");
      return content;
    }
    return "";
  }

  _resource(resource, clazz) {
    const value = PDE.utils.getValueFromPath(this.actor, resource.path);

    return `
      <div class="${clazz}">
        <input data-cType="actor-numeric" data-path="${resource.path}" type="number" value="${value}"
        data-dtype="Number" data-tooltip="${resource.label}" style="background: linear-gradient(to bottom, ${resource.color}, #161616);">
      </div>
    `;
  }

  async _prepareSectionSlots(sectionKey, tokenHotbarSettings, actorConfig) {
    const section = actorConfig[sectionKey];
    const items = this.actor.items;

    const borderColor = tokenHotbarSettings.borderColor;
    const markers = tokenHotbarSettings.markers;
    const showCharges = tokenHotbarSettings.showCharges;

    const sc = tokenHotbarSettings[sectionKey];
    const size = sc.rows * sc.columns;
    const slots = [];
    for (let i = 0; i < size; i++) {
      const itemId = section[i];
      const original = items.get(itemId);
      const item = original ? {...original} : null;
      if (item) {
        // if (borderColor) this._borderColor(item);
        // if (markers) this._markers(item);
        // if (showCharges) this._charges(item);   
        // this._runFilter(item);
      }
      slots[i] = item || {filterOut: this.filter.type !== "none"}
      slots[i].slotKeybind = this._slotKeybind(i, sectionKey);
    }
    return slots;
  }

  _slotKeybind(index, sectionKey) {
    const section = sectionKey === "sectionA" ? "A" : "B";
    const keybind = game.keybindings.get("pazindor-token-hotbar", `tokenHotbar${section}${index}`)[0];
    if (!keybind) return null;

    let humanized = foundry.applications.sidebar.apps.ControlsConfig.humanizeBinding(keybind);
    humanized = humanized.replace("Control", "Ctrl");
    return humanized;
  }

  async _prepareEffects(effectsConfig) {
    const [active, disabled] = await this._prepareTemporaryEffects();
    const position = effectsConfig.position;
    const rowSize = effectsConfig.rowSize;
    let separator = true;
    if (active.length === 0) separator = false;
    if (!separator || active.length === rowSize) separator = false;

    const data = {
      position: position,
      active: active,
      disabled: disabled,
      rowSize: rowSize,
      separator: separator
    }
    return data;
  }

  async _prepareTemporaryEffects() {
    const actor = this.actor;
    const active = [];
    const disabled = [];

    for(const effect of actor.allApplicableEffects()) {
      if (effect.isTemporary) {
        if(effect.disabled) disabled.push(effect);
        else active.push(effect);
      }
    }
    return [active, disabled];
  }
  // ==================== CONTEXT =====================

  // ==================== ACTIONS =====================
  _onSwap(event, target) {
    this.tokenHotbar = !this.tokenHotbar;
    game.settings.set("pazindor-token-hotbar", "tokenHotbar", this.tokenHotbar);
    this.render();
  }

  _onConfigTokenHotbar(event, target) {
    if (this.actor) openTokenHotbarConfig(this.actor);
  }

  // ==================== ACTIONS =====================
  async _onRender(context, options) {
    if (context.tokenHotbar && context.showTokenHotbar) {
      this.element.classList.add("token-hotbar");
    }
    await super._onRender(context, options);

    if (context.tokenHotbar && context.showTokenHotbar) {
      // Add tooltip
      this.element.appendChild(PDE.TooltipCreator.getTooltipHtml());

      // Override drop behavior
      new foundry.applications.ux.DragDrop.implementation({
        dragSelector: ".slot.full",
        dropSelector: ".slot",
        callbacks: {
          dragstart: this._onDragStart.bind(this),
          drop: this._onDropOnTokenHotbar.bind(this)
        }
      }).bind(this.element);
    }
  }

  // ==================== CURSOR =====================
  async _onHover(event) {
    const target = this._getHoverTarget(event.target);
    const dataset = target.dataset;
    const hover = dataset.hover;

    if (hover === "tooltip") {
      const html = $(this.element);
      // Hide tooltip
      if (event.type !== "mouseover") {
        PDE.TooltipCreator.hideTooltip(event, html);
        return;
      }

      // Show tooltip
      let object;
      if (dataset.section)        object = this._getItemFromSlot(dataset.index, dataset.section);  // Get item
      else if (dataset.effectId)  object = this.actor.effects.get(dataset.effectId)                // Get effect
      else                        object = await fromUuid(dataset.uuid);                           // Get from uuid
      if (!object) return;

      const left = target.offsetLeft - 130;
      const bottom = dataset.effectId ? event.currentTarget.offsetHeight + 30
                      : target.parentElement.offsetHeight + 30

      const position = {
        maxHeight: "500px",
        minWidth: "300px",
        left: `${left}px`, 
        bottom: `${bottom}px`,
        top: ""
      }
      const options = {position: position};
      if (dataset.header) options.header = dataset.header;
      if (dataset.img) options.img = dataset.img;

      PDE.TooltipCreator.showTooltipFor(object, event, html, options) 
    }
  }

  _getHoverTarget(element) {
    if (element.id === "hotbar" || !element.parentElement) return element;
    if (element.dataset.hover) return element;
    return this._getHoverTarget(element.parentElement);
  }

  async _onDropOnTokenHotbar(event) {
    event.preventDefault();
    const dataset = event.target.dataset;
    const index = dataset.index;
    const section = dataset.section;
    if (!index || !section) return;

    const droppedData  = event.dataTransfer.getData('text/plain');
    if (!droppedData) return;
    const droppedObject = JSON.parse(droppedData);
    if (!droppedObject) return;

    switch (droppedObject.type) {
      case "Item": await this._onDropItem(droppedObject, index, section); break;
      case "Slot": await this._onDropSlot(droppedObject, index, section); break;
    }
  }

  async _onDropItem(dropped, index, section) {
    const itemId = dropped.uuid.replace(/^.*?Item\./, '');
    this.actor.update({[`flags.tokenHotbar.${section}.${index}`]: itemId});
  }

  async _onDropSlot(dropped, index, section) {
    this.actor.update({[`flags.tokenHotbar.${section}.${index}`]: dropped.itemId});
  }

  _onDragStart(event) {
    if (event.target.classList.contains('item-slot')) this._onDragItem(event);
  }

  _onDragItem(event) {
    const dataset = event.target.dataset;
    const index = dataset.index;
    const sectionKey = dataset.section;
    const itemId = this._getItemIdFromSlot(index, sectionKey);
    if (!itemId) return;

    const dragData = {
      type: "Slot",
      itemId: itemId
    }

    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    this.actor.update({[`flags.tokenHotbar.${sectionKey}.${index}`]: ""});
  }

  _getItemIdFromSlot(index, sectionKey) {
    if (index == undefined || !sectionKey) return;
    const section = this.actor.flags.tokenHotbar[sectionKey];
    const itemId = section[index];
    return itemId;
  }

  _getItemFromSlot(index, section) {
    const itemId = this._getItemIdFromSlot(index, section);
    if (!itemId) return;
    return this.actor.items.get(itemId);
  }
  // ==================== CURSOR =====================
}

function prepareTokenHotbarActorConfig() {
  return {
    sectionA: {},
    sectionB: {},
    resource1: {
      color: "#ffffff",
      path: "",
      label: ""
    },
    resource2: {
      color: "#ffffff",
      path: "",
      label: ""
    },
    resource3: {
      color: "#ffffff",
      path: "",
      label: ""
    },
  }
}