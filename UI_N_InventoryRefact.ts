import { ImageAsset } from "Assets";
import {
  AudioGizmo,
  CodeBlockEvents,
  Component,
  Entity,
  LocalEvent,
  MeshEntity,
  Player,
  PlayerDeviceType,
  PlayerVisibilityMode,
  PropTypes,
} from "horizon/core";
import {
  Binding,
  DynamicList,
  Image,
  ImageSource,
  Pressable,
  ScrollView,
  Text,
  TextStyle,
  UIComponent,
  UINode,
  View,
  ViewProps,
  ViewStyle,
} from "horizon/ui";

enum ImageAssetID {
  None,
  Fruit_Apple,
  Fruit_Avocado,
  Fruit_Banana,
  Fruit_Cherry,
  Fruit_Grapes,
  Fruit_Kiwi,
  Fruit_Lemon,
  Fruit_Lime,
  Fruit_Orange,
  Fruit_Pear,
  Fruit_Pineapple,
  Fruit_Strawberry,
  Fruit_Watermelon,
  Vegetable_Beet,
  Vegetable_Broccoli,
  Vegetable_Carrot,
  Vegetable_Corn,
  Vegetable_Eggplant,
  Vegetable_GreenOnions,
  Vegetable_Lettuce,
  Vegetable_Onion,
  Vegetable_Pepper,
  Vegetable_Pumpkin,
  Vegetable_Tomato,
  Vegetable_Turnip,
  Flower_PinkTulip,
  Flower_RedTulip,
  Flower_YellowTulip,
  Flower_PinkPansy,
  Flower_BluePansy,
  Flower_OrangeLily,
  Flower_VioletLily,
  Flower_PinkLily,
  Flower_YellowLily,
  Tool_WateringCan,
  Tool_Checkbox,
  Tool_Lock,
  Tool_Helmet,
  Tool_HelmetNoColor,
  Tool_BackpackOpen,
  Tool_BackpackClosed,
  Tool_Blaster,
  Tool_Jets,
  Tool_Backpack,

}

export class ImageAssets {
  private imageAssets: ImageAsset[] = [];
  private static instance: ImageAssets;

