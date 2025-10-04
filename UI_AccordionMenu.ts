import { OnButtonRequest, OnButtonResponse } from "ButtonRegistry";
import { Asset, NetworkEvent, Player, PropTypes, Vec3 } from "horizon/core";
import { AnimatedBinding, Animation, Binding, DynamicList, Easing, Text, UIComponent, UINode, View } from "horizon/ui";
import { sysEvents } from "sysEvents";
import {
  buttonImg,
  buttonImgWithText,
  convertAssetIDToImageSource,
  convertAssetToImageSource,
  menuButton,
} from "sysUIStyleGuide";



export const enum MenuBtnType {
  Closed = "Closed",
  AccordionMenu = "AccordionMenu",
  BuildMenu = "BuildMenu",
  FarmMenu = "FarmMenu",
  ResourcesMenu = "ResourcesMenu",
  CombatMenu = "CombatMenu",
  FishingMenu = "FishingMenu",
}

class UI_AccordionMenu extends UIComponent<typeof UI_AccordionMenu> {
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    buttonRegistry: { type: PropTypes.Entity, default: null },
    offset: { type: PropTypes.Vec3, default: new Vec3(92, 53, 0) },
  };

  doesMenuStartOpen = false; //specialy use case applies to all players
  doesSideMenuStartOpen = false; //specially use case applies to all players

  //multiplayer variables
  animBnd_traslateY = new AnimatedBinding(0);
  animBnd_traslateX = new AnimatedBinding(0);
  playerActiveMenuMap = new Map<Player, string>(); //which menu is active

  private childrenUINodeArray = new Binding<UINode[]>([]); // Binding to hold child nodes

  private btnImgAssetIDArrayMap = new Map<string, string[]>();
  private btnInstanceIDArrayMap = new Map<string, string[]>();
  private buttonTextArrayMap = new Map<string, string[]>();

  //region initializeUI()
  initializeUI(): UINode {
    if (!this.props.enabled) this.entity.visible.set(false);

    const txtOffset = new Vec3(50, 0, 145); //(x%,y%, width%)
    //close the menu

    this.animBnd_traslateY.set(this.doesMenuStartOpen ? 0 : 500);
    this.animBnd_traslateX.set(this.doesSideMenuStartOpen ? 0 : -200);

    return View({
      //1
      children: [
        View({
          //2.0
          children: [menuButton(this, MenuBtnType.AccordionMenu, "Menu", this.onButtonPressed.bind(this))],
          style: {
            width: 125,
            height: 40,
            left: "0%",
            top: "100%",
            zIndex: 10,
            position: "absolute",
            layoutOrigin: [0, 0.2],
          },
          //2.0
        }),
        View({
          //2.1
          //this is the hidden overflow mask
          children: [
            View({
              // this will be the animated container
              children: [
                DynamicList({
                  data: this.childrenUINodeArray,
                  renderItem: (item: UINode) => item, // Render each item as is
                  style: {
                    width: "100%",
                    height: "100%",
                  },
                }),
              ],
              style: {
                // backgroundColor: "rgba(60, 255, 0, 0.69)",
                height: "100%",
                width: 100,
                transform: [{ translateY: this.animBnd_traslateY }],
                flexDirection: "column",
                alignContent: "center",
                alignSelf: "center",
                justifyContent: "center",
                zIndex: 6,
              },
            }),
          ],
          style: {
            // backgroundColor: "rgba(255, 0, 0, 0.52)",
            height: 470,
            width: "100%",
            position: "absolute",
            justifyContent: "center",
            alignContent: "center",
            overflow: "hidden",
            zIndex: 5,
            // left: "25%",
          },
          //2.1
        }),
      ],
      style: {
        // backgroundColor: "rgba(0, 0, 0, 0.5)",
        left: `${this.props.offset.x!}%`,
        top: `${100 - this.props.offset.y!}%`,
        height: 460,
        width: 125,
        alignItems: "center",
        position: "absolute",
        layoutOrigin: [0.5, 0.5],
      },
      //1
    });
  }

  //region preStart()
  preStart() {
    if (!this.props.enabled) return;

    this.connectNetworkEvent(this.entity, OnButtonResponse, (data) => {
      console.log("Received button asset response:", data);
      this.btnImgAssetIDArrayMap.set(data.buttonType, data.btnImgAssetIDArray);
      this.btnInstanceIDArrayMap.set(data.buttonType, data.btnInstanceIDArray);
      this.buttonTextArrayMap.set(data.buttonType, data.buttonTextArray);
    });
  }

  //region start()
  start() {
    if (!this.props.enabled) return;

    if (this.props.buttonRegistry) {
      this.sendNetworkEvent(this.props.buttonRegistry!, OnButtonRequest, { requester: this.entity });
    }
  }

  //region onButtonPressed()
  onButtonPressed(instanceId: string, player: Player): void {
    console.log(`Button with instanceId ${instanceId} pressed by player ${player.name.get()}`);

    let playerMenuType = this.playerActiveMenuMap.get(player) ?? MenuBtnType.Closed;

    if (playerMenuType === MenuBtnType.BuildMenu){
      this.sendNetworkBroadcastEvent(sysEvents.buildMenuEvent, { player: player });
    }

    switch (instanceId) {
      case MenuBtnType.AccordionMenu:
        if (playerMenuType === MenuBtnType.Closed) {
          //open the menu
          const btnType = MenuBtnType.AccordionMenu;
          this.playerActiveMenuMap.set(player, MenuBtnType.AccordionMenu);
          const newUINodeArray = this.convertAssetArrayToUINodeArray(
            btnType,
            this.btnImgAssetIDArrayMap.get(btnType) || [],
            this.btnInstanceIDArrayMap.get(btnType) || [],
            this.buttonTextArrayMap.get(btnType) || []
          );
          this.childrenUINodeArray.set(newUINodeArray, [player]);

          this.animateMenu(player, true);
        } else {
          //close the menu
  
          this.animateMenu(player, false);
          this.playerActiveMenuMap.set(player, MenuBtnType.Closed);

          this.sendNetworkBroadcastEvent(sysEvents.TopMenuEvent, {
            player: player,
            buttonType: MenuBtnType.Closed,
            open: false,
          });
        }
        break;
      case MenuBtnType.BuildMenu:
        const isOpenBuildMenu = this.isMenuOpen(player, MenuBtnType.BuildMenu);
        this.sendNetworkBroadcastEvent(sysEvents.buildMenuEvent, { player: player });
        break;
      case MenuBtnType.FarmMenu:
        this.isMenuOpen(player, MenuBtnType.FarmMenu);
        break;
      case MenuBtnType.ResourcesMenu:
        this.isMenuOpen(player, MenuBtnType.ResourcesMenu);
        break;
      case MenuBtnType.CombatMenu:
        this.isMenuOpen(player, MenuBtnType.CombatMenu);
        break;
      case MenuBtnType.FishingMenu:
        this.isMenuOpen(player, MenuBtnType.FishingMenu);
        break;
      default:
        console.warn(`Unhandled button press for instanceId: ${instanceId}`);
        break;
    }

    // this.sendNetworkBroadcastEvent(subMenuEvent, { player: player, buttonType: instanceId, open:  });
  }

  isMenuOpen(player: Player, menuBtnType: string): boolean{
    const playerMenuType = this.playerActiveMenuMap.get(player) ?? MenuBtnType.Closed;
    if (playerMenuType === menuBtnType) {
      console.log(`Closing menu: ${menuBtnType}`);
      //close the build menu
      this.playerActiveMenuMap.set(player, MenuBtnType.AccordionMenu);
      this.sendNetworkBroadcastEvent(sysEvents.TopMenuEvent, {
        player: player,
        buttonType: MenuBtnType.AccordionMenu,
        open: false,
      });
      return false;
    } else {
      console.log(`Opening menu: ${menuBtnType}`);
      this.playerActiveMenuMap.set(player, menuBtnType);
      this.sendNetworkBroadcastEvent(sysEvents.TopMenuEvent, {
        player: player,
        buttonType: menuBtnType,
        open: true,
      });
      return true;
    }
  }

  //region animateMenu()
  animateMenu(player: Player, open: Boolean) {
    const moveToOffset = open ? 0 : 500;

    this.animBnd_traslateY.set(
      // notice that -100 will make it go up 100px
      Animation.timing(moveToOffset, {
        // how long it takes to complete in ms
        duration: 500,
        // we could be using Easing.cubic without the Easing.inOut alternatively
        easing: Easing.linear,
      }),
      // what should happen after it's done
      undefined,
      //the array of players that will see
      [player]
    );
  }

  //region Asset[] to UINode[]
  private convertAssetArrayToUINodeArray(
    buttonType: string,
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
}
UIComponent.register(UI_AccordionMenu);
