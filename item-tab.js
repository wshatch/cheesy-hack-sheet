
let activate = false

export default async function addSupplyContent(app, protoHtml) {
  const item = app.object
  const itemData = item.data.data
  if (item.actor && item.actor.permission < 3) { return }

  let html = protoHtml

  if (html[0].localName !== "div") {
    html = $(html[0].parentElement.parentElement);
  }

  const tabSelector = html.find("form nav.sheet-navigation.tabs");
  const supplyTabString = `<a class="item" data-group="primary" data-tab="ftd">FTD stats</a>`
  tabSelector.append($(supplyTabString));

  const templateString = "modules/cheesy-hack-sheet/templates/item-options.html";
  const settingsContainer = html.find(".sheet-body");

  const template = await renderTemplate(templateString, {
    flags: item.data.flags
  })
  settingsContainer.append(template);

  if (activate) {
      app._tabs[0].activate("supply")
      app.setPosition()
      activate = false
  }

  
  const newSection = settingsContainer.find(".item-cheesy-supply")
  newSection.find("input").change( (evt) => activate = true)
}
