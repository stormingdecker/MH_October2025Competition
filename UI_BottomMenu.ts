import { OnButtonAssetResponse } from "ButtonAssetRegistry";
import { OnButtonRequest, OnButtonResponse } from "ButtonRegistry";
import { Asset, Component, Entity, Player, PropTypes, Vec3 } from "horizon/core";
import { AnimatedBinding, Animation, Binding, DynamicList, Easing, UIComponent, UINode, View } from "horizon/ui";
import { sysEvents } from "sysEvents";
import { debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import { buttonImgWithText, convertAssetIDToImageSource } from "sysUIStyleGuide";
import { MenuBtnType } from "UI_AccordionMenu";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

export enum BottomMenuType {
  Closed = "Closed",
  PlotMenu = "PlotMenu",
  FishingMenu = "FishingMenu",
  FarmMenu = "FarmMenu",
}

export enum PlotMenuTypes {
  Closed = "Closed",
  Build = "BuildMenu",
  Food = "FoodMenu",
  Staff = "StaffMenu",
  Upgrades = "UpgradesMenu",
  Shop = "ShopMenu",
}

class UI_BottomMenu extends UIComponent<typeof UI_BottomMenu> {
  protected panelWidth: number = 500;
  protected panelHeight: number = 100;

  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    showDebugs: { type: PropTypes.Boolean, default: false },
    offset: { type: PropTypes.Vec3, default: new Vec3(50, 15, 0) },
    buttonRegistry: { type: PropTypes.Entity, default: null },
  };

  animBnd_traslateY = new AnimatedBinding(0);
  isMenuOpenOnStart = false;
  closeOffset = 100;

  private childrenUINodeArray = new Binding<UINode[]>([]); // Binding to hold child nodes

  private btnImgAssetIDArrayMap = new Map<string, string[]>();
  private btnInstanceIDArrayMap = new Map<string, string[]>();
  private buttonTextArrayMap = new Map<string, string[]>();
  private btnSpawnAssetIDArrayMap = new Map<string, string[]>();

  //multiplayer variables
  playerActiveSubMenuMap = new Map<Player, string>();

  private plotManager: Entity | null = null;

  //region initioalizeUI()
  initializeUI(): UINode {
    if (!this.props.enabled) this.entity.visible.set(false);

    this.animBnd_traslateY.set(this.isMenuOpenOnStart ? 0 : this.closeOffset);

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
      ],
      style: {
        // backgroundColor: "rgba(0, 0, 0, 0.5)",
        flexDirection: "row",
        left: `${this.props.offset.x!}%`,
        top: `${100 - this.props.offset.y!}%`,
        height: this.panelHeight,
        width: this.panelWidth,
        alignItems: "center",
        position: "absolute",
        layoutOrigin: [0.5, 1],
        transform: [{ translateY: this.animBnd_traslateY }],
      },
    });
  }

  //region preStart()
  preStart() {
    if (!this.props.enabled) return;

    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      debugLog(this.props.showDebugs, `Simple Button Pressed by ${data.player.name.get()}`);
      this.animateMenu(data.player, (this.isMenuOpenOnStart = !this.isMenuOpenOnStart));
    });

    //BUTTON ASSET ARRAY RESPONSE
    //Receieves image ids for buttons
    this.connectNetworkEvent(this.entity, OnButtonResponse, (data) => {
      debugLog(this.props.showDebugs, `Button Asset Response Received: ${data.buttonType}`);
      this.btnImgAssetIDArrayMap.set(data.buttonType, data.btnImgAssetIDArray);
      this.btnInstanceIDArrayMap.set(data.buttonType, data.btnInstanceIDArray);
      this.buttonTextArrayMap.set(data.buttonType, data.buttonTextArray);
    });

    //Receives asset ids to spawn
    this.connectNetworkEvent(this.entity, OnButtonAssetResponse, (data) => {
      debugLog(this.props.showDebugs, `Button Asset Response Received: ${data.menuType}`);
      this.btnImgAssetIDArrayMap.set(data.menuType, data.btnImgAssetIDArray);
      this.btnInstanceIDArrayMap.set(data.menuType, data.btnAssetIDArray);
      this.buttonTextArrayMap.set(data.menuType, data.buttonTextArray);
    });


    this.connectNetworkBroadcastEvent(sysEvents.toggleBottomMenuEvent, (data) => {
      debugLog(
        this.props.showDebugs,
        `Toggle Bottom Menu Event Received from ${data.player.name.get()} to open: ${data.menuType}, open: ${data.open}`
      );
      if (data.open) { //open the menu
        if (this.btnImgAssetIDArrayMap.has(data.menuType)) {
          const btnType = data.menuType;
          this.playerActiveSubMenuMap.set(data.player, data.menuType);
          this.playerActiveSubMenuMap.set(data.player, PlotMenuTypes.Closed);
          const newUINodeArray = this.convertAssetArrayToUINodeArray(
            this.btnImgAssetIDArrayMap.get(btnType) ?? [],
            this.btnInstanceIDArrayMap.get(btnType) ?? [],
            this.buttonTextArrayMap.get(btnType) ?? []
          );
          this.childrenUINodeArray.set(newUINodeArray, [data.player]);
          this.animateMenu(data.player, true);
        }
      } else { //close the menu
        this.animateMenu(data.player, false);
        this.playerActiveSubMenuMap.set(data.player, MenuBtnType.Closed);
        this.playerActiveSubMenuMap.set(data.player, PlotMenuTypes.Closed);

        this.sendNetworkBroadcastEvent(sysEvents.TopMenuEvent, {
          player: data.player,
          buttonType: MenuBtnType.Closed,
          open: false,
        });
        return;
      }
    });
  }

  //region start()
  start() {
    if (!this.props.enabled) return;

    if (this.props.buttonRegistry) {
      this.sendNetworkEvent(this.props.buttonRegistry!, OnButtonRequest, { requester: this.entity });
    }

    this.plotManager = getEntityListByTag(ManagerType.PlayerPlotManager, this.world)[0] || null;
  }

  //region Asset[] to UINode[]
  private convertAssetArrayToUINodeArray(
    buttonImgAssetIDArray: string[],
    btnInstanceIDArray: string[],
    buttonTextArray: string[]
  ): UINode[] {
    try {
      const newUIArray: UINode[] = [];
      const txtOffset = new Vec3(50, 0, 120); //(x%,y%, width%)

      buttonImgAssetIDArray.forEach((textureID, index) => {
        newUIArray.push(
          buttonImgWithText(
            this,
            `${btnInstanceIDArray[index]}`,
            convertAssetIDToImageSource(buttonImgAssetIDArray[index]),
            `${buttonTextArray[index]}`,
            txtOffset,
            this.onButtonPressed.bind(this)
          )
        );
      });

      return newUIArray;
    } catch (error) {
      console.error(`Error fetching texture assets`, error);
      return []; // Skip this iteration if texture asset is not found
    }
  }

  onButtonPressed(instanceId: string, player: Player): void {
    console.log(`Button with instanceId ${instanceId} pressed by player ${player.name.get()}`);
    switch (instanceId) {
      case PlotMenuTypes.Build:
        console.log("Button 1 Pressed");
        this.isTopMenuOpen(player, PlotMenuTypes.Build);
        //this puts the local camera and raycast into buildmode 
        this.sendNetworkBroadcastEvent(sysEvents.buildMenuEvent, { player: player });
        break;
      case PlotMenuTypes.Food:
        console.log("Button 2 Pressed");
        this.isTopMenuOpen(player, PlotMenuTypes.Food);
        break;
      case PlotMenuTypes.Staff:
        console.log("Button 3 Pressed");
        this.isTopMenuOpen(player, PlotMenuTypes.Staff);
        break;
      case PlotMenuTypes.Upgrades:
        this.isTopMenuOpen(player, PlotMenuTypes.Upgrades);
        console.log("Button 4 Pressed");
        break;
      case PlotMenuTypes.Shop:
        this.isTopMenuOpen(player, PlotMenuTypes.Shop);
        console.log("Button 5 Pressed");
        break;
      default:
        break;
    }
  }

  isTopMenuOpen(player: Player, topMenuType: string): boolean {
    const playerMenuType = this.playerActiveSubMenuMap.get(player) ?? PlotMenuTypes.Closed;
    if (playerMenuType === topMenuType) {
      console.log(`Closing menu: ${topMenuType}`);
      //close the top menu
      this.playerActiveSubMenuMap.set(player, PlotMenuTypes.Closed);
      this.sendNetworkBroadcastEvent(sysEvents.TopMenuEvent, {
        player: player,
        buttonType: PlotMenuTypes.Closed,
        open: false,
      });
      return false;
    } else {
      console.log(`Opening menu: ${topMenuType}`);
      this.playerActiveSubMenuMap.set(player, topMenuType);
      this.sendNetworkBroadcastEvent(sysEvents.TopMenuEvent, {
        player: player,
        buttonType: topMenuType,
        open: true,
      });
      return true;
    }
  }

  animateMenu(player: Player, open: boolean) {
    const moveToOffset = open ? 0 : this.closeOffset;

    this.animBnd_traslateY.set(
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
UIComponent.register(UI_BottomMenu);
