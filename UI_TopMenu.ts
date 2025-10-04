import { OnButtonAssetResponse } from "ButtonAssetRegistry";
import { OnButtonRequest, OnButtonResponse } from "ButtonRegistry";
import { Asset, Entity, Player, PropTypes, Vec3 } from "horizon/core";
import {
  AnimatedBinding,
  Animation,
  Binding,
  DynamicList,
  Easing,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { sysEvents } from "sysEvents";
import { debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import {
  button,
  buttonImg,
  buttonImgWithText,
  convertAssetIDToImageSource,
  convertAssetToImageSource,
} from "sysUIStyleGuide";
import { OnTextureAssetRequest, OnTextureAssetResponse } from "TextureRegistry_Base";
import { BottomMenuType, PlotMenuTypes } from "UI_BottomMenu";

import { simpleButtonEvent } from "UI_SimpleButtonEvent";

class UI_TopMenu extends UIComponent<typeof UI_TopMenu> {
  protected panelWidth: number = 500;
  protected panelHeight: number = 100;

  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    showDebugs: { type: PropTypes.Boolean, default: false },
    offset: { type: PropTypes.Vec3, default: new Vec3(50, 85, 0) },
    buttonRegistry: { type: PropTypes.Entity, default: null },
  };

  animBnd_traslateY = new AnimatedBinding(0);
  isMenuOpen = false;

  private childrenUINodeArray = new Binding<UINode[]>([]); // Binding to hold child nodes

  private btnImgAssetIDArrayMap = new Map<string, string[]>();
  private btnInstanceIDArrayMap = new Map<string, string[]>();
  private buttonTextArrayMap = new Map<string, string[]>();
  private btnSpawnAssetIDArrayMap = new Map<string, string[]>();

  //multiplayer variables
  playerActiveTopMenuMap = new Map<Player, string>();

  private plotManager: Entity | null = null;

  //region initioalizeUI()
  initializeUI(): UINode {
    if (!this.props.enabled) this.entity.visible.set(false);

    this.animBnd_traslateY.set(this.isMenuOpen ? 0 : -200);

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
        layoutOrigin: [0.5, 0],
        transform: [{ translateY: this.animBnd_traslateY }],
      },
    });
  }

  //region preStart()
  preStart() {
    if (!this.props.enabled) return;

    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      debugLog(this.props.showDebugs, `Simple Button Pressed by ${data.player.name.get()}`);
    });

    //BUTTON ASSET ARRAY RESPONSE
    this.connectNetworkEvent(this.entity, OnButtonResponse, (data) => {
      debugLog(this.props.showDebugs, "Button Asset Response Received");
      this.btnImgAssetIDArrayMap.set(data.buttonType, data.btnImgAssetIDArray);
      this.btnInstanceIDArrayMap.set(data.buttonType, data.btnInstanceIDArray);
      this.buttonTextArrayMap.set(data.buttonType, data.buttonTextArray);
    });

    this.connectNetworkEvent(this.entity, OnButtonAssetResponse, (data) => {
      debugLog(this.props.showDebugs, `Button Asset Response Received`);
      this.btnImgAssetIDArrayMap.set(data.menuType, data.btnImgAssetIDArray);
      this.btnInstanceIDArrayMap.set(data.menuType, data.btnAssetIDArray);
      this.buttonTextArrayMap.set(data.menuType, data.buttonTextArray);
    });

    this.connectNetworkBroadcastEvent(sysEvents.TopMenuEvent, (data) => {
      debugLog(this.props.showDebugs, `SubMenu Event Received from ${data.player.name.get()} to open: ${data.buttonType}, open: ${data.open}`);

      const playerMenuType = this.playerActiveTopMenuMap.get(data.player) ?? BottomMenuType.Closed;
      if (
        data.buttonType === BottomMenuType.Closed ||
        // data.buttonType === BottomMenuType.PlotMenu ||
        data.buttonType === playerMenuType
      ) {
        this.playerActiveTopMenuMap.set(data.player, data.buttonType);
        this.animateMenu(data.player, data.open);
        return;
      }
      if (this.btnImgAssetIDArrayMap.has(data.buttonType!)) {
        if (data.open) {
          if (playerMenuType === BottomMenuType.PlotMenu) {
            //open the new menu
            const btnType = data.buttonType!;
            this.playerActiveTopMenuMap.set(data.player, data.buttonType!);
            const newUINodeArray = this.convertAssetArrayToUINodeArray(
              this.btnImgAssetIDArrayMap.get(btnType) ?? [],
              this.btnInstanceIDArrayMap.get(btnType) ?? [],
              this.buttonTextArrayMap.get(btnType) ?? []
            );
            this.childrenUINodeArray.set(newUINodeArray, [data.player]);
            this.animateMenu(data.player, true);
          } else {
            //close current menu then open new menu
            this.animateMenu(data.player, false);

            this.async.setTimeout(() => {
              const btnType = data.buttonType!;
              this.playerActiveTopMenuMap.set(data.player, data.buttonType!);
              const newUINodeArray = this.convertAssetArrayToUINodeArray(
                this.btnImgAssetIDArrayMap.get(btnType) || [],
                this.btnInstanceIDArrayMap.get(btnType) || [],
                this.buttonTextArrayMap.get(btnType) || []
              );
              this.childrenUINodeArray.set(newUINodeArray, [data.player]);
              this.animateMenu(data.player, true);
            }, 250);
          }
        } else {
          this.animateMenu(data.player, false);
        }
      } else {
        console.warn(`No menu found for type: ${data.buttonType} on ${this.entity.name.get()}`);
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
      const txtOffset = new Vec3(75, 0, 120); //(x%,y%, width%)

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
    if (this.playerActiveTopMenuMap.get(player) === PlotMenuTypes.Build) {
      const asset = new Asset(BigInt(instanceId));
      if (asset && this.plotManager) {
        this.sendNetworkEvent(this.plotManager!, sysEvents.spawnNewAssetEvent, {
          player: player!,
          assetId: instanceId,
        });
      }
      else{
        console.error(`Error fetching asset for instanceId ${instanceId}`);
      }
    }
    else{
      console.error(`ActiveTopMenu mismatch: ${this.playerActiveTopMenuMap.get(player)}`);
    }

    console.log(`Button with instanceId ${instanceId} pressed by player ${player.name.get()}`);
    switch (instanceId) {
      case "{0}":
        console.log("Button 1 Pressed");
        break;
      default:
        break;
    }
  }

  animateMenu(player: Player, open: boolean) {
    const moveToOffset = open ? 0 : -200;

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
UIComponent.register(UI_TopMenu);
