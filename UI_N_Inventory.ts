import { Asset, AudioGizmo, CodeBlockEvents, Component, Entity, LocalEvent, MeshEntity, Player, PlayerDeviceType, PlayerVisibilityMode, PropTypes, TextureAsset } from "horizon/core";
import { Binding, DynamicList, Image, ImageSource, Pressable, ScrollView, Text, TextStyle, UIComponent, UINode, View, ViewProps, ViewStyle } from "horizon/ui";
//import { colorBackpack, colorBlaster, colorHelmet, colorJets, defaultColorBackpack, defaultColorBlaster, defaultColorHelmet, defaultColorJets, PlayerStats } from "PlayerManagerWearables";

type artefactPPV = {
  foundItemIds: string[];
};

type flowersPPV = {
  foundItemIds: string[];
};

export interface InventoryData {
  name: string;
  category: string;
  assetTextureId: string;
  assetId?: string | null;
  description?: string;
  button?: boolean;
  buttonText?: string | null;
  color?: string | null;
}

type ItemGroup = {
  name: string;
  assetTextureId: string;
  items: InventoryData[];
};

interface LayoutGroup {
  name: string;
  iconTextureId: string;
}

export const NULL_ITEM: InventoryData = {
  assetId: "null",
  assetTextureId: "null",
  category: "null",
  description: "null",
  name: "null",
  button: false,
  buttonText: null,
};

export const ItemEvents = {
  ItemFound: new LocalEvent<{ player: Player; assetTextureId: string }>("ItemFound"),
  SetItem: new LocalEvent<{ item: InventoryData }>("SetItem"),
  //EquipItem: new LocalEvent<{ player: Player, item: InventoryData }>("EquipItem")
  EquipArtifact: new LocalEvent<{ player: Player; item: InventoryData }>("EquipArtifact"),
};

export const itemGroup1: ItemGroup = {
  name: "flowers",
  assetTextureId: "1113972000743060",
  items: [
    {
      name: "Pink", // Use the string representation of the BigInt for display
      category: "Tulip",
      description: "Pink Tulip Description",
      assetTextureId: "1113972000743060",
    },
    {
      name: "Red",
      category: "Tulip",
      description: "Description of Art N 2",
      assetTextureId: "3920307171542653",
    },
    {
      name: "Yellow",
      category: "Tulip",
      description: "Description of Art N 2",
      assetTextureId: "2131894053899408",
    },
    {
      name: "Pink",
      category: "Pansy",
      description: "Description of Art N 2",
      assetTextureId: "1167073981748676",
    },
    {
      name: "Blue",
      category: "Pansy",
      description: "Description of Art N 2",
      assetTextureId: "684631844094778",
    },
    {
      name: "Orange",
      category: "Lily",
      description: "Description of Orange Lily",
      assetTextureId: "677073901491269",
    },
    {
      name: "Violet",
      category: "Viola",
      description: "Description of Blue Pansy",
      assetTextureId: "629572849997901",
    },
    {
      name: "Pink", // Use the string representation of the BigInt for display
      category: "Lily",
      description: "Pink lily Description",
      assetTextureId: "1194689875643087",
    },
    {
      name: "Yellow",
      category: "Lily",
      description: "Description of Art N 2",
      assetTextureId: "634475509493187",
    },
    {
      name: "Yellow",
      category: "Tulip",
      description: "Description of Art N 2",
      assetTextureId: "2131894053899408",
    },
    {
      name: "Pink",
      category: "Pansy",
      description: "Description of Art N 2",
      assetTextureId: "1167073981748676",
    },
    {
      name: "Blue",
      category: "Pansy",
      description: "Description of Art N 2",
      assetTextureId: "684631844094778",
    },
  ],
};

// export const itemGroup1: ItemGroup = {
//   name: "Artifacts",
//   assetTextureId: "9560809057305701",
//   items: [
//     {
//       name: "Gravlens", // Use the string representation of the BigInt for display
//       category: "Artifacts",
//       description: "Bends light to reveal hidden paths.",
//       assetTextureId: "9560809057305701",
//       assetId: "1255599585904606",
//       button: true,
//       buttonText: 'test',
//     },
//     {
//       name: "Phigem",
//       category: "Artifacts",
//       description: "Shifts between dimensions when touched.",
//       assetTextureId: "2038001273377989",
//       assetId: "2136484810147825",
//       button: false,
//       buttonText: null,
//     },
//     {
//       name: "Voidgem",
//       category: "Artifacts",
//       description: "Emits a low hum that warps gravity.",
//       assetTextureId: "1014621473930002",
//       assetId: "1794476827947008",
//       button: false,
//       buttonText: null,
//     },
//     {
//       name: "Sunbit",
//       category: "Artifacts",
//       description: "Holds residual energy from a dying star.",
//       assetTextureId: "998482589045579",
//       assetId: "664438906214228",
//       button: false,
//       buttonText: null,
//     },
//     {
//       name: "Chrono",
//       category: "Artifacts",
//       description: "Ticks faintly—slows time around it.",
//       assetTextureId: "538107398983342",
//       assetId: "978962204055440",
//       button: false,
//       buttonText: null,
//     },

//     {
//       name: "Energon",
//       category: "Artifacts",
//       description: "A crystal that pulses with energy.",
//       assetTextureId: "1284626176688663",
//       assetId: "1412830979857523",
//       button: false,
//       buttonText: null,
//     },
//     {
//       name: "Spirits",
//       category: "Artifacts",
//       description: "A swirling mass of ethereal energy.",
//       assetTextureId: "1270107244620257",
//       assetId: "1412830979857523",
//       button: false,
//       buttonText: null,
//     },
//     {
//       name: "Spirits",
//       category: "Artifacts",
//       description: "A swirling mass of ethereal energy.",
//       assetTextureId: "1270107244620257",
//       assetId: "1412830979857523",
//       button: false,
//       buttonText: null,
//     },
//     // {
//     //   name: "Test",
//     //   category: "Artifacts",
//     //   description: "A swirling mass of ethereal energy.",
//     //   assetTextureId: "673521251942601",
//     //   assetId: "1412830969857523",
//     //   button: false,
//     //   buttonText: null,
//     // },

//   ]
// }

