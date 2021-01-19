export default class ItemPresenter {
  constructor(item, actor) {
    this.item = item
    this.actor = actor
  }

  get id(){
    return this.item._id
  }

  get range() {
    return this.item.labels.range
  }

  get image(){
    const image = this.item.img || this.item.data.img
    return image
  }

  get description() {
    return this.item.data.data.description.value
  }

  get name(){
    return this.item.name
  }

  get equipped() {
    return this.item.data.data.equipped
  }

  get charges(){
    const uses = this.item.data.uses

    if(uses) {
      return uses.value
    }

    const consume = this.item.data.data.consume
    if(!consume) return "N/A"
    const ammoId = consume.target
    const ammoObj = this.actor.getOwnedItem(ammoId)
    if(!ammoObj) return "N/A";

    return ammoObj.data.data.quantity
  }

  get restockable() {
    const cost = this.item.getFlag("cheesy-hack-sheet", "supply-cost")
    return cost && cost > 0
  }

  get durability() {
    return this.item.getFlag("cheesy-hack-sheet", "durability") || "N/A"
  }

  get broken() {
    return this.durability == 0
  }

  get load() {
    const quantity = this.item.data.data.quantity
    const weight = this.item.data.data.weight * quantity
    return Math.round(weight / 5)
  }
 
  coerceDamageType(string) {
    const physicalRegex = /slashing|piercing|bludgeoning/gi;
    const modRegex = /@mod/gi
    return string
      .replace(physicalRegex, this.physicalType)
      .replace(modRegex, this.mod)
  }
}
