import WeaponPresenter from './weapon_presenter.js';
import SpellPresenter from './spell_presenter.js';
import ItemPresenter from './item_presenter.js';
import EncumberanceBar from './encumberance_bar.js';

export default class ActorPresenter {
  constructor(actor, owner, editable) {
    this.id = actor._id
    this.actor = game.actors.get(this.id)
    this.flags = actor.flags
    this.name = actor.name
    this.data = actor.data
    this.items = actor.items
    this.owner = owner
    this.editable = editable
  }

  get abilities() {
    return [ 
      {
        id: "wis",
        ...this.data.abilities.wis
      },
      {
        id: "cha",
        ...this.data.abilities.cha
      },
      {
        id: "int",
        ...this.data.abilities.int
      },
      {
        id: "con",
        ...this.data.abilities.con
      },
      {
        id: "dex",
        ...this.data.abilities.dex
      },
      {
        id: "str",
        ...this.data.abilities.str
      }
    ]
  }

  get inspiration(){
    return this.data.attributes.inspiration ? "Yes" : "No"
  }

  get resources(){
    const resources = Object.values(this.data.resources)

    if (resources.length == null || resources.length == 0) {
      return []
    }

    const filteredResources = resources
      .filter( resource => resource.label != "")
      .map( resource => ({
        title: resource.label,
        max: resource.max,
        value: resource.value 
      }))

    return filteredResources
  }

  get hasResources(){
    return this.resources.length > 0
  }

  get spellDc() {
    return this.data.attributes.spelldc
  }

  get spells() {
    const spells = this.items
    .filter(item => item.type == "spell")
    .reduce(this.groupSpells.bind(this), {})
    return spells
  }

  get preparedSpells() {
    return this.items
      .filter(item => item.type == "spell"  && (this.isPrepared(item) || this.isCantrip(item)))
      .reduce(this.groupSpells.bind(this), {})
  }

  get preparedSpellCount() {
    return this.items
      .filter(item => item.type == "spell" && this.isPrepared(item))
      .length
  }

  get maxPreparedSpells() {
    const preparedClasses = ["Druid", "Cleric", "Paladin", "Wizard"] 
    const levels = this.classes.reduce((levels, klass) => klass.levels + levels, 0)

    return levels == 0 ? "N/A" : this.spellMod + levels
  }

  get preparedCssClass() {
    return this.preparedSpellCount > this.maxPreparedSpells ? "overcount" : ""
  }

  groupSpells(spells, spell) {
    const spellLevel = spell.data.level
    const levelText = `Level ${spellLevel}`
    const title = spellLevel == 0 ? "Cantrips": levelText 
    const spellSlots = this.data.spells[`spell${spellLevel}`]


    if(spells[title] == null){
      const maxSpellSlots = spellSlots.max
      const currentSpellSlots = spellSlots.value

      spells[title] = {spells: [], maxSpellSlots, currentSpellSlots}
    }

    spells[title].spells.push(new SpellPresenter(spell, this.actor))

    return spells 
  }

  isCantrip(spell) {
    return spell.data.level == 0
  }

  isPrepared(spell) {
    return spell.data.preparation.prepared
  }

  get gold() {
    return this.data.currency.gp
  }

  get silver() {
    return this.data.currency.sp
  }

  get weapons(){
    return this.items
    .filter(item => item.type == "weapon" && item.data.equipped)
    .map(item => {
      const realItem = this.actor.getOwnedItem(item._id) 
      return new WeaponPresenter(realItem, this.actor, this.data.abilities, this.proficency)
    })
  }

  get maxSupplies(){
    return this.data.abilities.int.value
  }

  get maxLoad(){
    return this.data.abilities.str.value
  }

  get activeFeatures(){
    return this.items
    .filter(item => item.type == "feat" && item.data.activation.type != "")
    .map( item => {
      const realItem = this.actor.getOwnedItem(item._id) 
      const presenter = new ItemPresenter(realItem, this.actor)
      return presenter
    })
  }

