import { openTokenHotbarConfig } from "./token-hotbar-config.mjs";

export default class TokenHotbar extends foundry.applications.ui.Hotbar { 

  static getItemIdFromSlot(index, sectionKey) {
    if (!ui.hotbar.showTokenHotbar) return;
    if (index == undefined || !sectionKey) return;
    const section = ui.hotbar.actor.flags.tokenHotbar[sectionKey];
    const itemId = section[index];
    return itemId;
  }

  static getItemFromSlot(index, sectionKey) {
    const itemId = TokenHotbar.getItemIdFromSlot(index, sectionKey);
    if (!itemId) return;
    return ui.hotbar.actor.items.get(itemId);
  }

  static itemSlotFilled(li) {
    const itemSlot = li.classList.contains("item-slot");
    if (!itemSlot) return false;
    const dataset = li.dataset;
    const item = TokenHotbar.getItemFromSlot(dataset.index, dataset.section);
    return item ?? false;
  }

  constructor(options = {}) {
    super(options)
    this.tokenHotbar = game.settings.get("pazindor-token-hotbar", "tokenHotbar");
    this.original = false;

    const filterOptions = PTH.filters;
    if (filterOptions) {
      this.filter = {
        index: 0,
        icon: "fas fa-border-all",
        label: "PTH.FILTER.NONE",
        options: [
          {
            label: "PTH.FILTER.NONE",
            icon: "fas fa-border-all",
            filter: item => true
          },
          ...PTH.filters
        ]
      }
    }

  }

  /** @override */
  static PARTS = {
    hotbar: {
      root: true,
      template: "modules/pazindor-token-hotbar/templates/hotbar.hbs"
    }
  };

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.actions.swap = this._onSwap;
    initialized.actions.config = this._onConfigTokenHotbar;
    initialized.actions.spendHP = this._onSpendHP;
    initialized.actions.regainHP = this._onRegainHP;
    initialized.actions.endTurn = this._onEndTurn;
    initialized.actions.filter = this._onFilterChange;
    initialized.actions.autofill = this._onAutofill;
    initialized.actions.original = this._onOriginal;
    initialized.actions.roll = this._onRoll;
    
    // Register system specific actions
    if (PTH.actions) {
      for (const action of PTH.actions) {
        initialized.actions[action.key] = (event) => action.action(this.actor, event);
      }
    }