  constructor() {
    ImageAssets.instance = this;

    this.registerImageAsset(ImageAssetID.Fruit_Apple, new ImageAsset("835545625712692", 256, 256));
    this.registerImageAsset(ImageAssetID.Fruit_Avocado, new ImageAsset("1479439376508959", 256, 256));
    this.registerImageAsset(ImageAssetID.Fruit_Banana, new ImageAsset("577896115411067", 256, 256));
    this.registerImageAsset(ImageAssetID.Fruit_Cherry, new ImageAsset("1589301905384987", 256, 256));
    this.registerImageAsset(ImageAssetID.Fruit_Grapes, new ImageAsset("1100810155118587", 256, 256));
    this.registerImageAsset(ImageAssetID.Fruit_Kiwi, new ImageAsset("1465972811270110", 256, 256));
    this.registerImageAsset(ImageAssetID.Fruit_Lemon, new ImageAsset("2280253882413709", 256, 256));
    this.registerImageAsset(ImageAssetID.Fruit_Lime, new ImageAsset("800720849172649", 256, 256));
    this.registerImageAsset(ImageAssetID.Fruit_Orange, new ImageAsset("1184357770383320", 256, 256));
    this.registerImageAsset(ImageAssetID.Fruit_Pear, new ImageAsset("1344371760416276", 256, 256));
    this.registerImageAsset(ImageAssetID.Fruit_Pineapple, new ImageAsset("3696494660654379", 256, 256));
    this.registerImageAsset(ImageAssetID.Fruit_Strawberry, new ImageAsset("792438027051687", 256, 256));
    this.registerImageAsset(ImageAssetID.Fruit_Watermelon, new ImageAsset("1756060821781319", 256, 256));
    this.registerImageAsset(ImageAssetID.Vegetable_Beet, new ImageAsset("1114986907487009", 256, 256));
    this.registerImageAsset(ImageAssetID.Vegetable_Broccoli, new ImageAsset("1197810532167707", 256, 256));
    this.registerImageAsset(ImageAssetID.Vegetable_Carrot, new ImageAsset("1144737214283660", 256, 256));
    this.registerImageAsset(ImageAssetID.Vegetable_Corn, new ImageAsset("678119851401408", 256, 256));
    this.registerImageAsset(ImageAssetID.Vegetable_Eggplant, new ImageAsset("1966324657489538", 256, 256));
    this.registerImageAsset(ImageAssetID.Vegetable_GreenOnions, new ImageAsset("1150349027061955", 256, 256));
    this.registerImageAsset(ImageAssetID.Vegetable_Lettuce, new ImageAsset("1145631264113786", 256, 256));
    this.registerImageAsset(ImageAssetID.Vegetable_Onion, new ImageAsset("1193445159266995", 256, 256));
    this.registerImageAsset(ImageAssetID.Vegetable_Pepper, new ImageAsset("24148151548218412", 256, 256));
    this.registerImageAsset(ImageAssetID.Vegetable_Pumpkin, new ImageAsset("2229132397511893", 256, 256));
    this.registerImageAsset(ImageAssetID.Vegetable_Tomato, new ImageAsset("1213875753793692", 256, 256));
    this.registerImageAsset(ImageAssetID.Vegetable_Turnip, new ImageAsset("1584342175864493", 256, 256));

    this.registerImageAsset(ImageAssetID.Flower_PinkTulip, new ImageAsset("1113972000743060"));
    this.registerImageAsset(ImageAssetID.Flower_RedTulip, new ImageAsset("3920307171542653"));
    this.registerImageAsset(ImageAssetID.Flower_YellowTulip, new ImageAsset("2131894053899408"));
    this.registerImageAsset(ImageAssetID.Flower_PinkPansy, new ImageAsset("1167073981748676"));
    this.registerImageAsset(ImageAssetID.Flower_BluePansy, new ImageAsset("684631844094778"));
    this.registerImageAsset(ImageAssetID.Flower_OrangeLily, new ImageAsset("677073901491269"));
    this.registerImageAsset(ImageAssetID.Flower_VioletLily, new ImageAsset("629572849997901"));
    this.registerImageAsset(ImageAssetID.Flower_PinkLily, new ImageAsset("1194689875643087"));
    this.registerImageAsset(ImageAssetID.Flower_YellowLily, new ImageAsset("634475509493187"));
    this.registerImageAsset(ImageAssetID.Tool_WateringCan, new ImageAsset("1767501717138360"));
    this.registerImageAsset(ImageAssetID.Tool_Checkbox, new ImageAsset("2763243910526090"));
    this.registerImageAsset(ImageAssetID.Tool_Lock, new ImageAsset("1371528367322210"));
    this.registerImageAsset(ImageAssetID.Tool_Helmet, new ImageAsset("9597156110385711"));
    this.registerImageAsset(ImageAssetID.Tool_HelmetNoColor, new ImageAsset("1404946297624214"));
    this.registerImageAsset(ImageAssetID.Tool_BackpackOpen, new ImageAsset("4139010233004706", 512, 512));
    this.registerImageAsset(ImageAssetID.Tool_BackpackClosed, new ImageAsset("1743046609720643", 512, 512));
    this.registerImageAsset(ImageAssetID.Tool_Blaster, new ImageAsset("24145829305027120"));
    this.registerImageAsset(ImageAssetID.Tool_Jets, new ImageAsset("1941506576648090"));
    this.registerImageAsset(ImageAssetID.Tool_Backpack, new ImageAsset("1206871497780136"));
  }

  protected registerImageAsset(imageAssetID: ImageAssetID, imageAsset: ImageAsset) {
    this.imageAssets[imageAssetID] = imageAsset;
  }

  public prefetchAllImageAssets() {
    for (const imageAsset of this.imageAssets) {
      // Implement later (optional prefetch)
    }
  }

  public static getImageAsset(imageAssetID: ImageAssetID) {
    return ImageAssets.instance.imageAssets[imageAssetID];
  }
}

const COLOR_BACKGROUND_ACTIVE = "rgba(124, 76, 42, 1)";
const COLOR_BACKGROUND_INACTIVE = "rgba(82, 54, 34, 1)";
const COLOR_TEXT = "white";
const ITEM_WIDTH = 512;
const ITEM_HEIGHT = 192;

const MAX_ITEMS_PER_TAB = 24;

/** Round-robin across categories so each visible tab keeps category coverage */
function capGroupItemsBalanced(items: InventoryData[], max: number): InventoryData[] {
  if (items.length <= max) return items;

  const byCat = new Map<string, InventoryData[]>();
  for (const it of items) {
    const arr = byCat.get(it.category) ?? [];
    arr.push(it);
    byCat.set(it.category, arr);
  }

  const catQueues = Array.from(byCat.values());
  const result: InventoryData[] = [];
  let i = 0;
  while (result.length < max && catQueues.some((q) => q.length)) {
    const q = catQueues[i % catQueues.length];
    if (q.length) result.push(q.shift()!);
    i++;
  }
  return result;
}

/** Break a large list into multiple sub-tabs of up to `max`, each still balanced by category */
function chunkGroupItemsBalanced(items: InventoryData[], max: number): ItemGroup[] {
  if (items.length <= max) return [{ items }];

  const byCat = new Map<string, InventoryData[]>();
  for (const it of items) {
    const arr = byCat.get(it.category) ?? [];
    arr.push(it);
    byCat.set(it.category, arr);
  }
  const catQueues = Array.from(byCat.values()).map((q) => q.slice());

  const groups: ItemGroup[] = [];
  while (catQueues.some((q) => q.length)) {
    const chunk: InventoryData[] = [];
    let i = 0;
    while (chunk.length < max && catQueues.some((q) => q.length)) {
      const q = catQueues[i % catQueues.length];
      if (q.length) chunk.push(q.shift()!);
      i++;
    }
    groups.push({ items: chunk });
  }
  return groups;
}

