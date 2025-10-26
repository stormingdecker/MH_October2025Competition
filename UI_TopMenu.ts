import { OnButtonAssetResponse } from "ButtonAssetRegistry";
import { ButtonProps, OnButtonRequest, OnButtonResponse } from "ButtonRegistry";
import { Asset, Entity, Player, PropTypes, Vec3 } from "horizon/core";
import { AnimatedBinding, Animation, Binding, DynamicList, Easing, ImageSource, Text, UIComponent, UINode, View } from "horizon/ui";
import { sysEvents } from "sysEvents";
import { debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import { button, buttonImg, buttonImgWithText, convertAssetIDToImageSource, convertAssetToImageSource } from "sysUIStyleGuide";
import { OnTextureAssetRequest, OnTextureAssetResponse } from "TextureRegistry_Base";
import { Primary_MenuType, Sub_PlotType } from "UI_MenuManager";

import { simpleButtonEvent } from "UI_SimpleButtonEvent";

class UI_TopMenu extends UIComponent<typeof UI_TopMenu> {
  protected panelWidth: number = 500;
  protected panelHeight: number = 100;

  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    showDebugs: { type: PropTypes.Boolean, default: false },
    offset: { type: PropTypes.Vec3, default: new Vec3(50, 90, 0) },
    buttonRegistry: { type: PropTypes.Entity, default: null },
  };

  animBnd_translateY = new AnimatedBinding(0);
  isMenuOpen = false;
  closeOffset = -250;

  private childrenUINodeArray = new Binding<UINode[]>([]); // Binding to hold child nodes

  private btnImgAssetIDArrayMap = new Map<string, string[]>();
  private btnInstanceIDArrayMap = new Map<string, string[]>();
  private buttonTextArrayMap = new Map<string, string[]>();
  private btnSpawnAssetIDArrayMap = new Map<string, string[]>();

  private buttonPropsMap = new Map<string, ButtonProps>();

  //multiplayer variables
  playerMenuContextMap = new Map<Player, string[]>();

  private plotManager: Entity | null = null;

  //region initializeUI()
  initializeUI(): UINode {
    if (!this.props.enabled) this.entity.visible.set(false);

    this.animBnd_translateY.set(this.isMenuOpen ? 0 : this.closeOffset);

    return View({
      children: [
        DynamicList({
          data: this.childrenUINodeArray,
          renderItem: (item: UINode) => item, // Render each item as is
          style: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          },
        }),
      ],
      style: {
        // backgroundColor: "rgba(0, 0, 0, 0.5)",
        left: `${this.props.offset.x!}%`,
        top: `${100 - this.props.offset.y!}%`,
        height: this.panelHeight,
        width: this.panelWidth,
        alignItems: "center",
        position: "absolute",
        layoutOrigin: [0.5, 0],
        transform: [{ translateY: this.animBnd_translateY }],
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
      console.log("Button Asset Response Received");
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

    //region menuContext Event
    this.connectNetworkBroadcastEvent(sysEvents.updateMenuContext, (data) => {
      const curPlayerMenuContext = this.playerMenuContextMap.get(data.player) ?? [];
      this.playerMenuContextMap.set(data.player, curPlayerMenuContext);
      let menuType = "";
      if (data.menuContext.length <= 1) {
        //close menu
        this.animateMenu(data.player, false);

        return;
      } else if (data.menuContext.length === 3) {
        //detail menu stuff
        //if there's no sub menu, close menu
        if (this.buttonPropsMap.has(data.menuContext[2]) === false) {
          if (data.menuContext[1] === Sub_PlotType.BuildMode) {
          } else {
            this.animateMenu(data.player, false);
          }
          return;
        }
        menuType = data.menuContext[2]!;
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
  }

  //region Asset[] to UINode[]
  private convertAssetArrayToUINodeArray(buttonImgAssetIDArray: string[], btnInstanceIDArray: string[], buttonTextArray: string[]): UINode[] {
    try {
      const newUIArray: UINode[] = [];
      const txtOffset = new Vec3(50, 0, 120); //(x%,y%, width%)

      buttonImgAssetIDArray.forEach((textureID, index) => {
        newUIArray.push(buttonImgWithText(this, `${btnInstanceIDArray[index]}`, convertAssetIDToImageSource(buttonImgAssetIDArray[index]), `${buttonTextArray[index]}`, txtOffset, this.onButtonPressed.bind(this), 50));
      });

      return newUIArray;
    } catch (error) {
      console.error(`Error fetching texture assets`, error);
      return []; // Skip this iteration if texture asset is not found
    }
  }

  //region button pressed
  onButtonPressed(instanceId: string, player: Player): void {
    const curMenuContext = this.playerMenuContextMap.get(player) ?? [];
    if (curMenuContext[0] === Primary_MenuType.PlotMenu) {
      //we in detail menu
      if (curMenuContext[1] === Sub_PlotType.BuildMode) {
        console.log(`Button with instanceId ${instanceId} pressed by player ${player.name.get()}`);
        switch (instanceId) {
          case "rotate":
            console.log("Button 1 Pressed");
            this.sendNetworkBroadcastEvent(sysEvents.buildRotateEvent, { player: player });
            break;
          case "delete":
            console.log("Button 2 Pressed");
            this.sendNetworkBroadcastEvent(sysEvents.tryDeleteSelectedItemEvent, {
              player: player,
            });
            break;
          default:
            break;
        }
      }
    } else if (curMenuContext.length === 2) {
      //we in sub menu
    }
  }

  animateMenu(player: Player, open: boolean) {
    const moveToOffset = open ? 0 : this.closeOffset;

    this.animBnd_translateY.set(
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