export const itemGroup2: ItemGroup = {
  name: "tab2",
  assetTextureId: "1404946297624214",
  items: [
    {
      name: "Helmet", // Use the string representation of the BigInt for display
      category: "Helmet",
      description: "",
      assetTextureId: "1404946297624214",
      assetId: null,
      button: true,
      buttonText: "Default",
      color: null,
    },
    {
      name: "Red", // Use the string representation of the BigInt for display
      category: "Helmet",
      description: "Red Helmet",
      assetTextureId: "1404946297624214",
      assetId: null,
      button: true,
      buttonText: "Red",
      color: "#ff0000",
    },
    {
      name: "Blue",
      category: "Helmet",
      description: "Blue Helmet",
      assetTextureId: "1404946297624214",
      assetId: null,
      button: true,
      buttonText: "Blue",
      color: "#0000ff",
    },
    {
      name: "Yellow",
      category: "Helmet",
      description: "Yellow Helmet",
      assetTextureId: "1404946297624214",
      assetId: null,
      button: false,
      buttonText: "Yellow",
      color: "#ffff00",
    },
    // {
    //   name: "Orange", // Use the string representation of the BigInt for display
    //   category: "Helmet",
    //   description: "Orange Helmet",
    //   assetTextureId: "1404946297624214",
    //   assetId: null,
    //   button: true,
    //   buttonText: 'Orange',
    //   color: '#ff4c05',
    // },
    {
      name: "Lime",
      category: "Helmet",
      description: "Lime Helmet",
      assetTextureId: "1404946297624214",
      assetId: null,
      button: false,
      buttonText: "Lime",
      color: "#5eff00",
    },
    // {
    //   name: "Magenta",
    //   category: "Helmet",
    //   description: "Magenta Helmet",
    //   assetTextureId: "1404946297624214",
    //   assetId: null,
    //   button: false,
    //   buttonText: 'Magenta',
    //   color: '#fa0089',
    // },
    {
      name: "Purple",
      category: "Helmet",
      description: "Purple Helmet",
      assetTextureId: "1404946297624214",
      assetId: null,
      button: true,
      buttonText: "Purple",
      color: "#800080",
    },
    {
      name: "Turquoise",
      category: "Helmet",
      description: "Turquoise Helmet",
      assetTextureId: "1404946297624214",
      assetId: null,
      button: true,
      buttonText: "Turquoise",
      color: "#04ffd5",
    },

    {
      name: "Black",
      category: "Helmet",
      description: "Black Helmet",
      assetTextureId: "1404946297624214",
      assetId: null,
      button: true,
      buttonText: "Black",
      color: "#000000",
    },

    // ---- Backpack items ---
    {
      name: "Default", // Use the string representation of the BigInt for display
      category: "Backpack",
      description: "Red Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: false,
      buttonText: "Default",
      color: null,
    },

    {
      name: "Red", // Use the string representation of the BigInt for display
      category: "Backpack",
      description: "Red Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: false,
      buttonText: "Red",
      color: "#ff0000",
    },
    {
      name: "Blue",
      category: "Backpack",
      description: "Blue Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Blue",
      color: "#0000ff",
    },
    {
      name: "Purple",
      category: "Backpack",
      description: "Purple Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Purple",
      color: "#800080",
    },
    {
      name: "Yellow", // Use the string representation of the BigInt for display
      category: "Backpack",
      description: "Yellow Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Yellow",
      color: "#fffb00",
    },
    {
      name: "Turquoise",
      category: "Backpack",
      description: "Turquoise Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Turquoise",
      color: "#04ffd5",
    },
    {
      name: "Green",
      category: "Backpack",
      description: "Green Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Green",
      color: "#05fa19",
    },
    {
      name: "Black",
      category: "Backpack",
      description: "Black Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Black",
      color: "#000000",
    },

    // ---- Jets items ---

    {
      name: "Default",
      category: "Jets",
      description: "",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Default",
      color: null,
    },
    {
      name: "Blue",
      category: "Jets",
      description: "Blue Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Blue",
      color: "#0000ff",
    },
    {
      name: "Red",
      category: "Jets",
      description: "Red Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Red",
      color: "#ff0000",
    },
    {
      name: "Purple",
      category: "Jets",
      description: "Purple Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Purple",
      color: "#800080",
    },
    {
      name: "Yellow", // Use the string representation of the BigInt for display
      category: "Jets",
      description: "Yellow Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Yellow",
      color: "#fffb00",
    },
    {
      name: "Turquoise",
      category: "Jets",
      description: "Turquoise Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Turquoise",
      color: "#04ffd5",
    },
    {
      name: "Green",
      category: "Jets",
      description: "Green Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Green",
      color: "#05fa19",
    },
    {
      name: "Black",
      category: "Jets",
      description: "Black Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Black",
      color: "#000000",
    },

    // ---- Blaster items ---

    // {
    //   name: "Default", // Use the string representation of the BigInt for display
    //   category: "Blaster",
    //   description: "",
    //   assetTextureId: "1206871497780136",
    //   assetId: null,
    //   button: true,
    //   buttonText: 'Default',
    //   color: null,
    // },
    // {
    //   name: "Blue",
    //   category: "Blaster",
    //   description: "Blue Backpack",
    //   assetTextureId: "1206871497780136",
    //   assetId: null,
    //   button: true,
    //   buttonText: 'Blue',
    //   color: '#0000ff',
    // },
    // {
    //   name: "Red",
    //   category: "Blaster",
    //   description: "Red Backpack",
    //   assetTextureId: "1206871497780136",
    //   assetId: null,
    //   button: true,
    //   buttonText: 'Red',
    //   color: '#ff0000',
    // },
    // {
    //   name: "Purple",
    //   category: "Blaster",
    //   description: "Purple Backpack",
    //   assetTextureId: "1206871497780136",
    //   assetId: null,
    //   button: true,
    //   buttonText: 'Purple',
    //   color: '#800080',
    // },
  ],
};

export const itemGroup3: ItemGroup = {
  name: "tab3",
  assetTextureId: "1424737355353818",
  items: [
    {
      name: "Red", // Use the string representation of the BigInt for display
      category: "Backpack",
      description: "Red Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: false,
      buttonText: "Yellow",
      color: "#ff0000",
    },
    {
      name: "Blue",
      category: "Backpack",
      description: "Blue Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Blue",
      color: "#0000ff",
    },
    {
      name: "Purple",
      category: "Backpack",
      description: "Purple Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Purple",
      color: "#800080",
    },
    {
      name: "Yellow", // Use the string representation of the BigInt for display
      category: "Backpack",
      description: "Yellow Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Yellow",
      color: "#fffb00",
    },
    {
      name: "Turquoise",
      category: "Backpack",
      description: "Turquoise Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Turquoise",
      color: "#04ffd5",
    },
    {
      name: "Green",
      category: "Backpack",
      description: "Green Backpack",
      assetTextureId: "1206871497780136",
      assetId: null,
      button: true,
      buttonText: "Green",
      color: "#05fa19",
    },
    // {
    //   name: "Silver",
    //   category: "Backpack",
    //   description: "Silver Backpack",
    //   assetTextureId: "1206871497780136",
    //   assetId: null,
    //   button: true,
    //   buttonText: 'Silver',
    //   color: null,
    // },
  ],
};

export const layoutGroups: LayoutGroup[] = [
  {
    name: "tab1",
    iconTextureId: "1113972000743060",
  },
  {
    name: "tab2",
    iconTextureId: "1767501717138360",
  },
  // {
  //   name: "tab3",
  //   iconTextureId: "1206871497780136"
  // }
];

const categoryImageMap: Record<string, string> = {
  Helmet: "9597156110385711",
  Backpack: "3020150408165456",
  Blaster: "24145829305027120", // replace with actual texture ID
  Jets: "1941506576648090", // replace with actual texture ID
};

const styles = {
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  } as ViewStyle,
  blockContainer: {
    alignItems: "center",
    //width: '32%',
    width: "100%",
    //height: 164,
    // height: '70%',
    //borderColor: "#f4c93d",
    //borderWidth: 3,
    //borderRadius: 10,
    padding: 5,
    //margin: 5,
    //backgroundColor: 'white',
  } as ViewStyle,
  groupContainer: {
    flexDirection: "row",
    //padding: 5,
    justifyContent: "flex-start",
    width: "100%",
  } as ViewStyle,
  description: {
    color: "blue",
    fontSize: 16,
    textAlign: "center",
  } as TextStyle,
  button: {
    marginTop: 10,
  } as ViewStyle,
};

const COLOR_CHANGE_COST = 10;

////////
//
// Manager
//
////////

export class Manager extends Component<typeof Manager> {
  static propsDefinition = {
    numTasks: { type: PropTypes.Number, default: 3 },
  };

  itemEntities: Entity[] = [];
  itemTasks: InventoryData[] = [];
  public itemData = [] as InventoryData[];

  override start() {
    this.itemEntities = this.world.getEntitiesWithTags(["itemTag"]);
    console.log(`Found ${this.itemEntities.length} item entities`);
    const itemDataCopy = itemGroup1.items.slice();
    this.itemEntities.forEach((entity) => {
      const item = this.getAndRemoveRandomItemFromArray(itemDataCopy);
      if (item) {
        this.itemData.push(item);
        this.sendLocalEvent(entity, ItemEvents.SetItem, { item });
      }
    });
    const tempItemData = this.itemData.slice();
    for (let i = 0; i < this.props.numTasks; i++) {
      const index = Math.floor(Math.random() * tempItemData.length);
      const task = tempItemData.splice(index, 1)[0];
      this.itemTasks.push(task);
    }
  }