  get maxMagicItems(){
    return this.data.abilities.wis.value
  }

  get currentHp(){
    return this.data.attributes.hp.value
  }
  
  get maxHp(){
    return this.data.attributes.hp.max
  }

  get tempHp(){
    return this.data.attributes.hp.temp || 0
  }

  get maxRetainers(){
    const maxRetainer = (this.data.abilities.cha.mod + this.data.details.level) - 5
    return maxRetainer < 0 ? 0 : maxRetainer
  }

  get perception(){
    return this.data.skills.prc.passive
  }

  get ac(){
    return this.data.attributes.ac.value
  }

  get hitDice(){
    return this.data.attributes.hd
  }

  get maxHitDice(){
    return this.data.details.level
  }

  get meleeAttack() {
    return this.mathSign(this.data.abilities.str.mod + this.proficency)
  }

  get rangeAttack() {
    return this.mathSign(this.data.abilities.dex.mod + this.proficency)
  }

  get proficency() {
    return this.data.attributes.prof
  }

  get spellAttack() {
    return this.mathSign(this.data.attributes.prof + this.spellMod)
  }

  get spellMod() {
    const spellAttr = this.data.attributes.spellcasting
    if (!spellAttr) return 0
    return this.data.abilities[spellAttr].mod
  }

  get renderSpells() {
    return Object.values(this.preparedSpells).length > 0
  }

  get resistances() {
    return this.data.traits.dr.value
  }

  get weaknesses() {
    return this.data.traits.dv.value
  }

  get immunities() {
    return this.data.traits.di.value.concat(this.data.traits.ci.value)
  }

  get xp() {
    return this.data.details.xp.value
  }

  get maxXp() {
    return this.data.details.xp.max
  }

  get features() {
    return this.items
    .filter(item => item.type == "feat")
    .map( item => {
      const realItem = this.actor.getOwnedItem(item._id) 
      const presenter = new ItemPresenter(realItem, this.actor)
      return presenter
    })
  }

  get mundaneItems() {
    const mundaneRarities = ["", "Common", "Uncommon"]
    const badTypes = ["weapon"]
    return this.items
      .filter(item => mundaneRarities.includes(item.data.rarity) && !badTypes.includes(item.type))
      .map(item => new ItemPresenter(this.actor.getOwnedItem(item._id), this.actor))
  }

  get equippedMundaneItems() {
    return this.mundaneItems.filter( item => item.equipped)
  }

  get magicalItems(){
    const mundaneRarities = ["", "Common", "Uncommon"]
    const badTypes = ["spell", "feat", "class", "weapon"]
    return this.items
      .filter(item => !mundaneRarities.includes(item.data.rarity) && !badTypes.includes(item.type))
      .map(item => new ItemPresenter(this.actor.getOwnedItem(item._id), this.actor))
  }

  mathSign(value) {
    const sign = value < 0 ? "-" : "+"
    return ` ${sign}${value}`
  }

  get supplies() {
    const supplies = this.actor.getFlag("cheesy-hack-sheet", "supplies")
    return supplies || 0
  }

  get classes(){
    this._classes = this._classes ||this.items
    .filter(item => item.type == "class")
    .map(item => ({
      levels: item.data.levels,
      subclass: item.data.subclass || "",
      name: item.name
    }))

    return this._classes
  }

  get encumberanceBar() {
    return new EncumberanceBar(this)
  }

  get allWeapons() {
    return this.items
    .filter(item => item.type == "weapon")
    .map(item => {
      const realItem = this.actor.getOwnedItem(item._id) 
      return new WeaponPresenter(realItem, this.actor, this.data.abilities, this.proficency)
    })
  }

  get inventory() {
    return {
      Weapons: this.allWeapons, 
      Mundane: this.mundaneItems,
      Magical: this.magicalItems
    }
  }
}

