export default class EncumberanceBar {
  constructor(actorPresenter) {
    this.actorPresenter = actorPresenter 
  }

  get magicalItemsLoad() {
    this._magicalItemsLoad = this._magicalItemsLoad || this._calculateLoad(this.actorPresenter.magicalItems)
    return this._magicalItemsLoad
  }

  _calculateLoad(items){
    return items
      .filter(item => item.equipped)
      .reduce((acc, item) => acc + item.load, 0)
  }

  get mundaneItemsLoad() {
    this._mundaneItemsLoad = this._mundaneItemsLoad || this._calculateLoad(this.actorPresenter.mundaneItems)
    return this._mundaneItemsLoad
  }

  get weaponsLoad() {
    return this.actorPresenter.weapons.reduce((acc, item) => acc + item.load, 0)
  }

  get suppliesLoad() {
    return Math.round(this.actorPresenter.supplies / 5.0)
  }

  get totalLoad() {
    return this.magicalItemsLoad + this.mundaneItemsLoad + this.weaponsLoad  + this.suppliesLoad + this.goldLoad
  }

  get goldLoad() {
    return Math.round(this.actorPresenter.gold / 500)
  }

  get maxLoad() {
    return this.actorPresenter.maxLoad
  }

  get encumbered() {
    return this.totalLoad > this.maxLoad ? "encumbered" : ""
  }

  get magicalItemsPercentage() {
    return (this.magicalItemsLoad / this.maxLoad) * 100
  }

  get mundaneItemsPercentage() {
    return (this.mundaneItemsLoad / this.maxLoad) * 100
  }

  get weaponsPercentage() {
    return (this.weaponsLoad / this.maxLoad) * 100
  }

  get suppliesPercentage() {
    return (this.suppliesLoad / this.maxLoad) * 100
  }

  get goldPercentage() {
    return (this.goldLoad / this.maxLoad) * 100
  }

  get freeLoad() {
    return Math.max((this.maxLoad - this.totalLoad), 0)
  }

  get freePercentage() {
    return (this.freeLoad / this.maxLoad) * 100
  }
}