  private getAndRemoveRandomItemFromArray<T>(array: T[]): T | undefined {
    if (array.length > 0) {
      const index = Math.floor(Math.random() * array.length);
      return array.splice(index, 1)[0];
    } else {
      return undefined;
    }
  }
}
Component.register(Manager);

// export class Manager extends Component<typeof Manager> {
//   static propsDefinition = {
//     numTasks: { type: PropTypes.Number, default: 3 },
//   };

//   itemEntities: Entity[] = [];
//   itemTasks: InventoryData[] = [];
//   public itemData = [] as InventoryData[];

//   override start() {

//     const players = this.world.getPlayers();
//     for (const player of players) {
//       const stats = this.world.persistentStorage.getPlayerVariable<flowersPPV>(player, 'PUBLIC_ASSETS:flowersPPV');
//       const foundIds = stats?.foundItemIds ?? [];
//       for (const assetTextureId of foundIds) {
//         this.sendLocalBroadcastEvent(ItemEvents.ItemFound, { player, assetTextureId });
//       }
//     }

//     this.itemEntities = this.world.getEntitiesWithTags(["itemTag"]);
//     console.log(`Found ${this.itemEntities.length} item entities`);
//     const itemDataCopy = itemGroup1.items.slice();
//     this.itemEntities.forEach((entity) => {
//       const item = this.getAndRemoveRandomItemFromArray(itemDataCopy);

//       if (item) {
//         this.itemData.push(item);
//         this.sendLocalEvent(entity, ItemEvents.SetItem, { item });
//       }
//     });

//     const tempItemData = this.itemData.slice();
//     for (let i = 0; i < this.props.numTasks; i++) {
//       const index = Math.floor(Math.random() * tempItemData.length);
//       const task = tempItemData.splice(index, 1)[0];
//       this.itemTasks.push(task);
//     }
//   }

//   private getAndRemoveRandomItemFromArray<T>(array: T[]): T | undefined {
//     if (array.length > 0) {
//       const index = Math.floor(Math.random() * array.length);
//       return array.splice(index, 1)[0];
//     } else {
//       return undefined;
//     }
//   }
// }
// Component.register(Manager);

class Inventory extends UIComponent<typeof Inventory> {
  static propsDefinition = {
    tabSwitchSound: { type: PropTypes.Entity }, // Add this
    buttonClickSound: { type: PropTypes.Entity }, // Add this
  };

  // protected panelHeight = 400;
  // protected panelWidth = 400;
  // create bindings for inventory items
  private currentSelectedItem: Binding<InventoryData> = new Binding(NULL_ITEM);
  private selectedLayoutGroup: Binding<number> = new Binding(0);
  private selectedItemCategory: Binding<string> = new Binding("");
  private groupBindings: Binding<ItemGroup[]> = new Binding<ItemGroup[]>([]);
  private foundItems: Binding<boolean>[][] = [];
  private backpackBinding: Binding<boolean> = new Binding(false);
  private isMenuOpen: boolean = false;
  private itemGroups: ItemGroup[] = [];
  private buttonTextBindings: Map<string, Binding<string>> = new Map();
  private equippedHelmetColor: Binding<string> = new Binding("");
  private equippedBackpackColor: Binding<string> = new Binding("");
  private equippedBlasterColor: Binding<string> = new Binding("");
  private equippedJetsColor: Binding<string> = new Binding("");
  private selectedItemByPlayer = new Map<Player, InventoryData>();

  private playTabSwitchSound(player: Player) {
    const sfx = this.props.tabSwitchSound?.as(AudioGizmo);
    if (sfx) {
      sfx.play({ players: [player], fade: 0 });
    }
  }

  private playButtonClickSound(player: Player) {
    const sfx = this.props.buttonClickSound?.as(AudioGizmo);
    if (sfx) {
      sfx.play({ players: [player], fade: 0 });
    }
  }
  private getCategoryImage(category: string): ImageSource | null {
    const textureId = categoryImageMap[category];
    return textureId ? ImageSource.fromTextureAsset(new TextureAsset(BigInt(textureId))) : null;
  }

  private getItemImageSource(item: InventoryData, context: "grid" | "tab2" | "tab3"): ImageSource | null {
    if (context === "grid") {
      return item.assetTextureId && item.assetTextureId !== "null" ? ImageSource.fromTextureAsset(new TextureAsset(BigInt(item.assetTextureId))) : null;
    }

    if (context === "tab2" || context === "tab3") {
      const categoryTexture = categoryImageMap[item.category];
      return categoryTexture ? ImageSource.fromTextureAsset(new TextureAsset(BigInt(categoryTexture))) : null;
    }

    return null;
  }

  private mobilePlayers: Player[] = [];
  private otherPlayers: Player[] = [];

  preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player) => {
      if (player.deviceType.get() !== PlayerDeviceType.VR) {
        this.mobilePlayers.push(player);
        this.entity.setVisibilityForPlayers(this.mobilePlayers, PlayerVisibilityMode.VisibleTo);
      } else {
        this.otherPlayers.push(player);
        this.entity.setVisibilityForPlayers(this.otherPlayers, PlayerVisibilityMode.HiddenFrom);
      }
    });
  }

  initializeUI() {
    const itemGroups = [itemGroup1, itemGroup2, itemGroup3];

    this.currentSelectedItem.set(NULL_ITEM);

    this.groupBindings.set(itemGroups);

    // Load equipped werables  from persistent storage
    const players = this.world.getPlayers();
    // for (const player of players) {
    //   const stats = this.world.persistentStorage.getPlayerVariable<PlayerStats>(player, "PUBLIC_ASSETS:PlayerStats");
    //   const helmetColor = stats?.helmetColor ?? "";
    //   const backpackColor = stats?.backpackColor ?? "";
    //   const blasterColor = stats?.blasterColor ?? "";
    //   const jetsColor = stats?.jetsColor ?? "";
    //   this.equippedHelmetColor.set(helmetColor, [player]);
    //   this.equippedBackpackColor.set(backpackColor, [player]);
    //   this.equippedBlasterColor.set(blasterColor, [player]);
    //   this.equippedJetsColor.set(jetsColor, [player]);
    // }

    for (const group of itemGroups) {
      for (const item of group.items) {
        this.buttonTextBindings.set(item.name, new Binding(item.buttonText ?? ""));
      }
    }

    // Default to the first group
    this.selectedLayoutGroup.set(0);

    // Check if that group has items, then set the first category
    if (itemGroups.length > 0 && itemGroups[0].items.length > 0) {
      const firstCategory = itemGroups[0].items[0].category;
      this.selectedItemCategory.set(firstCategory);

      //Optional: select the first item itself
      this.currentSelectedItem.set(itemGroups[0].items[0]);
    }

    const tabGroups = layoutGroups;
    // Initialize found items for each group
    for (let i = 0; i < itemGroups.length; i++) {
      this.foundItems[i] = [];
      for (let j = 0; j < itemGroups[i].items.length; j++) {
        this.foundItems[i][j] = new Binding(false);
      }
    }
    this.connectLocalBroadcastEvent(ItemEvents.ItemFound, ({ player, assetTextureId }) => {
      for (let i = 0; i < itemGroups.length; i++) {
        for (let j = 0; j < itemGroups[i].items.length; j++) {
          const item = itemGroups[i].items[j];
          // console.log(`${item.assetTextureId}`);
          if (item.assetTextureId === assetTextureId) {
            this.foundItems[i][j].set(true, [player]);
          }
        }
      }
    });
    return View({
      children: [
        View({
          // RESERVED SPACE FOR THE HUD top center
          children: [],
          style: {
            width: "100%",
            height: "15%",
            // backgroundColor: 'pink',
            // borderColor: 'blue',
            // borderWidth: 5,
            flexDirection: "row",
            justifyContent: "center",
            //display: 'none',
          },
        }),

        View({
          // BACKPACK BUTTON
          children: [
            Pressable({
              children: [
                Image({
                  source: this.backpackBinding.derive((isOpen) => {
                    if (isOpen) {
                      return ImageSource.fromTextureAsset(new TextureAsset(BigInt("1463220161524161"))); //Close
                    } else {
                      return ImageSource.fromTextureAsset(new TextureAsset(BigInt("3020150408165456"))); //Open
                    }
                  }),
                  style: {
                    height: "100%",
                    width: "100%",
                    aspectRatio: 1, // Maintain aspect ratio
                    //backgroundColor: 'pink',
                  },
                }),
              ],
              onClick: (player) => {
                this.isMenuOpen = !this.isMenuOpen;

                this.backpackBinding.set(this.isMenuOpen, [player]);
                const sfx = this.props.buttonClickSound?.as(AudioGizmo);
                if (sfx) {
                  sfx.play({ players: [player], fade: 0 });
                }

                // const currentPosition = player.position.get();
                // player.position.set(currentPosition.add(new Vec3(3, 0, 0)));

                this.firstItemsDisplay(player, 0);
              },
              style: {
                width: "50%",
                height: "100%",
                // backgroundColor: 'pink',
                // borderColor: 'blue',
                // borderWidth: 5,
                flexDirection: "row",
                justifyContent: "center",
              },
            }),
          ],
          style: {
            width: "15%",
            height: "20%",
            // backgroundColor: 'pink',
            // borderColor: 'blue',
            // borderWidth: 5,
            //flexDirection: 'row',
            justifyContent: "center",
            position: "absolute",
            //top: 240, // BACKPACK PLACEMENT ON THE VERTICAL
            top: 80,
            //left: 80,
            right: 0,
            zIndex: 1,
          },
        }),

        this.inventory(itemGroups, layoutGroups),
        View({
          // RESERVED SPACE FOR THE HUD bottom center
          children: [],
          style: {
            width: "100%",
            height: "15%",
            //backgroundColor: 'pink',
            // borderColor: 'blue',
            // borderWidth: 5,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "flex-end",
            //display: 'none',
          },
        }),
      ],
      style: {
        width: "100%",
        height: "100%",
        //backgroundColor: 'silver', // Main Container color
        borderColor: "black",
        borderWidth: 5,
        justifyContent: "center",
      },
    });
  }

  private firstItemsDisplay(player: Player, index: number) {
    const itemGroups = [itemGroup1, itemGroup2, itemGroup3];
    this.itemGroups = itemGroups;
    const group = this.itemGroups[index];

    this.selectedLayoutGroup.set(index, [player]);
    const stats = this.world.persistentStorage.getPlayerVariable<flowersPPV>(player, "PUBLIC_ASSETS:flowersPPV") ?? { foundItemIds: [] };
    this.async.setTimeout(() => {
      const foundIds = stats.foundItemIds ?? [];

      for (let j = 0; j < group.items.length; j++) {
        const item = group.items[j];
        const isFound = foundIds.includes(item.assetTextureId);
        this.foundItems[index][j].set(isFound, [player]);
      }

      const firstItem = group.items.length > 0 ? group.items[0] : null;
      if (firstItem) {
        this.currentSelectedItem.set(firstItem, [player]);
        this.selectedItemByPlayer.set(player, firstItem); // ✅ Add this line
        this.selectedItemCategory.set(firstItem.category, [player]);
      } else {
        this.currentSelectedItem.set(NULL_ITEM, [player]);
        this.selectedItemByPlayer.set(player, NULL_ITEM); // ✅ Add this line
        this.selectedItemCategory.set("", [player]);
      }
    }, 20);
  }

  // This method is used to create the inventory menu
  inventory(itemGroups: ItemGroup[], tabGroups: LayoutGroup[]) {
    return View({
      children: [
        View({
          children: [this.tabGroups(tabGroups), this.inventoryGrid(), this.selectedInventoryItem()],
          style: {
            width: "50%",
            height: "100%",
            //backgroundColor: 'green',
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            //display: 'none',  // Visibility of the middle part
          },
        }),
      ],
      style: {
        // CONTAINER FOR THE INVENTORY
        display: this.backpackBinding.derive((value) => (value ? "flex" : "none")),
        width: "100%",
        height: "70%",
        //backgroundColor: 'pink',
        // borderColor: 'blue',
        // borderWidth: 5,
        flexDirection: "row",
        justifyContent: "center",
      },
    });
  }

  // TABS ON LEFT SIDE
  // This method is used to create a tab column for the inventory
  tabGroups(layoutGroups: LayoutGroup[]) {
    const tabGroups = [];
    for (let i = 0; i < layoutGroups.length; i++) {
      tabGroups.push(
        Pressable({
          onClick: (player) => {
            this.playTabSwitchSound(player);

            const itemGroups = [itemGroup1, itemGroup2, itemGroup3];
            this.itemGroups = itemGroups;
            this.groupBindings.set(itemGroups);

            const group = this.itemGroups[i];

            this.selectedLayoutGroup.set(i, [player]);

            if (i === 1) {
              // tab2 = helmet tab
              // const stats = this.world.persistentStorage.getPlayerVariable<PlayerStats>(player, 'TemplateGame:PlayerStats');
              // const color = stats?.helmetColor ?? "";
              // this.equippedHelmetColor.set(color, [player]);


              // const stats = this.world.persistentStorage.getPlayerVariable<PlayerStats>(player, "PUBLIC_ASSETS:PlayerStats") ?? {
              //   helmetColor: "",
              //   backpackColor: "",
              //   blasterColor: "",
              //   jetsColor: "",
              // };

              // this.equippedHelmetColor.set(stats.helmetColor ?? "", [player]);
              // this.equippedBackpackColor.set(stats.backpackColor ?? "", [player]);
              // this.equippedBlasterColor.set(stats.blasterColor ?? "", [player]);
              // this.equippedJetsColor.set(stats.jetsColor ?? "", [player]);
            }

            if (i === 2) {
              // tab3 = placeholder
              // const stats = this.world.persistentStorage.getPlayerVariable<PlayerStats>(player, "PUBLIC_ASSETS:PlayerStats");
              // const color = stats?.backpackColor ?? "";
              // this.equippedBackpackColor.set(color, [player]);
            }

            if (!group) {
              console.warn(`Tab ${i} has no group`);
              this.currentSelectedItem.set(NULL_ITEM, [player]);
              this.selectedItemCategory.set("", [player]);
              return;
            }

            this.firstItemsDisplay(player, i);
          },

          children: [
            Image({
              source: ImageSource.fromTextureAsset(new TextureAsset(BigInt(layoutGroups[i].iconTextureId))),
              style: {
                height: "80%",
                width: "80%",
                aspectRatio: 1, // Maintain aspect ratio
              },
            }),
          ],
          style: {
            width: "100%",
            height: "20%",
            backgroundColor: this.selectedLayoutGroup.derive((value) => (value === i ? "silver" : "grey")),
            justifyContent: "center",
            alignItems: "center",
            borderTopLeftRadius: 20,
            borderBottomLeftRadius: 20,
          },
        })
      );
    }

    return View({
      children: [
        View({
          children: [...tabGroups],
          style: {
            // display: 'none', // TODO add binding here to show/hide the tab columns
            width: "100%",
            height: "100%",
            //backgroundColor: 'white',
            justifyContent: "center",
          },
        }),
      ],
      style: {
        width: "10%",
        height: "100%",
        //backgroundColor: 'aqua',
        justifyContent: "center",
      },
    });
  }

  // TABS ON TOP ROW
  // This method is used to create a tab row for the inventory
  itemCategories() {
    return View({
      children: [
        View({
          children: DynamicList({
            data: this.groupBindings,
            renderItem: (group, index) => {
              const categories: string[] = [];
              for (let i = 0; i < group.items.length; i++) {
                if (!categories.includes(group.items[i].category)) {
                  categories.push(group.items[i].category);
                }
              }
              const tabCategories = [];
              for (let i = 0; i < categories.length; i++) {
                tabCategories.push(this.categoryTab(categories[i]));
              }
              return UINode.if(
                this.selectedLayoutGroup.derive((value) => value === index),
                View({
                  children: [...tabCategories],
                  style: {
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    flexDirection: "row",
                  },
                })
              );
            },
          }),
          style: {
            width: "100%",
            height: "100%",
            justifyContent: "center",
            flexDirection: "row",
          },
        }),
      ],
      style: {
        width: "100%",
        height: "10%",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
      },
    });
  }

  categoryTab(category: string) {
    return Pressable({
      onClick: (player) => {
        this.selectedItemCategory.set(category, [player]);
        this.currentSelectedItem.set(NULL_ITEM, [player]);
        this.playTabSwitchSound(player);
      },
      children: [
        Text({
          text: `${category}`,
          style: {
            color: "black",
            fontWeight: "600",
            fontSize: 18,
            textAlignVertical: "center",
            textAlign: "center",
            //width: "100%",
            height: "90%",
            paddingLeft: 10,
            paddingRight: 10,
            //backgroundColor: "red",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            // borderBottomLeftRadius: 20,
            // borderBottomRightRadius: 20,
          },
        }),
      ],
      style: {
        maxWidth: "30%",
        height: "100%",
        backgroundColor: this.selectedItemCategory.derive((value) => (value === category ? "silver" : "grey")),
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-end",
      },
    });
  }

  inventoryGrid() {
    return View({
      children: [
        this.itemCategories(),
        View({
          children: [
            View({
              children: [
                DynamicList({
                  data: this.groupBindings,
                  renderItem: (group, index) => {
                    const items: UINode<ViewProps>[] = [];
                    for (let i = 0; i < group.items.length; i++) {
                      //items.push(this.gridItem(group.items[i], index ?? 0, i));
                      if (index === 0) {
                        items.push(this.gridItem(group.items[i], index ?? 0, i)); // Artefacts
                      } else if (index === 1) {
                        items.push(this.tab2ListItem(group.items[i], index ?? 0, i)); // Wearables
                      } else if (index === 2) {
                        items.push(this.tab3ListItem(group.items[i], index ?? 0, i)); // Placeholder
                      }
                    }
                    return UINode.if(
                      this.selectedLayoutGroup.derive((value) => value === index),
                      ScrollView({
                        children: [
                          View({
                            children: items,
                            style: {
                              width: "100%", //make sure with and hight the same value to maintain square shape
                              height: "50%",
                              //height: '200%',
                              //backgroundColor: 'purple',
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              //alignContent: 'flex-start',
                              flexWrap: "wrap", //Important to keep them inside the container
                            },
                          }),
                        ],
                        style: {
                          width: "100%", //make sure with and hight the same value to maintain square shape
                          height: "100%",
                          //backgroundColor: 'lime',
                        },
                      })
                    );
                  },
                }),
              ],
              style: {
                width: "90%",
                height: "100%",
                justifyContent: "center",
                alignContent: "center",
                flexDirection: "row",
                alignItems: "center",
                //backgroundColor: "blue",
                //display: 'none',
              },
            }),
          ],
          style: {
            width: "100%",
            height: "80%", // If need to change it also make sure to change the top container
            backgroundColor: "silver",
            //opacity: 0.8,
            //borderColor: 'black',
            //borderWidth: 5,
            alignItems: "center", //horizontal alignment
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          },
        }),
      ],
      style: {
        width: "100%",
        //height: '100%',
        //backgroundColor: 'white',
        justifyContent: "center",
      },
    });
  }

  gridItem(item: InventoryData, group: number, index: number) {
    return View({
      children: [
        Pressable({
          onPress: (player) => {
            this.currentSelectedItem.set(item, [player]);
            this.selectedItemByPlayer.set(player, item);
            this.playButtonClickSound(player);
          },
          children: [
            View({
              children: [
                Image({
                  // Image of the item being displayed
                  //source: ImageSource.fromTextureAsset(new TextureAsset(BigInt(item.assetTextureId))),
                  // source: item.assetTextureId && item.assetTextureId !== "null"
                  //   ? ImageSource.fromTextureAsset(new TextureAsset(BigInt(item.assetTextureId)))
                  //   : null,

                  source: this.getItemImageSource(item, "grid"), // or "tab2"

                  style: {
                    width: "100%",
                    height: "100%", // Set the height of the image
                    aspectRatio: 1, // Maintain aspect ratio
                    opacity: this.foundItems[group][index].derive((value) => (value ? 1 : 0.4)),
                  },
                }),
                Image({
                  // Checkbox indicating if the item has been found
                  source: ImageSource.fromTextureAsset(new TextureAsset(BigInt("2763243910526090"))),
                  style: {
                    display: this.foundItems[group][index].derive((value) => (value ? "flex" : "none")),
                    width: "25%",
                    height: "30%", // Set the height of the image
                    aspectRatio: 1, // Maintain aspect ratio
                    position: "absolute",
                    top: "0",
                    left: "0",
                    borderColor: "#be9850",
                    borderWidth: 4,
                    borderRadius: 20,
                    marginLeft: -15,
                    //backgroundColor: 'black',
                  },
                }),
                Image({
                  // Display a lock if the item has not been found
                  source: ImageSource.fromTextureAsset(new TextureAsset(BigInt("1371528367322210"))),
                  style: {
                    display: this.foundItems[group][index].derive((value) => (value ? "none" : "flex")),
                    aspectRatio: 1,
                    position: "absolute",
                    height: "85%", // Set the height of the image
                    width: "70%", // Set the height of the image
                  },
                }),
              ],
              style: {
                width: "70%",
                height: "70%",
                //backgroundColor: 'yellow',
                justifyContent: "center",
                alignItems: "center",
              },
            }),
            Text({
              text: item.name,
              style: {
                fontSize: 18,
                textAlignVertical: "center", // Center the text vertically
                textAlign: "center",
                padding: 8,
                width: "80%",
                height: "20%",
                alignSelf: "center",
                backgroundColor: "grey",
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                borderBottomLeftRadius: 10,
                borderBottomRightRadius: 10,
              },
            }),
          ],
          style: {
            width: "90%",
            height: "90%",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "white",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            borderColor: this.currentSelectedItem.derive((value) => (value.assetTextureId === item.assetTextureId ? "grey" : "silver")),
            borderWidth: 3,
            alignContent: "center",
          },
        }),
      ],
      style: {
        display: this.selectedItemCategory.derive((value) => (value === item.category ? "flex" : "none")),
        width: "30%", //item width
        height: "70%",
        //backgroundColor: 'olive',
        //alignItems: 'center',
        justifyContent: "center",
        alignContent: "flex-start",
        //flexWrap: 'wrap',
        //overflow: 'hidden',
      },
    });
  }

  tab2ListItem(item: InventoryData, group: number, index: number) {
    // const buttonTextBinding = this.equippedHelmetColor.derive((equippedColor: string) =>
    //   equippedColor === item.color ? "Equipped" : item.buttonText ?? ""
    // );

    let equippedBinding: Binding<string>;

    switch (item.category) {
      case "Helmet":
        equippedBinding = this.equippedHelmetColor;
        break;
      case "Backpack":
        equippedBinding = this.equippedBackpackColor;
        break;
      case "Blaster":
        equippedBinding = this.equippedBlasterColor;
        break;
      case "Jets":
        equippedBinding = this.equippedJetsColor;
        break;
      default:
        equippedBinding = new Binding(""); // fallback
    }

    const buttonTextBinding = equippedBinding.derive((equippedColor: string) => (equippedColor === item.color ? "Equipped" : item.buttonText ?? ""));

    return View({
      children: [
        View({
          children: [
            View({
              children: [
                // Image({
                //   // source: ImageSource.fromTextureAsset(new TextureAsset(BigInt("1404946297624214"))),
                //   source: this.getItemImageSource(item, "tab2"), // or "tab2"
                //   style: {
                //     width: 80,
                //     aspectRatio: 1,
                //     alignSelf: 'center',
                //   }
                // }),
              ],
              style: styles.titleContainer,
            }),

            Pressable({
              children: [
                View({
                  children: Text({
                    text: buttonTextBinding,
                    style: { color: "white", fontWeight: "bold" },
                  }),
                  style: {
                    backgroundColor: item.color ?? "grey",
                    borderRadius: 10,
                    height: 66,
                    width: 150,
                    margin: 5,
                    alignItems: "center",
                    justifyContent: "center",
                    ...styles.button,
                  },
                }),
              ],

              onClick: (player) => {
                console.log(`${item.name} Button Pressed`);
                this.playButtonClickSound(player);

                // let stats = this.world.persistentStorage.getPlayerVariable<PlayerStats>(player, "PUBLIC_ASSETS:PlayerStats");
                // if (typeof stats !== "object" || stats === null) {
                //   stats = { backpackColor: "", helmetColor: "", blasterColor: "", jetsColor: "" };
                // }

                // switch (item.category) {
                //   case "Helmet":
                //     if (item.color) {
                //       this.sendLocalBroadcastEvent(colorHelmet, { player, color: item.color });
                //       stats.helmetColor = item.color;
                //       this.equippedHelmetColor.set(item.color, [player]);
                //     } else {
                //       this.sendLocalBroadcastEvent(defaultColorHelmet, { player });
                //       stats.helmetColor = null;
                //       this.equippedHelmetColor.set("", [player]);
                //     }
                //     break;

                //   case "Backpack":
                //     if (item.color) {
                //       this.sendLocalBroadcastEvent(colorBackpack, { player, color: item.color });
                //       stats.backpackColor = item.color;
                //       this.equippedBackpackColor.set(item.color, [player]);
                //     } else {
                //       this.sendLocalBroadcastEvent(defaultColorBackpack, { player });
                //       stats.backpackColor = null;
                //       this.equippedBackpackColor.set("", [player]);
                //     }
                //     break;

                //   case "Blaster":
                //     if (item.color) {
                //       this.sendLocalBroadcastEvent(colorBlaster, { player, color: item.color });
                //       stats.blasterColor = item.color;
                //       this.equippedBlasterColor.set(item.color, [player]);
                //     } else {
                //       this.sendLocalBroadcastEvent(defaultColorBlaster, { player });
                //       stats.blasterColor = null;
                //       this.equippedBlasterColor.set("", [player]);
                //     }
                //     break;

                //   case "Jets":
                //     if (item.color) {
                //       this.sendLocalBroadcastEvent(colorJets, { player, color: item.color });
                //       stats.jetsColor = item.color;
                //       this.equippedJetsColor.set(item.color, [player]);
                //     } else {
                //       this.sendLocalBroadcastEvent(defaultColorJets, { player });
                //       stats.jetsColor = null;
                //       this.equippedJetsColor.set("", [player]);
                //     }
                //     break;
                // }

                // this.world.persistentStorage.setPlayerVariable(player, "PUBLIC_ASSETS:PlayerStats", stats);
              },

              style: {
                width: "100%",
                //height: 36,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              },
            }),
          ],
          style: styles.blockContainer,
        }),
      ],
      style: {
        display: this.selectedItemCategory.derive((value) => (value === item.category ? "flex" : "none")),
        width: "30%",
        //height: '100%',
        // aspectRatio: 0.8, // Keeps height consistent relative to width
        // alignItems: 'center',
        // justifyContent: 'center',
        //margin: 10,
      },
    });
  }

  tab3ListItem(item: InventoryData, group: number, index: number) {
    const buttonTextBinding = this.equippedBackpackColor.derive((equippedColor: string) => (equippedColor === item.color ? "Equipped" : item.buttonText ?? ""));

    const styles = {
      titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 5,
      } as ViewStyle,
      blockContainer: {
        alignItems: "center",
        width: "90%",

        //height: 164,
        borderColor: "#83817b",
        borderWidth: 5,
        borderRadius: 10,
        padding: 10,
        margin: 5,
        backgroundColor: "white",
      } as ViewStyle,
      groupContainer: {
        flexDirection: "row",
        padding: 5,
      } as ViewStyle,
      description: {
        color: "blue",
        fontSize: 16,
      } as TextStyle,
      button: {
        marginTop: 10,
      } as ViewStyle,
    };
    return View({
      children: [
        View({
          children: [
            View({
              children: [
                Image({
                  source: item.color ? ImageSource.fromTextureAsset(new TextureAsset(BigInt(item.assetTextureId))) : ImageSource.fromTextureAsset(new TextureAsset(BigInt("1404946297624214"))),
                  style: {
                    width: 80,
                    aspectRatio: 1,
                    alignSelf: "center",
                    //backgroundColor: 'white',
                  },
                }),
              ],
              style: styles.titleContainer,
            }),

            Pressable({
              children: [
                View({
                  children: Text({
                    text: buttonTextBinding,
                    style: { color: "white", fontWeight: "bold" },
                  }),
                  style: {
                    backgroundColor: item.color ? item.color : "grey",
                    borderRadius: 10,
                    height: 36,
                    width: 120,
                    margin: 5,
                    alignItems: "center",
                    justifyContent: "center",
                    ...styles.button,
                  },
                }),
              ],
              onClick: (player) => {
                console.log(`${item.name} Button Pressed`);
                this.playButtonClickSound(player);

                // if (item.color) {
                //   this.sendLocalBroadcastEvent(colorBackpack, { player, color: item.color });

                //   let stats = this.world.persistentStorage.getPlayerVariable<PlayerStats>(player, "PUBLIC_ASSETS:PlayerStats");
                //   if (typeof stats !== "object" || stats === null) {
                //     stats = { helmetColor: "", backpackColor: "", blasterColor: "", jetsColor: "" };
                //   }

                //   stats.backpackColor = item.color;
                //   this.world.persistentStorage.setPlayerVariable(player, "PUBLIC_ASSETS:PlayerStats", stats);

                //   this.equippedBackpackColor.set(item.color, [player]);
                // } else {
                //   this.sendLocalBroadcastEvent(defaultColorBackpack, { player });
                //   //console.error("No color specified for this item.");
                // }
              },

              style: {
                width: "100%",
                height: 36,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              },
            }),
          ],
          style: styles.blockContainer,
        }),
      ],
      style: {
        display: this.selectedItemCategory.derive((value) => (value === item.category ? "flex" : "none")),
        width: "30%", //item width
        height: "100%",
        // width: '25%', //item width
        // height: '50%',
        // backgroundColor: 'olive',
        // alignItems: 'center',
        // justifyContent: 'center',
        // flexWrap: 'wrap',
        //overflow: 'hidden',
      },
    });
  }

  selectedInventoryItem() {
    // TODO add bindings for visibility and image preview
    return View({
      children: [
        View({
          children: [
            //             View({
            //               children: [
            //                 // Image({
            //                 //   // source: this.currentSelectedItem.derive(item => {
            //                 //   //   if (item === NULL_ITEM) {
            //                 //   //     return null;
            //                 //   //   }
            //                 //   //   if (item.category === "Helmet") {
            //                 //   //     return ImageSource.fromTextureAsset(new TextureAsset(BigInt("1804268093465958"))); // Helmet category image
            //                 //   //   }
            //                 //   //   if (item.category === "Jets") {
            //                 //   //     return ImageSource.fromTextureAsset(new TextureAsset(BigInt("720361954241773"))); // Helmet category image
            //                 //   //   }

            //                 //   //   return ImageSource.fromTextureAsset(new TextureAsset(BigInt(item.assetTextureId)));
            //                 //   // }),
            //                 //   source: this.selectedItemCategory.derive(category => this.getCategoryImage(category)),

            //                 //   style: {
            //                 //     width: '50%', // Set the width of the image
            //                 //     height: '50%', // Set the height of the image
            //                 //     aspectRatio: 1, // Maintain aspect ratio
            //                 //     //backgroundColor: 'white',
            //                 //   }
            //                 // }),
            // Image({
            //   source: this.currentSelectedItem.derive(item => {
            //     if (!item || item === NULL_ITEM || item.name === "null") {
            //       // Return null here — and handle fallback below with a second Image()
            //       return null;
            //     }

            //     if (item.assetTextureId && item.assetTextureId !== "null") {
            //       return ImageSource.fromTextureAsset(new TextureAsset(BigInt(item.assetTextureId)));
            //     }

            //     const fallbackId = categoryImageMap[item.category];
            //     return fallbackId
            //       ? ImageSource.fromTextureAsset(new TextureAsset(BigInt(fallbackId)))
            //       : null;
            //   }),
            //   style: {
            //     width: '50%',
            //     height: '50%',
            //     aspectRatio: 1,
            //     position: "absolute",
            //   }
            // }),
            // Image({
            //   source: this.selectedItemCategory.derive(category => {
            //     return categoryImageMap[category]
            //       ? ImageSource.fromTextureAsset(new TextureAsset(BigInt(categoryImageMap[category])))
            //       : null;
            //   }),
            //   style: {
            //     width: '50%',
            //     height: '50%',
            //     aspectRatio: 1,
            //     position: "absolute",
            //     opacity: this.currentSelectedItem.derive(item =>
            //       (!item || item === NULL_ITEM || item.name === "null") ? 1 : 0
            //     ),
            //   }
            // }),

            //                 Text({
            //                   text: this.currentSelectedItem.derive(item => {
            //                     return item.name;
            //                   }),
            //                   style: {
            //                     display: this.currentSelectedItem.derive(item => {
            //                       if (item === NULL_ITEM) {
            //                         return 'none'
            //                       } else {
            //                         return "flex"
            //                       }
            //                     }),
            //                     fontSize: 20,
            //                     textAlignVertical: "center", // Center the text vertically
            //                     textAlign: "center",
            //                     width: "70%",
            //                     height: "10%",
            //                     color: 'black',
            //                     //backgroundColor: "grey",
            //                     borderTopLeftRadius: 20,
            //                     borderTopRightRadius: 20,
            //                     borderBottomLeftRadius: 20,
            //                     borderBottomRightRadius: 20,
            //                   },
            //                 }),
            //                 Text({
            //                   text: this.currentSelectedItem.derive(item => {
            //                     return item.description;
            //                   }),
            //                   style: {
            //                     display: this.currentSelectedItem.derive(item => {
            //                       if (item === NULL_ITEM) {
            //                         return 'none'
            //                       } else {
            //                         return "flex"
            //                       }
            //                     }),
            //                     fontSize: 16,
            //                     textAlignVertical: "center", // Center the text vertically
            //                     textAlign: "center",
            //                     width: "70%",
            //                     height: "30%",
            //                     color: 'black',
            //                     //backgroundColor: "grey",
            //                     borderTopLeftRadius: 20,
            //                     borderTopRightRadius: 20,
            //                     borderBottomLeftRadius: 20,
            //                     borderBottomRightRadius: 20,
            //                   },
            //                 }),

            //               ],
            //               style: {
            //                 width: '100%',
            //                 height: '100%',
            //                 //backgroundColor: 'white',
            //                 justifyContent: 'center',
            //                 alignItems: 'center',
            //               }
            //             }),
            View({
              children: [
                // Selected Item Image
                Image({
                  source: this.currentSelectedItem.derive((item) => {
                    if (!item || item === NULL_ITEM || item.name === "null") return null;

                    if (item.assetTextureId && item.assetTextureId !== "null") {
                      return ImageSource.fromTextureAsset(new TextureAsset(BigInt(item.assetTextureId)));
                    }

                    const fallbackId = categoryImageMap[item.category];
                    return fallbackId ? ImageSource.fromTextureAsset(new TextureAsset(BigInt(fallbackId))) : null;
                  }),
                  style: {
                    width: "100%",
                    height: "100%",
                    aspectRatio: 1,
                    borderRadius: 20,
                  },
                }),

                // Fallback image (only shown when no item is selected)
                UINode.if(
                  this.currentSelectedItem.derive((item) => item === NULL_ITEM || item.name === "null"),
                  Image({
                    source: this.selectedItemCategory.derive((category) => (categoryImageMap[category] ? ImageSource.fromTextureAsset(new TextureAsset(BigInt(categoryImageMap[category]))) : null)),
                    style: {
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      aspectRatio: 1,
                      borderRadius: 20,
                    },
                  })
                ),
              ],
              style: {
                width: "50%",
                aspectRatio: 1,
                justifyContent: "center",
                alignItems: "center",
                // backgroundColor: 'rgba(0,0,0,0.05)', // optional debug styling
              },
            }),
            Text({
              text: this.currentSelectedItem.derive((item) => {
                return item.name;
              }),
              style: {
                display: this.currentSelectedItem.derive((item) => {
                  if (item === NULL_ITEM) {
                    return "none";
                  } else {
                    return "flex";
                  }
                }),
                fontSize: 20,
                textAlignVertical: "center", // Center the text vertically
                textAlign: "center",
                width: "70%",
                height: "10%",
                color: "black",
                //backgroundColor: "grey",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
              },
            }),
            Text({
              text: this.currentSelectedItem.derive((item) => {
                return item.description;
              }),
              style: {
                display: this.currentSelectedItem.derive((item) => {
                  if (item === NULL_ITEM) {
                    return "none";
                  } else {
                    return "flex";
                  }
                }),
                fontSize: 16,
                textAlignVertical: "center", // Center the text vertically
                textAlign: "center",
                width: "70%",
                height: "30%",
                color: "black",
                //backgroundColor: "grey",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
              },
            }),
          ],
          style: {
            // display: 'none', // TODO add binding here to show/hide the selected item
            width: "90%",
            height: "89%",
            backgroundColor: "silver",
            // borderColor: 'black',
            // borderWidth: 5,
            justifyContent: "center",
            alignItems: "center",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          },
        }),
      ],
      style: {
        width: "30%",
        height: "90%",
        //backgroundColor: 'purple',
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
      },
    });
  }

  start() { }
}
UIComponent.register(Inventory);

