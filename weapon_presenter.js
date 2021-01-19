import Item5e from "../../systems/dnd5e/module/item/entity.js";
import ItemPresenter from "./item_presenter.js" 

export default class WeaponPresenter extends ItemPresenter{
  constructor(weapon, actor, abilities, proficency) {
    super(weapon, actor)
    this.physicalType = "physical"
    this.abilities = abilities
    this.proficency = proficency
    this.data = weapon.data.data
  }

  get damage() {
    return this.data.damage.parts
      .map( i => `${i[0]} (${i[1]})`)
      .map(super.coerceDamageType.bind(this))
      .join(",")
  }

  get attack() {
    return this.weapon.attackBonus + this.proficency + this.mod  
  }

  get mod() {
    const attributes = ['str', 'dex', 'con', 'int', 'wis', 'cha']
    this._mod = this._mod || (() => {
      if (attributes.includes(this.data.ability)){
        const attr = this.data.ability
        return Math.max(this.abilities[attr].mod, 0)
      }

      if(this.data.actionType == 'rwak') {
        return Math.max(this.abilities.dex.mod, 0)
      }

      if(this.data.properties.fin) {
        return Math.max(this.abilities.dex.mod, this.abilities.str.mod, 0)
      }

      return Math.max(this.abilities.str.mod, 0)
    })()

    return this._mod
  }
}