/** Expand original groups+layouts into multiple 24-item sub-tabs per original tab */
function buildChunkedGroupsAndLayouts(originalGroups: ItemGroup[], originalLayouts: LayoutGroup[]) {
  const expandedGroups: ItemGroup[] = [];
  const expandedLayouts: LayoutGroup[] = [];

  for (let gi = 0; gi < originalGroups.length; gi++) {
    const baseGroup = originalGroups[gi];
    const chunks = chunkGroupItemsBalanced(baseGroup.items, MAX_ITEMS_PER_TAB);
    for (let ci = 0; ci < chunks.length; ci++) {
      expandedGroups.push(chunks[ci]);
      expandedLayouts.push({
        name: chunks.length > 1 ? `${originalLayouts[gi].name} • ${ci + 1}` : originalLayouts[gi].name,
        imageAsset: originalLayouts[gi].imageAsset,
      });
    }
  }
  return { expandedGroups, expandedLayouts };
}

let imageAssets = new ImageAssets();

type flowersPPV = {
  foundItemIds: string[];
};

export interface InventoryData {
  name: string;
  category: string;
  imageAssetID: ImageAssetID;
  assetId?: string | null;
  description?: string;
  button?: boolean;
  buttonText?: string | null;
  color?: string | null;
}

type ItemGroup = {
  items: InventoryData[];
};

interface LayoutGroup {
  name: string;
  imageAsset: ImageAsset;
}

export const NULL_ITEM: InventoryData = {
  assetId: "null",
  imageAssetID: ImageAssetID.None,
  category: "null",
  description: "null",
  name: "null",
  button: false,
  buttonText: null,
};

export const ItemEvents = {
  ItemFound: new LocalEvent<{ player: Player; imageAssetID: ImageAssetID }>("ItemFound"),
  SetItem: new LocalEvent<{ item: InventoryData }>("SetItem"),
};

export const layoutGroups: LayoutGroup[] = [
  {
    name: "tab1",
    imageAsset: ImageAssets.getImageAsset(ImageAssetID.Flower_PinkTulip),
  },
  {
    name: "tab2",
    imageAsset: ImageAssets.getImageAsset(ImageAssetID.Tool_WateringCan),
  },
  {
    name: "tab3",
    // pick any icon you like for tab3:
    imageAsset: ImageAssets.getImageAsset(ImageAssetID.Tool_BackpackOpen),
  },

];