// const defaultPlayerStats: artefactPPV= {
//   foundItemIds: [], // Default to empty
// }

// class ItemComponent extends Component<typeof ItemComponent> {
//   static propsDefinition = {
//     trigger: { type: PropTypes.Entity },
//     vfx: { type: PropTypes.Entity },
//     sfx: { type: PropTypes.Entity },
//     imageVisual1: { type: PropTypes.Entity },
//     imageVisual2: { type: PropTypes.Entity },
//     imageVisual3: { type: PropTypes.Entity },
//   };

//   private assetTextureId: string = '';
//   private assetId: string = '';
//   private visualEntities: Entity[] = [];
//   private hasSpawned = false;
//   private spawnedEntity: Entity | null = null;

//   override preStart() {
//     const { trigger, imageVisual1, imageVisual2, imageVisual3 } = this.props;

//     if (imageVisual1) this.visualEntities.push(imageVisual1);
//     if (imageVisual2) this.visualEntities.push(imageVisual2);
//     if (imageVisual3) this.visualEntities.push(imageVisual3);

//     this.connectLocalEvent(this.entity, ItemEvents.SetItem, (data) => {
//       if (!data.item.assetTextureId || !data.item.assetId) {
//         console.warn("Invalid item data");
//         return;
//       }

//       this.assetTextureId = data.item.assetTextureId;
//       this.assetId = data.item.assetId;