    return initialized;
  }

  _attachFrameListeners() {
    super._attachFrameListeners();
    this.element.addEventListener("dblclick", this._onDoubleClick.bind(this));
    this.element.addEventListener("mousedown", this._onMouseDown.bind(this));
    this.element.addEventListener("mouseover", this._onHover.bind(this));
    this.element.addEventListener("mouseout", this._onHover.bind(this));
    this.element.addEventListener("change", this._onChange.bind(this));
  }

  _getContextMenuOptions() {
    const options = super._getContextMenuOptions();
    options[1].condition = li => !this.tokenHotbar;

    this._filterContextMenu(options);
    this._itemSlotContextMenu(options);
    
    return options;
  }
  // ================= CONTEXT MENU ===================
  _itemSlotContextMenu(options) {
    // Register system specific context menu options
    if (PTH.contextMenu) {
      for (const context of PTH.contextMenu) options.push(context);
    }

    // Register default settings
    options.push({
      name: "PTH.ITEM_SHEET",
      icon: '<i class="fa-solid fa-pen-to-square"></i>',
      condition: li => TokenHotbar.itemSlotFilled(li),
      callback: li => {
        const item = TokenHotbar.itemSlotFilled(li);
        if (item) item.sheet.render(true);
      }
    });
    options.push({
      name: "PTH.REMOVE_ITEM",
      icon: '<i class="fa-solid fa-xmark"></i>',
      condition: li => TokenHotbar.itemSlotFilled(li),
      callback: li => {
        const dataset = li.dataset;
        this.actor.update({[`flags.tokenHotbar.${dataset.section}.${dataset.index}`]: ""});
      }
    });
  }

  _filterContextMenu(options) {
    if (!this.filter) return;

    const filters = this.filter.options;
    for (let i = 0; i < filters.length; i++) {
      const filter = filters[i];
      options.push({
        name: filter.label,
        icon: `<i class="${filter.icon}"></i>`,
        condition: button => button.classList.contains("filter-button"),
        callback: () => this._onFilterChange(i)
      });
    }
  }

  // ================= CONTEXT MENU ===================

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
    this.actorLink = token.document.actorLink;
    if (!this.actorLink && this.original) return game.actors.get(token.document.actorId);
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
    context.actorLink = this.actorLink;

    const tokenHotbarSettings = game.settings.get("pazindor-token-hotbar", "tokenHotbarSettings");
    context.sectionA = this._prepareSectionSlots("sectionA", tokenHotbarSettings, actorConfig);
    context.sectionB = this._prepareSectionSlots("sectionB", tokenHotbarSettings, actorConfig);
    
    context.sectionARows = tokenHotbarSettings["sectionA"].rows;
    context.sectionBRows = tokenHotbarSettings["sectionB"].rows;
    context.effects = this._prepareEffects(tokenHotbarSettings.effects);

    context.img = tokenHotbarSettings["displayToken"] ? token.document.texture.src : this.actor.img;
    context.health = this._prepareHealth(actorConfig);
    context.resources = this._prepareResources(actorConfig);

    context.actions = PTH.actions;
    context.endTurnButton = this._isMyTurn();
    context.filter = this.filter;
    context.autofill = !!PTH.autofill;
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
    let tempPercent = Math.ceil(100 * (currentHP + tempHP)/maxHP);
    if (isNaN(tempPercent)) tempPercent = 0;

    return {
      percent: hpPercent,
      percentTemp: tempPercent,
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

  _prepareSectionSlots(sectionKey, tokenHotbarSettings, actorConfig) {
    const section = actorConfig[sectionKey];
    const items = this.actor.items;

    const sc = tokenHotbarSettings[sectionKey];
    const size = sc.rows * sc.columns;
    const slots = [];
    for (let i = 0; i < size; i++) {
      const itemId = section[i];
      const original = items.get(itemId);
      const item = original ? foundry.utils.deepClone(original) : null;
      if (item) {
        // this._markers(item);
        this._runFilter(item);
        this._charges(item);
      }
      slots[i] = item || {filterOut: true}
      slots[i].slotKeybind = this._slotKeybind(i, sectionKey);
    }
    return slots;
  }

  _runFilter(item) {
    if (!this.filter) return;
    const selected = this.filter.options[this.filter.index];
    item.filterOut = !selected.filter(item);
  }

  _charges(item) {
    if (!PTH.getItemCharges) return;
    const charges = PTH.getItemCharges(item);
    if (charges != null) item.showCharges = charges;
  }

  _slotKeybind(index, sectionKey) {
    const section = sectionKey === "sectionA" ? "A" : "B";
    const keybind = game.keybindings.get("pazindor-token-hotbar", `tokenHotbar${section}${index}`)[0];
    if (!keybind) return null;

    let humanized = foundry.applications.sidebar.apps.ControlsConfig.humanizeBinding(keybind);
    humanized = humanized.replace("Control", "Ctrl");
    return humanized;
  }

  _prepareEffects(effectsConfig) {
    const effects = this.actor.allApplicableEffects().filter(effect => effect.isTemporary);
    const data = {
      position: effectsConfig.position,
      effects: effects,
      rowSize: effectsConfig.rowSize,
    }
    return data;
  }

  _isMyTurn() {
    if (!this.actor.inCombat) return false;

    const combatant = game.combat.combatant;
    const token = this.actor.getActiveTokens()[0];
    if (token) combatant.tokenId === token.id;
    return combatant.actorId === this.actor.id;
  }
  // ==================== CONTEXT =====================

  // ==================== ACTIONS =====================
  _onRoll(event, target) {
    const dataset = target.dataset;
    this.rollItemSlot(dataset.index, dataset.section)
  }

  rollItemSlot(index, section) {
    const item = TokenHotbar.getItemFromSlot(index, section);
    if (item) PTH.rollItem(item);
  }

  _onMouseDown(event) {
    if (event.button === 0) this._onLeftClick(event);
    if (event.button === 1) this._onMiddleClick(event);
    if (event.button === 2) this._onRightClick(event);
  }

  _onLeftClick(event) {
    if (event.target.classList.contains("effect-img")) {
      const dataset = event.target.dataset;
      const effect = this._getEffect(dataset.effectId);
      if (effect) effect.update({disabled: !effect.disabled});
    }
  }

  _onMiddleClick(event) {
    const dataset = event.target.dataset;

    if (event.target.classList.contains("item-slot")) {
      const item = TokenHotbar.getItemFromSlot(dataset.index, dataset.section);
      if (item) item.sheet.render(true);
    }
    if (event.target.classList.contains("effect-img")) {
      const effect = this._getEffect(dataset.effectId);
      if (effect) effect.sheet.render(true);
    }
  }

  async _onRightClick(event) {
    const dataset = event.target.dataset;

    if (event.target.classList.contains("effect-img")) {
      const confirmed = await PDE.InputDialog.confirm(game.i18n.localize("PTH.EFFECT_DELETE"));
      if (!confirmed) return;
      const effect = this._getEffect(dataset.effectId);
      if (effect) effect.delete();
    }
  }

  _getEffect(effectId) {
    return this.actor.allApplicableEffects().find(effect => effect.id === effectId);;
  }

  _onDoubleClick(event) {
    if (!event.target.classList.contains("char-img")) return;
    if (this.actor) this.actor.sheet.render(true);
  }

  async _onChange(event) {
    const target = event.target;
    const dataset = target.dataset;
    const cType = dataset.ctype;
    const path = dataset.path;
    const value = parseInt(target.value) || 0;

    switch (cType) {
      case "actor-numeric": 
        await this.actor.update({[path]: value})
        break;
    }
    this.render();
  }
  
  _onSwap(event, target) {
    this.tokenHotbar = !this.tokenHotbar;
    game.settings.set("pazindor-token-hotbar", "tokenHotbar", this.tokenHotbar);
    this.render();
  }

  _onConfigTokenHotbar(event, target) {
    if (this.actor) openTokenHotbarConfig(this.actor);
  }

  _onSpendHP(event, target) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.actor) return;
    const currentHpPath = game.settings.get("pazindor-token-hotbar", "currentHpPath");
    const tempHpPath = game.settings.get("pazindor-token-hotbar", "tempHpPath");
    if (!currentHpPath) return;

    const current = foundry.utils.getProperty(this.actor, currentHpPath);
    const temp = foundry.utils.getProperty(this.actor, tempHpPath);
    if (temp) this.actor.update({[tempHpPath]: Math.max(0, temp - 1)});
    else this.actor.update({[currentHpPath]: Math.max(0, current - 1)});
    
  }

  _onRegainHP(event, target) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.actor) return;
    const currentHpPath = game.settings.get("pazindor-token-hotbar", "currentHpPath");
    const maxHpPath = game.settings.get("pazindor-token-hotbar", "maxHpPath");
    if (!currentHpPath || !maxHpPath) return;

    const current = foundry.utils.getProperty(this.actor, currentHpPath);
    const max = foundry.utils.getProperty(this.actor, currentHpPath);
    this.actor.update({[currentHpPath]: Math.max(max, current + 1)});
  }

  async _onEndTurn(event, target) {
    await game.combat.nextTurn();
    this.render();
  }

  _onFilterChange(index) {
    let newIndex = isNaN(index) ? this.#nextFilterIndex() : index;

    const newFilter = this.filter.options[newIndex];
    this.filter.index = newIndex;
    this.filter.icon = newFilter.icon,
    this.filter.label = newFilter.label,
    this.render();
  }

  #nextFilterIndex() {
    const max = this.filter.options.length;
    const index = this.filter.index;

    if (index + 1 >= max) return 0;
    return index + 1;
  }

  async _onAutofill() {
    if (!PTH.autofill) return;
    const items = PTH.autofill(this.actor);
    if (!items || items.length === 0) return;

    await this._clearSection(this.actor.flags.tokenHotbar.sectionA, "sectionA");
    await this._clearSection(this.actor.flags.tokenHotbar.sectionB, "sectionB");

    const tokenHotbarSettings = game.settings.get("pazindor-token-hotbar", "tokenHotbarSettings");
    const sca = tokenHotbarSettings.sectionA;
    const scb = tokenHotbarSettings.sectionB;
    const size = {
      A: sca.rows * sca.columns,
      B: scb.rows * scb.columns
    }
    const updateData = {
      sectionA: {},
      sectionB: {}
    };

    let section = size.A >= size.B ? "A" : "B";
    const full = {
      A: size.A === 0,
      B: size.B === 0
    }
    let counter = 0;
    for (const item of items) {
      if (counter > size[section]) {
        full[section] = true;
        if (section === "A" && !full.B) {
          section = "B";
          counter = 0;
        }
        else if (section === "B" && !full.A) {
          section = "A";
          counter = 0;
        }
        else {
          break;
        }
      }
      updateData[`section${section}`][counter] = item.id;
      counter++;
    }

    await this.actor.update({["flags.tokenHotbar"]: updateData});
  }

  async _clearSection(section, sectionKey) {
    const updateData = {}
    for (const key of Object.keys(section)) {
      updateData[`flags.tokenHotbar.${sectionKey}.${key}`] = "";
    }
    await this.actor.update(updateData);
  }

  _onOriginal() {
    this.original = !this.original; 
    this.render()
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
      if (dataset.section)        object = TokenHotbar.getItemFromSlot(dataset.index, dataset.section);   // Get item
      else if (dataset.effectId)  object = this.actor.effects.get(dataset.effectId)                       // Get effect
      else                        object = await fromUuid(dataset.uuid);                                  // Get from uuid
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
    const itemId = TokenHotbar.getItemIdFromSlot(index, sectionKey);
    if (!itemId) return;

    const dragData = {
      type: "Slot",
      itemId: itemId
    }

    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    this.actor.update({[`flags.tokenHotbar.${sectionKey}.${index}`]: ""});
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