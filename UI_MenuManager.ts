import { Component } from 'horizon/core';

type MenuContext = {
  path: string[]; // e.g. ["Plot", "Build", "Chairs"]
};

enum MenuLevel {
  Primary, //Context driven, e.g. PlotMenu, FishingMenu
  Sub, //e.g. Build, Food, Staff, Upgrades, Shop
  Category,
  Detail, //e.g. Chairs, Tables, Ovens under Build; or Food, Drinks under Food; or Staff  under Staff; or Upgrades under Upgrades; or Shop under Shop; or Fishing  under Fishing; or Fishing  under Fishing; or Farm  under Farm; etc.
}

export enum Primary_MenuType {
  PlotMenu = "PlotMenu",
  FishingMenu = "FishingMenu",
  FarmMenu = "FarmMenu",
}

export enum Sub_PlotType {
  BuildMode = "BuildMode",
  MenuEdit = "MenuEdit",
  Staff = "StaffMenu",
  Upgrades = "UpgradesMenu",
  Shop = "ShopMenu",
}

export enum Detail_Kitchen {
  ChairCatalog = "ChairCatalog",
  TableCatalog = "TableCatalog",
  OvenCatalog = "OvenCatalog",
  FridgeCatalog = "FridgeCatalog",
  SinkCatalog = "SinkCatalog",
  CounterCatalog = "CounterCatalog",
  DecorCatalog = "DecorCatalog",
}

let menuState: MenuContext = {
  path: [],
};

/**When player opens "Plot Menu", set level to Primary, path to ["Plot"]
menuState = { level: MenuLevel.Primary, path: ["Plot"] };
Then selects "Build", set level to Sub, path to ["Plot", "Build"]
menuState = { level: MenuLevel.Sub, path: ["Plot", "Build"] };
Then selects "Chairs", set level to Detail, path to ["Plot", "Build", "Chairs"]
menuState = { level: MenuLevel.Detail, path: ["Plot", "Build", "Chairs"] };

You can then:
Use menuState.level to determine what to close/open.
Use menuState.path.join(" > ") for breadcrumbs.
Use a stack-like approach to go back (menuState.path.pop()).
*/

class UI_MenuManager extends Component<typeof UI_MenuManager> {
  static propsDefinition = {};

  start() {

  }
}
Component.register(UI_MenuManager);