//       // Update visuals
//       const texture = new Asset(BigInt(this.assetTextureId));
//       this.visualEntities.forEach(entity => {
//         const meshEntity = entity.as(MeshEntity);
//         meshEntity.setTexture(texture);
//       });

//       // Spawn entity at trigger location
//       if (!this.hasSpawned && trigger) {
//         const pos = trigger.as(TriggerGizmo).position.get() ?? new Vec3(0, 0, 0);
//         this.world.spawnAsset(new Asset(BigInt(this.assetId)), pos).then((spawnedEntities) => {
//           if (spawnedEntities.length > 0) {
//             this.spawnedEntity = spawnedEntities[0];
//             console.log("Item spawned:", this.assetId);
//           }
//         });
//         this.hasSpawned = true;
//       }
//     });

//     if (trigger) {
//       this.connectCodeBlockEvent(trigger, CodeBlockEvents.OnPlayerEnterTrigger, (player) => {
//         this.sendLocalBroadcastEvent(ItemEvents.ItemFound, { player, assetTextureId: this.assetTextureId });
//         this.sendLocalBroadcastEvent(Events.CollectArtifact, { player });
//         const playerStats = this.world.persistentStorage.getPlayerVariable<artefactPPV>(player, 'PUBLIC_ASSETS:flowersPPV') ?? { foundItemIds: [] };
//         if (!playerStats.foundItemIds.includes(this.assetTextureId)) {
//           playerStats.foundItemIds.push(this.assetTextureId);
//           this.world.persistentStorage.setPlayerVariable(player, 'PUBLIC_ASSETS:flowersPPV', playerStats);
//         }

