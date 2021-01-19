import ItemPresenter from "./item_presenter.js" 

export default class SpellPresenter extends ItemPresenter{
  constructor(item, actor) {
    super(item, actor)
    this.data = item.data
    this.actorData = actor.data.data
  }

  get components() {
    const components = this.item.data.components
    return Object.keys(components)
      .filter(key => components[key])
      .reduce((string, component) => string += component[0], "")
    this._components = this._components || this.item.labels.components.join('')
    return this._components
  }

  get prepared() {
    return !this.canPrepare || this.item.data.preparation.prepared ? "prepared" : "unprepared"
  }

  get name() {
    return this.item.name
  }

  get range() {
    if(this.item.labels == null) {
      return "N/A"
    }
    return this.item.labels.range
  }

  get canPrepare() {
    return this.item.data.preparation.mode == "prepared"
  }

  get preparationMode() {
    const prepString = this.item.data.preparation.mode
    return prepString.charAt(0).toUpperCase() + prepString.slice(1)
  }

  get damage() {
    const parts = this.item.data.level === 0 ? this.cantripScaling : this.damageParts

    if (parts.length == 0) return "N/A";

    const partsString = `${parts[0]} (${parts[1]})`
    
    return super.coerceDamageType.bind(this)(partsString)
  }
 

  get mod() {
    const itemCasting = this.actorData.attributes.spellcasting
    return this.actorData.abilities[itemCasting].mod
  }


  get cantripScaling(){
    const level = this.actorData.details.level
    const add = Math.floor((level + 1) / 6);

    if ( add === 0 || !this.damageParts || this.damageParts.length == 0) {
      return []
    }

    const damageParts = this.damageParts
    const diceCount = parseInt(damageParts[0][0]) + add

    damageParts[0].replace(damageParts[0][0], diceCount)
    return damageParts
  }

  get damageParts() {
    return this.item.data.damage.parts[0] || []
  }
}
