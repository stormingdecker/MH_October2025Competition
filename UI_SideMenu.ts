import { OnButtonRequest, OnButtonResponse } from "ButtonRegistry";
import { Asset, NetworkEvent, Player, PropTypes, Vec3 } from "horizon/core";
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
import { tryDeleteSelectedItemEvent } from "RaycastItemPlacement";
import { sysEvents } from "sysEvents";
import {

  buttonImgWithText,
  convertAssetIDToImageSource,
} from "sysUIStyleGuide";
import { MenuBtnType } from "UI_AccordionMenu";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";



class UI_SideMenu extends UIComponent<typeof UI_SideMenu> {
  protected panelWidth: number = 100;
  protected panelHeight: number = 460;

  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    offset: { type: PropTypes.Vec3, default: new Vec3(95, 50, 0) },
    buttonRegistry: { type: PropTypes.Entity, default: null },
  };

  animBnd_traslateX = new AnimatedBinding(0);
  isMenuOpen = false;

  private childrenUINodeArray = new Binding<UINode[]>([]); // Binding to hold child nodes

  private btnImgAssetIDArrayMap = new Map<string, string[]>();
  private btnInstanceIDArrayMap = new Map<string, string[]>();
  private buttonTextArrayMap = new Map<string, string[]>();

  //multiplayer variables
  playerActiveMenuMap = new Map<Player, string>();

  //region initioalizeUI()
  initializeUI(): UINode {
    if (!this.props.enabled) this.entity.visible.set(false);

    this.animBnd_traslateX.set(this.isMenuOpen ? 0 : 200);

    return View({
      children: [
        DynamicList({
          data: this.childrenUINodeArray,
          renderItem: (item: UINode) => item, // Render each item as is
          style: {
            // flexDirection: "row",
            // flexWrap: "wrap",
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
        layoutOrigin: [1, 0.5],
        transform: [{ translateX: this.animBnd_traslateX }],
      },
    });
  }

  arrayIDMap = new Map<number, string[]>();
  mapIndex = 0;
  //region preStart()
  preStart() {
    if (!this.props.enabled) return;

    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      console.log(`Simple Button Pressed by ${data.player.name.get()}`);
      this.animateMenu(data.player, (this.isMenuOpen = !this.isMenuOpen));
    });

    //BUTTON ASSET ARRAY RESPONSE
    this.connectNetworkEvent(this.entity, OnButtonResponse, (data) => {
      console.log("Button Asset Response Received");
      this.btnImgAssetIDArrayMap.set(data.buttonType, data.btnImgAssetIDArray);
      this.btnInstanceIDArrayMap.set(data.buttonType, data.btnInstanceIDArray);
      this.buttonTextArrayMap.set(data.buttonType, data.buttonTextArray);
    });

    this.connectNetworkBroadcastEvent(sysEvents.TopMenuEvent, (data) => {
      console.log(
        `SubMenu Event Received from ${data.player.name.get()} to move: ${data.buttonType}, open: ${data.open}`
      );

      const playerMenuType = this.playerActiveMenuMap.get(data.player) ?? MenuBtnType.Closed;
      if (
        data.buttonType === MenuBtnType.Closed ||
        data.buttonType === MenuBtnType.AccordionMenu ||
        data.buttonType === playerMenuType
      ) {
        console.log(`Closing menu: ${data.buttonType}`);
        this.playerActiveMenuMap.set(data.player, data.buttonType);
        this.animateMenu(data.player, false);
        return;
      }
      if (this.btnImgAssetIDArrayMap.has(data.buttonType!)) {
        if (data.open) {
          if (playerMenuType === MenuBtnType.AccordionMenu) {
            //open the new menu
            console.log(`Opening menu: ${data.buttonType}`);
            const btnType = data.buttonType!;
            this.playerActiveMenuMap.set(data.player, data.buttonType!);
            const newUINodeArray = this.convertAssetArrayToUINodeArray(
              this.btnImgAssetIDArrayMap.get(btnType) ?? [],
              this.btnInstanceIDArrayMap.get(btnType) ?? [],
              this.buttonTextArrayMap.get(btnType) ?? []
            );
            this.childrenUINodeArray.set(newUINodeArray, [data.player]);
            this.animateMenu(data.player, true);
          } else {
            //close current menu then open new menu
            console.log(`Switching menu: ${data.buttonType}`);
            this.animateMenu(data.player, false);

            this.async.setTimeout(() => {
              const btnType = data.buttonType!;
              this.playerActiveMenuMap.set(data.player, data.buttonType!);
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

  //region onButtonPressed()
  onButtonPressed(instanceId: string, player: Player): void {
    console.log(`Button with instanceId ${instanceId} pressed by player ${player.name.get()}`);
    switch (instanceId) {
      case "rotate":
        console.log("Button 1 Pressed");
        this.sendNetworkBroadcastEvent(sysEvents.buildRotateEvent, { player: player });
        break;
      case "delete":
        console.log("Button 2 Pressed");
        this.sendNetworkBroadcastEvent(sysEvents.tryDeleteSelectedItemEvent, { player: player });
        break;
      default:
        break;
    }
  }

  animateMenu(player: Player, open: boolean) {
    const moveToOffset = open ? 0 : 200;

    this.animBnd_traslateX.set(
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