const categoryImageMap: Record<string, ImageAsset> = {
  Helmet: ImageAssets.getImageAsset(ImageAssetID.Tool_Helmet),
  Backpack: ImageAssets.getImageAsset(ImageAssetID.Tool_BackpackOpen),
  Blaster: ImageAssets.getImageAsset(ImageAssetID.Tool_Blaster),
  Jets: ImageAssets.getImageAsset(ImageAssetID.Tool_Jets),
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
    width: "100%",
    padding: 5,
  } as ViewStyle,
  groupContainer: {
    flexDirection: "row",
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

class Inventory extends UIComponent<typeof Inventory> {
  static propsDefinition = {
    tabSwitchSound: { type: PropTypes.Entity },
    buttonClickSound: { type: PropTypes.Entity },
  };

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
  private _expandedLayouts: LayoutGroup[] = layoutGroups;

  private playTabSwitchSound(player: Player) {
    const sfx = this.props.tabSwitchSound?.as(AudioGizmo);
    if (sfx) sfx.play({ players: [player], fade: 0 });
  }

  private playButtonClickSound(player: Player) {
    const sfx = this.props.buttonClickSound?.as(AudioGizmo);
    if (sfx) sfx.play({ players: [player], fade: 0 });
  }

  private getCategoryImage(category: string): ImageSource | null {
    const categoryImage = categoryImageMap[category];
    return categoryImage ? categoryImage.getImageSource() : null;
  }

  private getItemImageSource(item: InventoryData, context: "grid" | "tab2" | "tab3"): ImageSource | null {
    if (context === "grid") {
      return ImageAssets.getImageAsset(item.imageAssetID).getImageSource();
    }
    if (context === "tab2" || context === "tab3") {
      const categoryTexture = categoryImageMap[item.category];
      return categoryTexture ? categoryTexture.getImageSource() : null;
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

    // Build expanded (chunked) data: ≤24 items per sub-tab
    const { expandedGroups, expandedLayouts } = buildChunkedGroupsAndLayouts(itemGroups, layoutGroups);
    this._expandedLayouts = expandedLayouts;

    this.currentSelectedItem.set(NULL_ITEM);
    this.groupBindings.set(expandedGroups);

    // Button text map (unchanged)
    for (const group of expandedGroups) {
      for (const item of group.items) {
        this.buttonTextBindings.set(item.name, new Binding(item.buttonText ?? ""));
      }
    }

    // Default to the first sub-tab/group
    this.selectedLayoutGroup.set(0);

    // Initialize category for the first visible group
    if (expandedGroups.length > 0 && expandedGroups[0].items.length > 0) {
      const firstCategory = expandedGroups[0].items[0].category;
      this.selectedItemCategory.set(firstCategory);
      this.currentSelectedItem.set(expandedGroups[0].items[0]);
    }

    // Initialize found flags sized to the expanded groups
    this.foundItems = [];
    for (let i = 0; i < expandedGroups.length; i++) {
      this.foundItems[i] = [];
      for (let j = 0; j < expandedGroups[i].items.length; j++) {
        this.foundItems[i][j] = new Binding(false);
      }
    }

    // Mark items as found when broadcast
    this.connectLocalBroadcastEvent(ItemEvents.ItemFound, ({ player, imageAssetID }) => {
      for (let i = 0; i < expandedGroups.length; i++) {
        for (let j = 0; j < expandedGroups[i].items.length; j++) {
          const item = expandedGroups[i].items[j];
          if (item.imageAssetID === imageAssetID) {
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
            flexDirection: "row",
            justifyContent: "center",
          },
        }),

        // BACKPACK BUTTON
        View({
          children: [
            Pressable({
              children: [
                Image({
                  source: this.backpackBinding.derive((isOpen) =>
                    isOpen
                      ? ImageAssets.getImageAsset(ImageAssetID.Tool_BackpackOpen).getImageSource()
                      : ImageAssets.getImageAsset(ImageAssetID.Tool_BackpackClosed).getImageSource()
                  ),
                  style: { height: "100%", width: "100%", aspectRatio: 1 },
                }),
              ],
              onClick: (player) => {
                this.isMenuOpen = !this.isMenuOpen;
                this.backpackBinding.set(this.isMenuOpen, [player]);
                this.playButtonClickSound(player);
                this.firstItemsDisplay(player, 0);
              },
              style: {
                width: "50%",
                height: "100%",
                flexDirection: "row",
                justifyContent: "center",
              },
            }),
          ],
          style: {
            width: "15%",
            height: "20%",
            justifyContent: "center",
            position: "absolute",
            top: 80,
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
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "flex-end",
          },
        }),
      ],
      style: {
        width: "100%",
        height: "100%",
        borderColor: "black",
        borderWidth: 5,
        justifyContent: "center",
      },
    });
  }

  private firstItemsDisplay(player: Player, index: number) {
    const itemGroups = [itemGroup1, itemGroup2, itemGroup3];
    const { expandedGroups } = buildChunkedGroupsAndLayouts(itemGroups, layoutGroups);
    const group = expandedGroups[index];

    this.selectedLayoutGroup.set(index, [player]);

    const stats = this.world.persistentStorage.getPlayerVariable<flowersPPV>(player, "PUBLIC_ASSETS:flowersPPV") ?? {
      foundItemIds: [],
    };

    this.async.setTimeout(() => {
      const foundIds = stats.foundItemIds ?? [];

      if (group) {
        // sync found flags for this group
        for (let j = 0; j < group.items.length; j++) {
          const item = group.items[j];
          const isFound = foundIds.includes(ImageAssets.getImageAsset(item.imageAssetID).assetID);
          // Ensure matrix row exists
          if (!this.foundItems[index]) this.foundItems[index] = [];
          if (!this.foundItems[index][j]) this.foundItems[index][j] = new Binding(false);
          this.foundItems[index][j].set(isFound, [player]);
        }

        // prime selection & category
        const firstItem = group.items.length > 0 ? group.items[0] : null;
        if (firstItem) {
          this.currentSelectedItem.set(firstItem, [player]);
          this.selectedItemByPlayer.set(player, firstItem);
          this.selectedItemCategory.set(firstItem.category, [player]);
        } else {
          this.currentSelectedItem.set(NULL_ITEM, [player]);
          this.selectedItemByPlayer.set(player, NULL_ITEM);
          this.selectedItemCategory.set("", [player]);
        }
      } else {
        // No group for this index
        this.currentSelectedItem.set(NULL_ITEM, [player]);
        this.selectedItemByPlayer.set(player, NULL_ITEM);
        this.selectedItemCategory.set("", [player]);
      }
    }, 20);
  }

  // Inventory container
  inventory(_itemGroups: ItemGroup[], _tabGroups: LayoutGroup[]) {
    return View({
      children: [
        View({
          children: [this.tabGroups(), this.inventoryGrid(), this.selectedInventoryItem()],
          style: {
            width: "50%",
            height: "100%",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          },
        }),
      ],
      style: {
        display: this.backpackBinding.derive((value) => (value ? "flex" : "none")),
        width: "100%",
        height: "70%",
        flexDirection: "row",
        justifyContent: "center",
      },
    });
  }

  // Left-rail tabs (now using expanded layouts)
  tabGroups() {
    const layouts = this._expandedLayouts ?? layoutGroups;
    const tabNodes: UINode<ViewProps>[] = [];

    for (let i = 0; i < layouts.length; i++) {
      const lg = layouts[i];
      tabNodes.push(
        Pressable({
          onClick: (player) => {
            this.playTabSwitchSound(player);

            const itemGroups = [itemGroup1, itemGroup2, itemGroup3];
            const { expandedGroups, expandedLayouts } = buildChunkedGroupsAndLayouts(itemGroups, layoutGroups);

            this.groupBindings.set(expandedGroups);
            this._expandedLayouts = expandedLayouts;

            this.selectedLayoutGroup.set(i, [player]);
            this.firstItemsDisplay(player, i);
          },
          children: [
            Image({
              source: lg.imageAsset.getImageSource(),
              style: { height: "80%", width: "80%", aspectRatio: 1 },
            }),
            // small page badge (optional)
            Text({
              text: lg.name.includes("•") ? lg.name.split("•").pop()!.trim() : "",
              style: {
                position: "absolute",
                bottom: 6,
                right: 10,
                fontSize: 12,
                color: "white",
                backgroundColor: "rgba(0,0,0,0.35)",
                paddingLeft: 6,
                paddingRight: 6,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
              },
            }),
          ],
          style: {
            width: "100%",
            height: "20%",
            backgroundColor: this.selectedLayoutGroup.derive((v) => (v === i ? COLOR_BACKGROUND_ACTIVE : COLOR_BACKGROUND_INACTIVE)),
            justifyContent: "center",
            alignItems: "center",
            borderTopLeftRadius: 20,
            borderBottomLeftRadius: 20,
            position: "relative",
          },
        })
      );
    }

    return View({
      children: [
        View({
          children: tabNodes,
          style: { width: "100%", height: "100%", justifyContent: "center" },
        }),
      ],
      style: { width: "10%", height: "100%", justifyContent: "center" },
    });
  }

  // Top category chips (computed from the *current* visible group)
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
            color: COLOR_TEXT,
            fontWeight: "600",
            fontSize: 18,
            textAlignVertical: "center",
            textAlign: "center",
            height: "90%",
            paddingLeft: 10,
            paddingRight: 10,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
        }),
      ],
      style: {
        maxWidth: "30%",
        height: "100%",
        backgroundColor: this.selectedItemCategory.derive((value) => (value === category ? COLOR_BACKGROUND_ACTIVE : COLOR_BACKGROUND_INACTIVE)),
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
                      if (index === 0) {
                        items.push(this.gridItem(group.items[i], index ?? 0, i)); // Artifacts
                      } else if (index === 1) {
                        items.push(this.tab2ListItem(group.items[i], index ?? 0, i)); // Wearables
                      } else if (index === 2) {
                        items.push(this.tab3ListItem(group.items[i], index ?? 0, i)); // Placeholder
                      } else {
                        // If more sub-tabs exist (e.g., tab1 • 2 => index >= 3),
                        // fall back to grid items (or branch by your needs)
                        items.push(this.gridItem(group.items[i], index ?? 0, i));
                      }
                    }
                    return UINode.if(
                      this.selectedLayoutGroup.derive((value) => value === index),
                      ScrollView({
                        children: [
                          View({
                            children: items,
                            style: {
                              width: ITEM_WIDTH,
                              height: ITEM_HEIGHT,
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              flexWrap: "wrap",
                            },
                          }),
                        ],
                        style: { width: "100%", height: "100%", backgroundColor: 'yellow' },
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
              },
            }),
          ],
          style: {
            width: "100%",
            height: "80%",
            backgroundColor: COLOR_BACKGROUND_ACTIVE,
            alignItems: "center",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          },
        }),
      ],
      style: {
        width: "100%",
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
                  source: this.getItemImageSource(item, "grid"),
                  style: {
                    width: "100%",
                    height: "100%",
                    aspectRatio: 1,
                    opacity: this.foundItems[group]?.[index]?.derive((value) => (value ? 1 : 0.4)) ?? 0.4,
                  },
                }),
                Image({
                  source: ImageAssets.getImageAsset(ImageAssetID.Tool_Checkbox).getImageSource(),
                  style: {
                    display: this.foundItems[group]?.[index]?.derive((value) => (value ? "flex" : "none")) ?? "none",
                    width: "25%",
                    height: "30%",
                    aspectRatio: 1,
                    position: "absolute",
                    top: "0",
                    left: "0",
                    borderColor: "#be9850",
                    borderWidth: 4,
                    borderRadius: 20,
                    marginLeft: -15,
                  },
                }),
                Image({
                  source: ImageAssets.getImageAsset(ImageAssetID.Tool_Lock).getImageSource(),
                  style: {
                    display: this.foundItems[group]?.[index]?.derive((value) => (value ? "none" : "flex")) ?? "flex",
                    aspectRatio: 1,
                    position: "absolute",
                    height: "85%",
                    width: "70%",
                  },
                }),
              ],
              style: {
                width: "70%",
                height: "70%",
                justifyContent: "center",
                alignItems: "center",
              },
            }),
            Text({
              text: item.name,
              style: {
                fontSize: 18,
                textAlignVertical: "center",
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
            borderColor: this.currentSelectedItem.derive((value) =>
              value.imageAssetID === item.imageAssetID ? COLOR_BACKGROUND_ACTIVE : COLOR_BACKGROUND_INACTIVE
            ),
            borderWidth: 3,
            alignContent: "center",
          },
        }),
      ],
      style: {
        display: this.selectedItemCategory.derive((value) => (value === item.category ? "flex" : "none")),
        width: "30%",
        height: "70%",
        justifyContent: "center",
        alignContent: "flex-start",
      },
    });
  }

  tab2ListItem(item: InventoryData, group: number, index: number) {
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
        equippedBinding = new Binding("");
    }

    const buttonTextBinding = equippedBinding.derive((equippedColor: string) =>
      equippedColor === item.color ? "Equipped" : item.buttonText ?? ""
    );

    return View({
      children: [
        View({
          children: [
            View({
              children: [],
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
                this.playButtonClickSound(player);
                // Equip logic (persist + broadcast) can be wired back in here if needed
              },
              style: {
                width: "100%",
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
      },
    });
  }

  tab3ListItem(item: InventoryData, group: number, index: number) {
    const buttonTextBinding = this.equippedBackpackColor.derive((equippedColor: string) =>
      equippedColor === item.color ? "Equipped" : item.buttonText ?? ""
    );

    const _styles = {
      titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 5,
      } as ViewStyle,
      blockContainer: {
        alignItems: "center",
        width: "90%",
        borderColor: "#83817b",
        borderWidth: 5,
        borderRadius: 10,
        padding: 10,
        margin: 5,
        backgroundColor: "white",
      } as ViewStyle,
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
                  source: item.color
                    ? ImageAssets.getImageAsset(item.imageAssetID).getImageSource()
                    : ImageAssets.getImageAsset(ImageAssetID.Tool_HelmetNoColor).getImageSource(),
                  style: { width: 80, aspectRatio: 1, alignSelf: "center" },
                }),
              ],
              style: _styles.titleContainer,
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
                    ..._styles.button,
                  },
                }),
              ],
              onClick: (player) => {
                this.playButtonClickSound(player);
                // Add backpack equip logic here if desired
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
          style: _styles.blockContainer,
        }),
      ],
      style: {
        display: this.selectedItemCategory.derive((value) => (value === item.category ? "flex" : "none")),
        width: "30%",
        height: "100%",
      },
    });
  }

  selectedInventoryItem() {
    return View({
      children: [
        View({
          children: [
            View({
              children: [
                // Selected item image or category fallback
                Image({
                  source: this.currentSelectedItem.derive((item) => {
                    if (!item || item === NULL_ITEM || item.name === "null") return null;
                    if (item.imageAssetID !== ImageAssetID.None) {
                      return ImageAssets.getImageAsset(item.imageAssetID).getImageSource();
                    }
                    const fallback = categoryImageMap[item.category];
                    return fallback ? fallback.getImageSource() : null;
                  }),
                  style: {
                    width: "100%",
                    height: "100%",
                    aspectRatio: 1,
                    borderRadius: 20,
                  },
                }),
                UINode.if(
                  this.currentSelectedItem.derive((item) => item === NULL_ITEM || item.name === "null"),
                  Image({
                    source: this.selectedItemCategory.derive((category) =>
                      categoryImageMap[category] ? categoryImageMap[category].getImageSource() : null
                    ),
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
              },
            }),
            Text({
              text: this.currentSelectedItem.derive((item) => item.name),
              style: {
                display: this.currentSelectedItem.derive((item) => (item === NULL_ITEM ? "none" : "flex")),
                fontSize: 20,
                textAlignVertical: "center",
                textAlign: "center",
                width: "70%",
                height: "10%",
                color: COLOR_TEXT,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
              },
            }),
            Text({
              text: this.currentSelectedItem.derive((item) => item.description),
              style: {
                display: this.currentSelectedItem.derive((item) => (item === NULL_ITEM ? "none" : "flex")),
                fontSize: 16,
                textAlignVertical: "center",
                textAlign: "center",
                width: "70%",
                height: "30%",
                color: COLOR_TEXT,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
              },
            }),
          ],
          style: {
            width: "90%",
            height: "89%",
            backgroundColor: COLOR_BACKGROUND_ACTIVE,
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
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
      },
    });
  }

  start() { }
}
UIComponent.register(Inventory);

class ItemComponent extends Component<typeof ItemComponent> {
  static propsDefinition = {
    trigger: { type: PropTypes.Entity },
    imageVisual1: { type: PropTypes.Entity },
    imageVisual2: { type: PropTypes.Entity },
    imageVisual3: { type: PropTypes.Entity },
  };

  private imageAssetID: ImageAssetID = ImageAssetID.None;
  private visualEntities: Entity[] = [];

  override preStart() {
    if (!this.props.trigger) return;

    if (this.props.imageVisual1) this.visualEntities.push(this.props.imageVisual1);
    if (this.props.imageVisual2) this.visualEntities.push(this.props.imageVisual2);
    if (this.props.imageVisual3) this.visualEntities.push(this.props.imageVisual3);

    this.connectLocalEvent(this.entity, ItemEvents.SetItem, (data) => {
      this.imageAssetID = data.item.imageAssetID;
      this.visualEntities.forEach((entity) => {
        const meshEntity = entity.as(MeshEntity);
        meshEntity.setTexture(ImageAssets.getImageAsset(this.imageAssetID!).getTextureAsset());
      });
    });

    this.connectCodeBlockEvent(this.props.trigger, CodeBlockEvents.OnPlayerEnterTrigger, (player) => {
      this.sendLocalBroadcastEvent(ItemEvents.ItemFound, { player, imageAssetID: this.imageAssetID });
    });
  }

  override start() { }
}
Component.register(ItemComponent);

// -------------------- ITEM GROUPS --------------------

export const itemGroup1: ItemGroup = {

  items: [

    // { name: "Pink", category: "Tulip", description: "Pink Tulip Description", imageAssetID: ImageAssetID.Flower_PinkTulip },
    // { name: "Red", category: "Tulip", description: "Description of Art N 2", imageAssetID: ImageAssetID.Flower_RedTulip },
    // { name: "Yellow", category: "Tulip", description: "Description of Art N 2", imageAssetID: ImageAssetID.Flower_YellowTulip },
    // { name: "Pink", category: "Pansy", description: "Description of Art N 2", imageAssetID: ImageAssetID.Flower_PinkPansy },
    // { name: "Blue", category: "Pansy", description: "Description of Art N 2", imageAssetID: ImageAssetID.Flower_BluePansy },
    // { name: "Orange", category: "Lily", description: "Description of Orange Lily", imageAssetID: ImageAssetID.Flower_OrangeLily },
    // { name: "Violet", category: "Lily", description: "Description of Violet Lily", imageAssetID: ImageAssetID.Flower_VioletLily },
    // { name: "Pink", category: "Lily", description: "Pink lily Description", imageAssetID: ImageAssetID.Flower_PinkLily },
    // { name: "Yellow", category: "Lily", description: "Description of Art N 2", imageAssetID: ImageAssetID.Flower_YellowLily },
    // { name: "Yellow", category: "Tulip", description: "Description of Art N 2", imageAssetID: ImageAssetID.Flower_YellowTulip },
    // { name: "Pink", category: "Pansy", description: "Description of Art N 2", imageAssetID: ImageAssetID.Flower_PinkPansy },
    // { name: "Blue", category: "Pansy", description: "Description of Art N 2", imageAssetID: ImageAssetID.Flower_BluePansy },
    // { name: "Apple", category: "Fruit", description: "A juicy red apple", imageAssetID: ImageAssetID.Fruit_Apple },
    // { name: "Avocado", category: "Fruit", description: "A ripe avocado", imageAssetID: ImageAssetID.Fruit_Avocado },
    // { name: "Banana", category: "Fruit", description: "A bunch of bananas", imageAssetID: ImageAssetID.Fruit_Banana },
    // { name: "Cherry", category: "Fruit", description: "A pair of cherries", imageAssetID: ImageAssetID.Fruit_Cherry },

    { name: "Grapes", category: "Fruit", description: "A cluster of grapes", imageAssetID: ImageAssetID.Fruit_Grapes },
    { name: "Kiwi", category: "Fruit", description: "A sliced kiwi fruit", imageAssetID: ImageAssetID.Fruit_Kiwi },
    { name: "Lemon", category: "Fruit", description: "A fresh lemon", imageAssetID: ImageAssetID.Fruit_Lemon },
    { name: "Lime", category: "Fruit", description: "A zesty lime", imageAssetID: ImageAssetID.Fruit_Lime },
    { name: "Orange", category: "Fruit", description: "A sweet orange", imageAssetID: ImageAssetID.Fruit_Orange },
    { name: "Pear", category: "Fruit", description: "A ripe pear", imageAssetID: ImageAssetID.Fruit_Pear },
    { name: "Pineapple", category: "Fruit", description: "A tropical pineapple", imageAssetID: ImageAssetID.Fruit_Pineapple },
    { name: "Strawberry", category: "Fruit", description: "A fresh strawberry", imageAssetID: ImageAssetID.Fruit_Strawberry },
    { name: "Watermelon", category: "Fruit", description: "A slice of watermelon", imageAssetID: ImageAssetID.Fruit_Watermelon },

    { name: "Beet", category: "Vegetable", description: "A fresh beet", imageAssetID: ImageAssetID.Vegetable_Beet },
    { name: "Broccoli", category: "Vegetable", description: "A head of broccoli", imageAssetID: ImageAssetID.Vegetable_Broccoli },
    { name: "Carrot", category: "Vegetable", description: "A crunchy carrot", imageAssetID: ImageAssetID.Vegetable_Carrot },
    { name: "Corn", category: "Vegetable", description: "An ear of corn", imageAssetID: ImageAssetID.Vegetable_Corn },
    { name: "Eggplant", category: "Vegetable", description: "A purple eggplant", imageAssetID: ImageAssetID.Vegetable_Eggplant },
    { name: "Green Onions", category: "Vegetable", description: "A bunch of green onions", imageAssetID: ImageAssetID.Vegetable_GreenOnions },
    { name: "Lettuce", category: "Vegetable", description: "A head of lettuce", imageAssetID: ImageAssetID.Vegetable_Lettuce },
    { name: "Onion", category: "Vegetable", description: "A fresh onion", imageAssetID: ImageAssetID.Vegetable_Onion },
    { name: "Pepper", category: "Vegetable", description: "A bell pepper", imageAssetID: ImageAssetID.Vegetable_Pepper },
    { name: "Pumpkin", category: "Vegetable", description: "A round pumpkin", imageAssetID: ImageAssetID.Vegetable_Pumpkin },
    { name: "Tomato", category: "Vegetable", description: "A ripe tomato", imageAssetID: ImageAssetID.Vegetable_Tomato },
    { name: "Turnip", category: "Vegetable", description: "A fresh turnip", imageAssetID: ImageAssetID.Vegetable_Turnip },
  ],
};

export const itemGroup2: ItemGroup = {
  items: [
    { name: "Helmet", category: "Helmet", description: "", imageAssetID: ImageAssetID.Tool_HelmetNoColor, button: true, buttonText: "Default", color: null },
    { name: "Red", category: "Helmet", description: "Red Helmet", imageAssetID: ImageAssetID.Tool_HelmetNoColor, button: true, buttonText: "Red", color: "#ff0000" },
    { name: "Blue", category: "Helmet", description: "Blue Helmet", imageAssetID: ImageAssetID.Tool_HelmetNoColor, button: true, buttonText: "Blue", color: "#0000ff" },
    { name: "Yellow", category: "Helmet", description: "Yellow Helmet", imageAssetID: ImageAssetID.Tool_HelmetNoColor, button: false, buttonText: "Yellow", color: "#ffff00" },
    { name: "Lime", category: "Helmet", description: "Lime Helmet", imageAssetID: ImageAssetID.Tool_HelmetNoColor, button: false, buttonText: "Lime", color: "#5eff00" },
    { name: "Purple", category: "Helmet", description: "Purple Helmet", imageAssetID: ImageAssetID.Tool_HelmetNoColor, button: true, buttonText: "Purple", color: "#800080" },
    { name: "Turquoise", category: "Helmet", description: "Turquoise Helmet", imageAssetID: ImageAssetID.Tool_HelmetNoColor, button: true, buttonText: "Turquoise", color: "#04ffd5" },
    { name: "Black", category: "Helmet", description: "Black Helmet", imageAssetID: ImageAssetID.Tool_HelmetNoColor, button: true, buttonText: "Black", color: "#000000" },
  ],
};

export const itemGroup3: ItemGroup = {
  items: [
    { name: "Red", category: "Backpack", description: "Red Backpack", imageAssetID: ImageAssetID.Tool_Backpack, button: false, buttonText: "Yellow", color: "#ff0000" },
    { name: "Blue", category: "Backpack", description: "Blue Backpack", imageAssetID: ImageAssetID.Tool_Backpack, button: true, buttonText: "Blue", color: "#0000ff" },
    { name: "Purple", category: "Backpack", description: "Purple Backpack", imageAssetID: ImageAssetID.Tool_Backpack, button: true, buttonText: "Purple", color: "#800080" },
    { name: "Yellow", category: "Backpack", description: "Yellow Backpack", imageAssetID: ImageAssetID.Tool_Backpack, button: true, buttonText: "Yellow", color: "#fffb00" },
    { name: "Turquoise", category: "Backpack", description: "Turquoise Backpack", imageAssetID: ImageAssetID.Tool_Backpack, button: true, buttonText: "Turquoise", color: "#04ffd5" },
    { name: "Green", category: "Backpack", description: "Green Backpack", imageAssetID: ImageAssetID.Tool_Backpack, button: true, buttonText: "Green", color: "#05fa19" },
  ],
};