//         trigger.as(TriggerGizmo).enabled.set(false);
//         this.entity.visible.set(false);
//         //this.entity.collidable.set(false);

//         // Delete the spawned entity
//         // "Remove" the spawned item
//         if (this.spawnedEntity) {

//           this.spawnedEntity.visible.set(false);
//           //this.spawnedEntity.collidable.set(false);
//           //this.spawnedEntity.position.set(new Vec3(0, -9999, 0));
//           this.spawnedEntity = null;
//           // this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitTrigger, (player) => {
//           // });
//           // this.connectLocalBroadcastEvent(ItemEvents.EquipArtifact, ({ player, item }) => {
//           //   const artifact = this.spawnedEntity;
//           //   if (artifact) {
//           //     artifact.as(AttachableEntity)?.attachToPlayer(player, AttachablePlayerAnchor.Head);
//           //     artifact.as(GrabbableEntity)?.setWhoCanGrab([]);
//           //     console.log(`Equipped artifact: ${item.name} for player: ${player.id}`);
//           //   }

//           //   // this.onEquip(player)
//           // });

//         }

//         const particleGizmo = this.props.vfx?.as(ParticleGizmo);
//         if (particleGizmo) {
//           particleGizmo.play({ players: [player] });
//         }

//         const sfx = this.props.sfx?.as(AudioGizmo);
//         if (sfx) {
//           sfx.play(
//             {
//               fade: 0,
//               players: [player],
//             }
//           );
//         }
//       });
//     }
//   }
//   onEquip(player: Player) {

