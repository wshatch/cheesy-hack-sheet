import { DND5E } from "../../systems/dnd5e/module/config.js";
import ActorSheet5e from "../../systems/dnd5e/module/actor/sheets/base.js";
import ActorSheet5eCharacter from "../../systems/dnd5e/module/actor/sheets/character.js";
import ActorPresenter from './cheesy_actor_presenter.js';
import addSupplyContent from './item-tab.js';
import Actor5e from "../../systems/dnd5e/module/actor/entity.js";

export default class CheesyHack5eSheet extends ActorSheet5eCharacter {
  get template() {
    return 'modules/cheesy-hack-sheet/templates/cheesy-sheet.html'
  }
  
  async _render(force = false, options = {}) {
    await super._render(force, options);
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
          classes: ["cheesy", "sheet", "actor", "character"],
          blockFavTab: true,
          width: 945,
          height: 720
      });
  }

  getData() {
    const data = this.wrapCharacterData(super.getData())
    return data 
  }

  activateListeners(html) {
    super.activateListeners(html)

    const rollFunc = rollCb => async event => {
      event.preventDefault()
      const attr = event.currentTarget.dataset.attr
      rollCb(attr, {event: event})
    }

    html.find('.ability-save').click(rollFunc(this.actor.rollAbilitySave.bind(this.actor)))
    html.find('.ability-check').click(rollFunc(this.actor.rollAbilityTest.bind(this.actor)))
    html.find('.item-restock').click(this.onRestockItem.bind(this))
    html.find('.supplies').change(async (e) => {
      e.preventDefault()
      const actor = this.actor
      const value = e.target.value
      
      await actor.setFlag('cheesy-hack-sheet', 'supplies', value)
    })
  }
  
  wrapCharacterData(data) {
    const presenter = new ActorPresenter(data.actor, data.owner, data.editable)
    return presenter
  }

  onRestockItem(event) {
    event.preventDefault()
    const itemId = event.currentTarget.closest('.item').dataset.itemId
    const item = this.actor.getOwnedItem(itemId) 
    const restock = item.getFlag("cheesy-hack-sheet", "restock")
    const supplyCost= item.getFlag("cheesy-hack-sheet", "supply-cost")

    const d = Dialog.confirm({
      title: "Restock Item",
      content: `<p> Are you sure you want to restock ${item.name} for ${supplyCost} supplies? </p>`,
      yes: () => {
        const supplies = this.actor.getFlag('cheesy-hack-sheet', 'supplies')
        const newSupplies = supplies - supplyCost
        if (newSupplies < 0){
          throw "You don't have enough supplies to restock that item"
        }
        this.actor.setFlag('cheesy-hack-sheet', 'supplies', newSupplies)
        const quantity = item.data.data.quantity
        console.log("item quantity", quantity)

        item.update({"data.quantity": quantity + restock})
      },
      no: () => {},
      defaultYes: false
    })
  }

  _onItemDelete(event) {
    event.preventDefault()
    const itemId = event.currentTarget.closest('.item').dataset.itemId
    const item = this.actor.getOwnedItem(itemId) 

    const deleteCallback = this.actor.deleteOwnedItem.bind(this.actor)

    const d = Dialog.confirm({
      title: "Delete item",
      content: `<p> Are you sure you want to delete ${item.name}? </p>`,
      yes: () => deleteCallback(itemId),
      no:  () => {},
      defaultYes: false
    })
  }
}

const preloadTemplates = async function(){
  const templatePaths = [
    "modules/cheesy-hack-sheet/templates/parts/cheesy-main.html",
    "modules/cheesy-hack-sheet/templates/parts/cheesy-notes.html",
    "modules/cheesy-hack-sheet/templates/parts/cheesy-spells.html",
    "modules/cheesy-hack-sheet/templates/parts/cheesy-inventory.html",
    "modules/cheesy-hack-sheet/templates/parts/cheesy-features.html",
    "modules/cheesy-hack-sheet/templates/parts/cheesy-encumberance.html",
  ]
  return loadTemplates(templatePaths);
}

Hooks.once("init", () => {
  preloadTemplates()
})

Hooks.on("renderItemSheet5e", (app, html, data) => {
  console.log("render ItemSheet5e hook called")
  addSupplyContent(app, html, data)
})


Actors.registerSheet("dnd5e", CheesyHack5eSheet, {
  types: ["character"],
  makeDefault: true
});


//Hacks and overrides

//Keep old health after long rest
const oldLongRest = Actor5e.prototype.longRest
Actor5e.prototype.longRest = async function({dialog=true, chat=true}={}) {
  console.log("running overwrite for long rest")
  const superLongRest = oldLongRest.bind(this)
  const currentHp = this.data.data.attributes.hp.value

  const updateData = {
    "data.attributes.hp.value": currentHp
  }


  const result = await superLongRest({dialog, chat})
  this.update(updateData)

  return {
    ...result,
    dhp: currentHp
  }
}

//Spell progression for cantrips
const oldComputeSpellcastingProgression = Actor5e.prototype._computeSpellcastingProgression
Actor5e.prototype._computeSpellcastingProgression = function (actorData){
  const superComputeSpellProg =  oldComputeSpellcastingProgression.bind(this)

  if(actorData.type !== 'npc'){
    let currentCantripSpells = (actorData.data.spells["spell0"] || {}).value
    superComputeSpellProg(actorData)
    const cantripMax = computeCantripMax(actorData)
    // Set to max if it isn't set yet
    currentCantripSpells = currentCantripSpells || cantripMax
    actorData.data.spells["spell0"] = {value: currentCantripSpells, max: cantripMax}
  }
}

const computeCantripMax = (actorData) => {
  const spellLevels = actorData.items
    .filter( i => i.type === "class" && i.data.spellcasting !== "none") 
    .reduce( (acc, value) => acc + value.data.levels, 0)

  const spellAttr = actorData.data.attributes.spellcasting
  if (!spellAttr) {
    return 0
  }
  const spellMod = actorData.data.abilities[spellAttr].mod

  return 3 + spellMod + spellLevels
}

// consume cantrips

const oldUseSpell = Actor5e.prototype.useSpell
Actor5e.prototype.useSpell = async function(item, {configureDialog=true}={}) {
  const superOldUseSpell = oldUseSpell.bind(this)
  superOldUseSpell(item, {configureDialog})
  if (item.data.data.level != 0)  return;

  let consumeSlot = false
  let placeTemplate = false;

  const decrementCantrips = async function() {
    const slots = parseInt(this.data.data.spells.spell0.value)
    if ( slots === 0 || Number.isNaN(slots) ) {
      return ui.notifications.error(game.i18n.localize("DND5E.SpellCastNoSlots"));
    }

    await this.update({
      [`data.spells.spell0.value`]: Math.max(parseInt(slots) - 1, 0)
    });
  }.bind(this)

  if (configureDialog) {
    const d = Dialog.confirm({
      title : "Consume Cantrip Spell slot",
      content: "Do you want to use a cantrip spellslot?",
      yes: decrementCantrips
    })
  }
}
