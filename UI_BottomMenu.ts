import { OnButtonAssetResponse } from "ButtonAssetRegistry";
import { OnButtonRequest, OnButtonResponse } from "ButtonRegistry";
import { Asset, Component, Entity, Player, PropTypes, Vec3 } from "horizon/core";
import {
  AnimatedBinding,
  Animation,
  Binding,
  DynamicList,
  Easing,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { sysEvents } from "sysEvents";
import { debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import { buttonImgWithText, convertAssetIDToImageSource } from "sysUIStyleGuide";
import { MenuBtnType } from "UI_AccordionMenu";
import { Primary_MenuType, Sub_PlotType } from "UI_MenuManager";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

class UI_BottomMenu extends UIComponent<typeof UI_BottomMenu> {
  protected panelWidth: number = 550;
  protected panelHeight: number = 100;

  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    showDebugs: { type: PropTypes.Boolean, default: false },
    offset: { type: PropTypes.Vec3, default: new Vec3(50, 15, 0) },
    buttonRegistry: { type: PropTypes.Entity, default: null },
  };

  animBnd_traslateY = new AnimatedBinding(0);
  isMenuOpenOnStart = false;
  closeOffset = 150;

  private childrenUINodeArray = new Binding<UINode[]>([]); // Binding to hold child nodes

  private btnImgAssetIDArrayMap = new Map<string, string[]>();
  private btnInstanceIDArrayMap = new Map<string, string[]>();
  private buttonTextArrayMap = new Map<string, string[]>();
  private btnSpawnAssetIDArrayMap = new Map<string, string[]>();

  //multiplayer variables
  playerMenuContextMap = new Map<Player, string[]>();

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
            alignItems: "center",
            justifyContent: "center",
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

    this.connectNetworkBroadcastEvent(sysEvents.updateMenuContext, (data) => {
      const prevMenuContext = this.playerMenuContextMap.get(data.player) ?? [];
      const curMenuContext = data.menuContext ?? [];
      debugLog(
        this.props.showDebugs,
        `Toggle Bottom Menu Event Received from ${data.player.name.get()} to open: ${
          data.menuContext !== undefined
        }`
      );
      if (data.menuContext[0] === Primary_MenuType.PlotMenu) {
        //open the menu
        if (this.btnImgAssetIDArrayMap.has(data.menuContext[0])) {
          const btnType = data.menuContext[0];
          // this.playerMenuContextMap.set(data.player, data.menuType);
          // this.playerMenuContextMap.set(data.player, PlotMenuTypes.Closed);
          const newUINodeArray = this.convertAssetArrayToUINodeArray(
            this.btnImgAssetIDArrayMap.get(btnType) ?? [],
            this.btnInstanceIDArrayMap.get(btnType) ?? [],
            this.buttonTextArrayMap.get(btnType) ?? []
          );
          this.childrenUINodeArray.set(newUINodeArray, [data.player]);
          this.animateMenu(data.player, true);
        }
      }
      if(data.menuContext[0] === Primary_MenuType.MerchantMenu){
        if(this.btnImgAssetIDArrayMap.has(data.menuContext[0])){
          const btnType = data.menuContext[0];
          const newUINodeArray = this.convertAssetArrayToUINodeArray(
            this.btnImgAssetIDArrayMap.get(btnType) ?? [],
            this.btnInstanceIDArrayMap.get(btnType) ?? [],
            this.buttonTextArrayMap.get(btnType) ?? []
          );
          this.childrenUINodeArray.set(newUINodeArray, [data.player]);
          this.animateMenu(data.player, true);
        }
      }
      else {
        //close the menu
        this.animateMenu(data.player, false);

        return;
      }
      this.playerMenuContextMap.set(data.player, curMenuContext);
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
  }

  //region Asset[] to UINode[]
  private convertAssetArrayToUINodeArray(
    buttonImgAssetIDArray: string[],
    btnInstanceIDArray: string[],
    buttonTextArray: string[]
  ): UINode[] {
    try {
      const newUIArray: UINode[] = [];
      const txtOffset = new Vec3(50, -10, 140); //(x%,y%, width%)

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

  //region on Button Pressed()
  onButtonPressed(instanceId: string, player: Player): void {
    const curMenuContext = this.playerMenuContextMap.get(player) ?? [];
    console.log(`Button with instanceId ${instanceId} pressed by player ${player.name.get()}`);
    let updatedMenuContext: string[] = [];
    switch (instanceId) {
      case Sub_PlotType.BuildMode:
        console.log("Button 1 Pressed");
        if (curMenuContext[1] === Sub_PlotType.BuildMode) {
          updatedMenuContext = [Primary_MenuType.PlotMenu];
        } else {
          updatedMenuContext = [Primary_MenuType.PlotMenu, Sub_PlotType.BuildMode];
        }
        break;
      case Sub_PlotType.FoodMenu:
        if (curMenuContext[1] === Sub_PlotType.FoodMenu) {
          updatedMenuContext = [Primary_MenuType.PlotMenu];
        } else {
          updatedMenuContext = [Primary_MenuType.PlotMenu, Sub_PlotType.FoodMenu];
        }
        break;
      case Sub_PlotType.Staff:
        console.log("Button 3 Pressed");
        if (curMenuContext[1] === Sub_PlotType.Staff) {
          updatedMenuContext = [Primary_MenuType.PlotMenu];
        } else {
          updatedMenuContext = [Primary_MenuType.PlotMenu, Sub_PlotType.Staff];
        }

        break;
      case Sub_PlotType.Upgrades:
        if (curMenuContext[1] === Sub_PlotType.Upgrades) {
          updatedMenuContext = [Primary_MenuType.PlotMenu];
        } else {
          updatedMenuContext = [Primary_MenuType.PlotMenu, Sub_PlotType.Upgrades];
        }

        console.log("Button 4 Pressed");
        break;
      case Sub_PlotType.Shop:
        if (curMenuContext[1] === Sub_PlotType.Shop) {
          updatedMenuContext = [Primary_MenuType.PlotMenu];
        } else {
          updatedMenuContext = [Primary_MenuType.PlotMenu, Sub_PlotType.Shop];
        }
        console.log("Button 5 Pressed");
        break;
        case Sub_PlotType.Decor:
        if (curMenuContext[1] === Sub_PlotType.Decor) {
          updatedMenuContext = [Primary_MenuType.PlotMenu];
        } else {
          updatedMenuContext = [Primary_MenuType.PlotMenu, Sub_PlotType.Decor];
        }
          break;
      default:
        break;
    }

    this.playerMenuContextMap.set(player, updatedMenuContext);

    this.sendNetworkBroadcastEvent(sysEvents.updateMenuContext, {
      player: player,
      menuContext: updatedMenuContext,
    });
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