//   }

//   override start() {

//     //this.connectLocalEvent(this.entity, 'EquipArtifactButtonPressed', ({ player, assetId }) => {
//     this.connectLocalBroadcastEvent(ItemEvents.EquipArtifact, ({ player, item }) => {
//       const assetId = item.assetId;
//       if (!assetId) return;
//       const playerStats = this.world.persistentStorage.getPlayerVariable<artefactPPV>(player, 'PUBLIC_ASSETS:flowersPPV');
//       if (!playerStats || !playerStats.foundItemIds.includes(item.assetTextureId)) return;

//       const asset = new Asset(BigInt(assetId));
//       const spawnPosition = player.position.get().add(new Vec3(0, 1, 0));

//       this.world.spawnAsset(asset, spawnPosition).then((spawned) => {
//         const artifact = spawned[0];
//         artifact.as(AttachableEntity)?.attachToPlayer(player, AttachablePlayerAnchor.Torso);
//         //Use this to grab the artifact - > artifact.as(GrabbableEntity).forceHold(player,Handedness.right, true);
//         // player.setAvatarGripPoseOverride(AvatarGripPose.Sword);
//         //artifact.as(GrabbableEntity)?.setWhoCanGrab([]);
//         console.log(`Spawned and equipped artifact for player ${player.id}`);
//       });
//     });

//     // this.connectLocalBroadcastEvent(ItemEvents.EquipArtifact, ({ player, assetId }) => {
//     //   const artifact = this.spawnedEntity;
//     //   artifact?.visible.set(true);
//     //   if (artifact) {
//     //     artifact.as(AttachableEntity)?.attachToPlayer(player, AttachablePlayerAnchor.Torso);
//     //     artifact.as(GrabbableEntity)?.setWhoCanGrab([]);
//     //     console.log(`Equipped artifact: ${item.name} for player: ${player.id}`);
//     //   }

//     //   // this.onEquip(player)
//     // });

//   }
// }

// Component.register(ItemComponent);

class ItemComponent extends Component<typeof ItemComponent> {
  static propsDefinition = {
    trigger: { type: PropTypes.Entity },
    imageVisual1: { type: PropTypes.Entity },
    imageVisual2: { type: PropTypes.Entity },
    imageVisual3: { type: PropTypes.Entity },
    // audioGizmo: { type: PropTypes.Entity },
    // Projectile: { type: PropTypes.Entity },
  };

  private assetTextureId: string = "";
  private visualEntities: Entity[] = [];

  override preStart() {
    // if (!this.props.Projectile) {
    //   return;
    // }
    // const projectile1 = this.props.Projectile!.as(ProjectileLauncherGizmo);

    if (!this.props.trigger) {
      return;
    }
    if (this.props.imageVisual1) {
      this.visualEntities.push(this.props.imageVisual1);
    }
    if (this.props.imageVisual2) {
      this.visualEntities.push(this.props.imageVisual2);
    }
    if (this.props.imageVisual3) {
      this.visualEntities.push(this.props.imageVisual3);
    }
    this.connectLocalEvent(this.entity, ItemEvents.SetItem, (data) => {
      this.assetTextureId = data.item.assetTextureId;
      this.visualEntities.forEach((entity) => {
        const meshEntity = entity.as(MeshEntity);
        meshEntity.setTexture(new Asset(BigInt(this.assetTextureId)));
      });
    });
    // this.connectCodeBlockEvent(
    //   projectile1!,
    //   CodeBlockEvents.OnProjectileHitEntity,
    //   (entityHit: Entity, position: Vec3, normal: Vec3, isStaticHit: boolean) => {
    //     // Handle the projectile hit event
    //     const soundGizmo = this.props.audioGizmo!.as(AudioGizmo)!;
    //     console.log('watered a plant');
    //     soundGizmo.play();
    //   }
    // );
    this.connectCodeBlockEvent(this.props.trigger, CodeBlockEvents.OnPlayerEnterTrigger, (player) => {
      this.sendLocalBroadcastEvent(ItemEvents.ItemFound, { player, assetTextureId: this.assetTextureId });
    });
  }

  override start() { }
}
UIComponent.register(ItemComponent);
