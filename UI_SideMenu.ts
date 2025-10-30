import { OnButtonAssetResponse } from "ButtonAssetRegistry";
import { ButtonProps, OnButtonRequest, OnButtonResponse } from "ButtonRegistry";
import { Asset, Entity, NetworkEvent, Player, PropTypes, Vec3 } from "horizon/core";
import { AnimatedBinding, Animation, Binding, DynamicList, Easing, ImageSource, Text, UIComponent, UINode, View } from "horizon/ui";
import { InventoryManager } from "InventoryManager";
import { sysEvents } from "sysEvents";
import { debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import { InventoryType } from "sysTypes";
import { buttonImg, buttonImgWithText, convertAssetIDToImageSource, convertAssetToImageSource, menuButton } from "sysUIStyleGuide";
import { getMgrClass } from "sysUtils";
import { oneHudEvents } from "UI_OneHUDEvents";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

export enum BuildSubMenuTypes {
  Dashboard = "Dashboard",
  ChairsMenu = "ChairsMenu",
  TablesMenu = "TablesMenu",
  OvensMenu = "OvensMenu",
  PrepStationsMenu = "PrepStationsMenu",
  OrderStationsMenu = "OrderStationsMenu",
  FridgesMenu = "FridgesMenu",
}

class UI_SideMenu extends UIComponent<typeof UI_SideMenu> {
  protected panelWidth: number = 200;
  protected panelHeight: number = 460;

  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    showDebugs: { type: PropTypes.Boolean, default: false },
    offset: { type: PropTypes.Vec3, default: new Vec3(95, 50, 0) },
    buttonRegistry: { type: PropTypes.Entity, default: null },
    backBtnImgAsset: { type: PropTypes.Asset },
  };

  inventoryMgr: InventoryManager | undefined = undefined;

  animBnd_translateX = new AnimatedBinding(0);
  isMenuOpen = false;
  closeOffset = 400;
  bnd_backBtnDisplay = new Binding<string>("flex");

  private childrenUINodeArray = new Binding<UINode[]>([]); // Binding to hold child nodes

  private buttonPropsMap = new Map<string, ButtonProps>();

  //multiplayer variables
  playerMenuContextMap = new Map<Player, string[]>();

  private plotManager: Entity | null = null;

  // private curPlayerMenuContextMap: Map<Player, string[]> = new Map();

  //region initializeUI()
  initializeUI(): UINode {
    if (!this.props.enabled) this.entity.visible.set(false);

    this.animBnd_translateX.set(this.isMenuOpen ? 0 : this.closeOffset);

    return View({
      children: [
        DynamicList({
          data: this.childrenUINodeArray,
          renderItem: (item: UINode) => item, // Render each item as is
          style: {
            flexDirection: "row",
            flexWrap: "wrap",
            width: "100%",
            height: "100%",
          },
        }),
        View({
          children: [menuButton(this, "back", "BACK", this.onButtonPressed.bind(this))],
          style: {
            backgroundColor: "rgba(255, 0, 0, 1)",
            position: "absolute",
            width: 100,
            height: 40,
            left: "50%",
            top: "105%",
            layoutOrigin: [0.5, 0.5],
            borderRadius: 15,
            display: this.bnd_backBtnDisplay,
          },
        }),
      ],
      style: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        left: `${this.props.offset.x!}%`,
        top: `${100 - this.props.offset.y!}%`,
        height: this.panelHeight,
        width: this.panelWidth,
        alignItems: "center",
        position: "absolute",
        layoutOrigin: [1, 0.5],
        transform: [{ translateX: this.animBnd_translateX }],
      },
    });
  }

  arrayIDMap = new Map<number, string[]>();
  mapIndex = 0;
  //region preStart()
  preStart() {
    if (!this.props.enabled) return;

    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      debugLog(this.props.showDebugs, `Simple Button Pressed by ${data.player.name.get()}`);
      this.animateMenu(data.player, (this.isMenuOpen = !this.isMenuOpen));
    });

    //BUTTON ASSET ARRAY RESPONSE
    this.connectNetworkEvent(this.entity, OnButtonResponse, (data) => {
      debugLog(this.props.showDebugs, "Button Asset Response Received");
      this.buttonPropsMap.set(data.buttonType, {
        buttonType: data.buttonType,
        btnImgAssetIDArray: data.btnImgAssetIDArray,
        btnInstanceIDArray: data.btnInstanceIDArray,
        buttonTextArray: data.buttonTextArray,
      });
    });

    this.connectNetworkEvent(this.entity, OnButtonAssetResponse, (data) => {
      debugLog(this.props.showDebugs, `Button Asset Response Received`);
      this.buttonPropsMap.set(data.menuType, {
        buttonType: data.menuType,
        btnImgAssetIDArray: data.btnImgAssetIDArray,
        btnInstanceIDArray: data.btnAssetIDArray,
        buttonTextArray: data.buttonTextArray,
      });
    });

    this.connectNetworkBroadcastEvent(sysEvents.updateMenuContext, (data) => {
      // const curPlayerMenuContext = this.curPlayerMenuContextMap.get(data.player) ?? [];
      let menuType = "";
      let backBtnDisplay = "flex";
      debugLog(this.props.showDebugs, `Update Menu Context Received: ${data.menuContext} from ${data.player.name.get()}`);
      if (data.menuContext.length <= 1) {
        //close menu
        this.animateMenu(data.player, false);
        if (this.isMenuOpen) {
        }
        return;
      } else if (data.menuContext.length === 3) {
        //detail menu stuff
        //if there's no sub menu, close menu
        if (this.buttonPropsMap.has(data.menuContext[2]) === false) {
          this.animateMenu(data.player, false);
          return;
        }
        menuType = data.menuContext[2]!;
        backBtnDisplay = "flex";
      } else if (data.menuContext.length === 2) {
        //sub menu stuff
        if (this.buttonPropsMap.has(data.menuContext[1]) === false) {
          this.animateMenu(data.player, false);
          return;
        }
        menuType = data.menuContext[1]!;
      } else {
        console.warn(`Invalid menu context length: ${data.menuContext.length}`);
      }

      if (this.buttonPropsMap.has(menuType)) {
        //does the current menu need to close first?
        let closeBeforeOpen = false;
        if (this.isMenuOpen) {
          closeBeforeOpen = true;
          this.animateMenu(data.player, false);
        }
        const delayForClose = closeBeforeOpen ? 250 : 0;

        this.async.setTimeout(() => {
          this.playerMenuContextMap.set(data.player, data.menuContext!);
          const newUINodeArray = this.convertAssetArrayToUINodeArray(this.buttonPropsMap.get(menuType)?.btnImgAssetIDArray ?? [], this.buttonPropsMap.get(menuType)?.btnInstanceIDArray ?? [], this.buttonPropsMap.get(menuType)?.buttonTextArray ?? []);
          this.childrenUINodeArray.set(newUINodeArray, [data.player]);
          this.animateMenu(data.player, true);
          this.bnd_backBtnDisplay.set(backBtnDisplay, [data.player]);
        }, delayForClose);
      } else {
        console.warn(`No menu found for type: ${menuType} on ${this.entity.name.get()}`);
      }
    });
  }

  //region start()
  start() {
    if (!this.props.enabled) return;

    if (this.props.buttonRegistry) {
      this.sendNetworkEvent(this.props.buttonRegistry!, OnButtonRequest, {
        requester: this.entity,
      });
    }

    this.plotManager = getEntityListByTag(ManagerType.PlayerPlotManager, this.world)[0] || null;
    this.inventoryMgr = getMgrClass<InventoryManager>(this, ManagerType.InventoryManager, InventoryManager);
  }

  //region Asset[] to UINode[]
  private convertAssetArrayToUINodeArray(buttonImgAssetIDArray: string[], btnInstanceIDArray: string[], buttonTextArray: string[]): UINode[] {
    try {
      const newUIArray: UINode[] = [];
      const txtOffset = new Vec3(50, 0, 150); //(x%,y%, width%)

      buttonImgAssetIDArray.forEach((textureID, index) => {
        newUIArray.push(buttonImgWithText(this, `${btnInstanceIDArray[index]}`, convertAssetIDToImageSource(buttonImgAssetIDArray[index]), `${buttonTextArray[index]}`, txtOffset, this.onButtonPressed.bind(this)));
      });

      return newUIArray;
    } catch (error) {
      console.error(`Error fetching texture assets`, error);
      return []; // Skip this iteration if texture asset is not found
    }
  }

  //region onButtonPressed()
  onButtonPressed(instanceId: string, player: Player): void {
    const curMenuContext = this.playerMenuContextMap.get(player) ?? [];
    if (instanceId === "back") {
      //handle back button
      if (curMenuContext.length > 1) {
        const newMenuContext = curMenuContext.slice(0, curMenuContext.length - 1);
        debugLog(this.props.showDebugs, `Back Button Pressed. New Menu Context: ${newMenuContext}`);
        this.sendNetworkBroadcastEvent(sysEvents.updateMenuContext, {
          player: player,
          menuContext: newMenuContext,
        });
      }
      return;
    }

    if (curMenuContext.length === 3) {
      //we in detail menu
      const buttonProps = this.buttonPropsMap.get(curMenuContext[2]);
      const index = buttonProps?.btnInstanceIDArray.indexOf(instanceId);
      debugLog(this.props.showDebugs, `Button Pressed: ${instanceId} at index ${index} in menu ${curMenuContext[2]}`);
      if (typeof index === "number" && index >= 0 && buttonProps?.buttonTextArray) {
        debugLog(this.props.showDebugs, `Button Text: ${buttonProps.buttonTextArray[index]}`);
        //convert text into number if possible
        const buttonText = buttonProps.buttonTextArray[index];
        const numVal = parseInt(buttonText);
        if (!isNaN(numVal)) {
          debugLog(this.props.showDebugs, `Button Text as num val: ${numVal}`);
          this.tryPurchaseAsset(player, instanceId, numVal);
        } else {
          debugLog(this.props.showDebugs, `Button Text is not a number: ${buttonText}`);
        }
      } else {
        debugLog(this.props.showDebugs, `Button Text: undefined`);
      }
    } else if (curMenuContext.length === 2) {
      //we in sub menu
      const buttonProps = this.buttonPropsMap.get(curMenuContext[1]);
      const newMenuContext = [...curMenuContext, instanceId];
      debugLog(this.props.showDebugs, `Button Pressed: ${instanceId} in menu ${newMenuContext}`);
      this.sendNetworkBroadcastEvent(sysEvents.updateMenuContext, {
        player: player,
        menuContext: newMenuContext,
      });
    }

    debugLog(this.props.showDebugs, `Button with instanceId ${instanceId} pressed by player ${player.name.get()}`);
    switch (instanceId) {
      default:
        break;
    }
  }

  //region tryPurchaseAsset()
  tryPurchaseAsset(player: Player, assetId: string, cost: number) {
    const curMenuContext = this.playerMenuContextMap.get(player) ?? []; //[0] Primary, [1] Sub, [2] Detail
    const playerInventory = this.inventoryMgr?.getPlayerInventory(player);
    if (!playerInventory) {
      console.error(`No inventory found for player ${player.name.get()}`);
      return;
    }
    if (playerInventory.items.currency < cost) {
      console.warn(`Player ${player.name.get()} does not have enough currency to purchase asset ${assetId}`);
      const oneHUD = getEntityListByTag(ManagerType.UI_OneHUD, this.world)[0];
      const message = "Insufficient funds!";
      this.sendNetworkEvent(oneHUD!, oneHudEvents.NotificationEvent, {
        message,
        players: [player],
        imageAssetId: null,
      });
      return;
    }
    this.inventoryMgr?.updatePlayerInventory(player, InventoryType.currency, -cost, this.entity);

    const asset = new Asset(BigInt(assetId));
    debugLog(this.props.showDebugs, `MenuContext is :${curMenuContext}`);
    if (curMenuContext[2] === "WallpaperCatalog" || curMenuContext[2] === "WallpaintCatalog") {
      debugLog(this.props.showDebugs, "We'd swap wallpaper here");
      this.sendNetworkEvent(this.plotManager!, sysEvents.changeTaggedEntityTextureEvent, {
        player: player!,
        textureAssetId: assetId,
        tag: "wallpaper",
      });
    } else if (curMenuContext[2] === "Wallpaper2Catalog") {
      this.sendNetworkEvent(this.plotManager!, sysEvents.changeTaggedEntityTextureEvent, {
        player: player!,
        textureAssetId: assetId,
        tag: "wallpaper2",
      });
    } else if (curMenuContext[2] === "FloorCatalog") {
      this.sendNetworkEvent(this.plotManager!, sysEvents.changeTaggedEntityTextureEvent, {
        player: player!,
        textureAssetId: assetId,
        tag: "floor",
      });
    } else if (asset && this.plotManager) {
      this.sendNetworkEvent(this.plotManager!, sysEvents.spawnNewAssetEvent, {
        player: player!,
        assetId: assetId,
      });
    } else {
      console.error(`Error fetching asset for assetId ${assetId}`);
    }
  }

  animateMenu(player: Player, open: boolean) {
    this.isMenuOpen = open;
    const moveToOffset = open ? 0 : this.closeOffset;

    this.animBnd_translateX.set(
      // notice that -100 will make it go up 100px
      Animation.timing(moveToOffset, {
        // how long it takes to complete in ms
        duration: 200,
        // we could be using Easing.cubic without the Easing.inOut alternatively
        easing: Easing.linear,
      }),
      // what should happen after it's done
      undefined,
      //the array of players that will see
      [player]
    );
  }
}
UIComponent.register(UI_SideMenu);
