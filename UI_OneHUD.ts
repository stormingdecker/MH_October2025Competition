// Copyright (c) Dave Mills (uRocketLife). Released under the MIT License.

import { DailyRewardManager } from "DailyRewardManager";
import {
  Asset,
  Color,
  Entity,
  NetworkEvent,
  Player,
  PropTypes,
  TextureAsset,
  Vec3,
} from "horizon/core";
import {
  AnimatedBinding,
  Animation,
  Binding,
  DynamicList,
  Easing,
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";
import { ImageSetProps, OnImageSetResponse } from "ImageRegistry";
import { InventoryManager } from "InventoryManager";
import { sysEvents } from "sysEvents";
import { debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import { foodTypes, InventoryType, pieTypes } from "sysTypes";
import {
  btnImgBndText,
  buttonImg,
  buttonImgWithText,
  confirm,
  convertAssetIDToImageSource,
  dailyRewardWindow,
  DefaultBlankImgAssetID,
  foodMenuWindow,
  ImgSetUIwStrings,
  inventoryDetailWindow,
  inventoryMenuWindow,
  inventorySlotButton,
  merchantDetailWindow,
  notification,
  numberUp,
  popup,
  progressBar,
  progressionTask,
} from "sysUIStyleGuide";
import { getMgrClass, validate } from "sysUtils";
import {
  Detail_Fruit,
  Primary_MenuType,
  Sub_InventoryType,
  Sub_MerchantType,
  Sub_PlotType,
} from "UI_MenuManager";
import { oneHudEvents } from "UI_OneHUDEvents";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

export const UI_OneHudTag = "UI_OneHUD";

export const enum inventoryWindowType {
  Undefined,
  Personal,
  Sell,
  Buy,
}

export const PieBackgroundColor = "rgba(149, 217, 221, 1)";
export const FruitBackgroundColor = "rgba(255, 189, 89, 1)";
export const RecipeBackgroundColor = "rgba(255, 121, 121, 1)";

export class UI_OneHUD extends UIComponent<typeof UI_OneHUD> {
  //region propsDefs
  static propsDefinition = {
    showDebugs: { type: PropTypes.Boolean, default: false },
    enabled: { type: PropTypes.Boolean, default: true },
    //progress bar vars
    PROGRESS_BAR_HEADER: { type: PropTypes.String, default: "ProgressBar" },
    progressBarEnabled: { type: PropTypes.Boolean, default: true },
    pbScreenPosition: { type: PropTypes.Vec3, default: new Vec3(50, 90, 10) },
    pbRotation: { type: PropTypes.Number, default: 0 },
    pbShowText: { type: PropTypes.Boolean, default: true },
    //player level vars
    LEVEL_HEADER: { type: PropTypes.String, default: "Level" },
    lvlEnabled: { type: PropTypes.Boolean, default: true },
    lvlImgAsset: { type: PropTypes.Asset },
    lvlScreenPosition: { type: PropTypes.Vec3, default: new Vec3(30, 90, 11) },
    lvlScale: { type: PropTypes.Number, default: 1.0 },
    lvlNumColor: { type: PropTypes.Color, default: new Color(1, 1, 1) },
    lvlBackgroundOn: { type: PropTypes.Boolean, default: true },
    lvlBackgroundColor: { type: PropTypes.Color, default: new Color(1, 0.7, 0) },
    //player health vars
    HEALTH_BAR_HEADER: { type: PropTypes.String, default: "Health" },
    healthBarEnabled: { type: PropTypes.Boolean, default: true },
    hbScreenPosition: { type: PropTypes.Vec3, default: new Vec3(50, 80, 10) },
    hbRotation: { type: PropTypes.Number, default: 0 },
    hbShowText: { type: PropTypes.Boolean, default: true },
    //player score vars
    SCORE_HEADER: { type: PropTypes.String, default: "Score" },
    scoreEnabled: { type: PropTypes.Boolean, default: true },
    scoreImgAsset: { type: PropTypes.Asset },
    scoreScreenPosition: { type: PropTypes.Vec3, default: new Vec3(80, 90, 11) },
    scoreScale: { type: PropTypes.Number, default: 1.0 },
    scoreNumColor: { type: PropTypes.Color, default: new Color(1, 1, 1) },
    scoreBackgroundOn: { type: PropTypes.Boolean, default: true },
    scoreBackgroundColor: { type: PropTypes.Color, default: new Color(0, 0, 1) },
    //player popup vars
    POPUP_HEADER: { type: PropTypes.String, default: "Popup" },
    popupEnabled: { type: PropTypes.Boolean, default: true },
    hidePopupOnStart: { type: PropTypes.Boolean, default: true },
    defaultWatermark: { type: PropTypes.Asset },
    //player notification vars
    NOTIFICATION_HEADER: { type: PropTypes.String, default: "Notification" },
    notificationEnabled: { type: PropTypes.Boolean, default: true },
    hideNotificationOnStart: { type: PropTypes.Boolean, default: true },
    notificationImg: { type: PropTypes.Asset },
    //player confirmation vars
    CONFIRMATION_HEADER: { type: PropTypes.String, default: "Confirmation" },
    confirmationEnabled: { type: PropTypes.Boolean, default: true },
    hideConfirmationOnStart: { type: PropTypes.Boolean, default: true },

    //currency vars
    CURRENCY_HEADER: { type: PropTypes.String, default: "CurrencyButtons" },
    currencyImgAsset: { type: PropTypes.Asset },
    diamondImgAsset: { type: PropTypes.Asset },
    currencyPlusImg: { type: PropTypes.Asset },
    currencyScreenPosition: { type: PropTypes.Vec3, default: new Vec3(50, 70, 11) },
    currencyContainerSize: { type: PropTypes.Vec3, default: new Vec3(75, 75, 75) }, //width, height, icon scale
    //task progress popup
    PROGRESSION_TASK_HEADER: { type: PropTypes.String, default: "Progression Task" },
    progTaskEnabled: { type: PropTypes.Boolean, default: false },
    progTaskSize: { type: PropTypes.Vec3, default: new Vec3(300, 100, 1) }, //width, height, scale
    progTaskScreenPosition: { type: PropTypes.Vec3, default: new Vec3(50, 60, 11) }, //x%, y%, z-index
    progTaskResultImg: { type: PropTypes.Asset },
    progTaskInstructImg: { type: PropTypes.Asset },
    //inventory menu
    INVENTORY_MENU_HEADER: { type: PropTypes.String, default: "Inventory Menu" },
    inventoryImgAsset: { type: PropTypes.Asset },
    inventoryScreenPosition: { type: PropTypes.Vec3, default: new Vec3(50, 50, 10) }, //x%, y%, z-index
  };

  private inventoryMgr?: InventoryManager;

  //region private var
  //progressBar Variables
  bnd_progressBar = new Binding<string>("0%");
  bnd_showLvlProgress = new Binding<string>("none");

  //lvlUp Variables
  bnd_lvlNumber = new Binding<string>("0");
  animBnd_lvlScale = new AnimatedBinding(1);

  //healthBar Variables
  //this is just visual, default value is set in setHealth()
  bnd_healthBar = new Binding<string>("50");
  bnd_showHealthBar = new Binding<string>("none");
  playerHealthMap: Map<Player, number> = new Map();

  //score Variables
  bnd_score = new Binding<string>("0");
  animBnd_scoreScale = new AnimatedBinding(1);

  //currency Variables
  bnd_currencyCount = new Binding<string>("0");
  animBnd_currencyScale = new AnimatedBinding(1);

  //diamond Variables
  bnd_diamondCount = new Binding<string>("0");
  animBnd_diamondScale = new AnimatedBinding(1);

  //inventory Variables
  bnd_inventoryCount = new Binding<string>("0");
  animBnd_inventoryScale = new AnimatedBinding(1);

  //popup Variables
  bnd_popupDisplay = new Binding<string>("none");
  bnd_popupTitle = new Binding<string>("New Popup!");
  bnd_popupContent = new Binding<string>("Popup Content");
  bnd_popupWatermark = new Binding<ImageSource>(""); // Provide an initial value, e.g., empty string or default image source
  animBnd_popupPosY = new AnimatedBinding(1);
  bnd_popupBtnScale = new Binding<number>(1);
  //keeps track of which entity by which player requested the popup, so we can respond to the right entity when they close it
  popupRequestResponseMap = new Map<Player, Entity>();

  //notification variables
  bnd_notifyDisplay = new Binding<string>("none");
  bndAlertImg = new Binding<ImageSource>("");
  bndAlertMsg = new Binding<string>("Looking good today!");
  animBnd_translateX = new AnimatedBinding(0);
  bnd_notifyBkgColor = new Binding<string>("rgba(255, 0, 0, 1)");
  private notifyEasing!: Easing;

  //confirmation variables
  bnd_confirmDisplay = new Binding<string>("none");
  bndHeaderText = new Binding<string>("Are you sure you want to proceed?");
  //Stores player to message making multiplayer confirmations work per player
  playerMessageMap: Map<Player, { entity: Entity; message: string }> = new Map();
  bndConfirm_Scale = new Binding<number>(1);
  bndCancel_Scale = new Binding<number>(1);

  //prog task
  bnd_progTaskDisplay = new Binding<string>("none");
  bnd_progTaskHeader = new Binding<string>("Progression Task");
  bnd_progTaskContent = new Binding<string>("Complete the task to earn rewards!");
  bnd_progTaskResultImg = new Binding<ImageSource>(
    convertAssetIDToImageSource(DefaultBlankImgAssetID)
  );
  bnd_progTaskInstructImg = new Binding<ImageSource>(
    convertAssetIDToImageSource(DefaultBlankImgAssetID)
  );
  bnd_progTaskProgressAsString = new Binding<string>("0");
  animBnd_ProgTaskTranslateY = new AnimatedBinding(0);
  openProgTaskOnStart = false;
  bnd_showTaskProgressBar = new Binding<string>("none");

  //currency ui nodes
  private currencyUINodeArray = new Binding<UINode[]>([]); // Binding to hold currency nodes

  //image set map for multi-image sets
  private imageSetMap = new Map<string, ImageSetProps>();

  //daily rewards
  private dailyReward_childrenUINodeArray = new Binding<UINode[]>([]); // Binding to hold child nodes
  private bnd_dailyRewardDisplay = new Binding<string>("none");
  private playerGiftBoxMap: Map<Player, Entity> = new Map(); //i don't love it but it works
  private playerDailyStreakMap: Map<Player, number> = new Map();

  //food menu
  private foodMenu_childrenUINodeArray = new Binding<UINode[]>([]); // Binding to hold child nodes
  private bnd_foodMenuDisplay = new Binding<string>("none");

  //inventory menu
  private inventory_childrenUINodeArray = new Binding<UINode[]>([]); // Binding to hold child nodes
  private bnd_inventoryDisplay = new Binding<string>("none");
  private inventoryCountBindings: Map<InventoryType, Binding<string>> = new Map(); //FUTURE NOTE: this can likely be reduced to just a binding (no map needed)
  private bnd_inventoryHeaderText = new Binding<string>("Inventory");

  //inventory detail window
  private bnd_inventoryDetailDisplay = new Binding<string>("none");
  private bnd_inventoryItemImg = new Binding<ImageSource>(
    convertAssetIDToImageSource(DefaultBlankImgAssetID)
  );
  private bnd_inventoryItemInstanceId = new Binding<string>("");
  private bnd_inventoryItemName = new Binding<string>("");
  private bnd_inventoryDetailText = new Binding<string>("0");

  //merchant detail window
  private bnd_merchantItemImg = new Binding<ImageSource>(
    convertAssetIDToImageSource(DefaultBlankImgAssetID)
  );
  private bnd_merchantItemInstanceId = new Binding<string>("");
  private bnd_merchantItemName = new Binding<string>("");
  private bnd_merchantItemPrice = new Binding<string>("0");
  private bnd_merchantDetailDisplay = new Binding<string>("none");
  private bnd_merchantBtnText = new Binding<string>("Sell");

  //multiplayer variables
  private playerMenuContextMap = new Map<Player, string[]>();
  private prevPlayerMenuContextMap = new Map<Player, string[]>();

  //add to inventory VFX
  private itemImgPosX = new AnimatedBinding(0.5);
  private itemImgPosY = new AnimatedBinding(0.5);
  private itemImgScale = new AnimatedBinding(1);
  private itemImgSource = new Binding<ImageSource>(
    convertAssetIDToImageSource(DefaultBlankImgAssetID)
  );
  private itemImgDisplay = new Binding<string>("none");

  //region initializeUI()
  initializeUI(): UINode {
    if (!this.props.enabled) {
      this.entity.visible.set(false);
    }

    //popup bindings
    const defaultWatermark = ImageSource.fromTextureAsset(this.props.defaultWatermark!);
    this.bnd_popupWatermark.set(defaultWatermark);

    const notificationImg = ImageSource.fromTextureAsset(this.props.notificationImg!);
    this.bndAlertImg.set(notificationImg);

    const lvlImgAssetId = this.props.lvlImgAsset?.id?.toString() ?? DefaultBlankImgAssetID; // default to blank image asset
    const scoreImgAssetId = this.props.scoreImgAsset?.id?.toString() ?? DefaultBlankImgAssetID; // default to blank image asset

    const inventoryImgAssetId =
      this.props.inventoryImgAsset?.id?.toString() ?? DefaultBlankImgAssetID; // default to blank image asset
    const diamondImgAssetId = this.props.diamondImgAsset?.id?.toString() ?? DefaultBlankImgAssetID; // default to blank image asset
    const currencyImgAssetId =
      this.props.currencyImgAsset?.id?.toString() ?? DefaultBlankImgAssetID; // default to blank image asset
    const plusImgAssetId = this.props.currencyPlusImg?.id?.toString() ?? DefaultBlankImgAssetID; // default to blank image asset
    this.animBnd_currencyScale.set(1);
    this.animBnd_diamondScale.set(1);

    const progTaskResultImgId =
      this.props.progTaskResultImg?.id?.toString() ?? DefaultBlankImgAssetID;
    this.bnd_progTaskResultImg.set(convertAssetIDToImageSource(progTaskResultImgId));
    const progTaskInstructImgId =
      this.props.progTaskInstructImg?.id?.toString() ?? DefaultBlankImgAssetID;
    this.bnd_progTaskInstructImg.set(convertAssetIDToImageSource(progTaskInstructImgId));
    this.animBnd_ProgTaskTranslateY.set(this.openProgTaskOnStart ? 0 : 200);

    this.itemImgSource.set(
      ImageSource.fromTextureAsset(new TextureAsset(BigInt(1973296496791704)))
    );

    // Initialize UI elements here
    return View({
      children: [
        //progress bar
        ...this.toNodes(
          progressBar(
            this.bnd_progressBar,
            this.bnd_showLvlProgress,
            new Vec3(500, 50, 1),
            this.props.pbScreenPosition,
            this.props.pbRotation,
            "grey",
            "yellow",
            this.props.pbShowText,
            "black"
          )
        ),

        //health bar
        ...this.toNodes(
          progressBar(
            this.bnd_healthBar,
            this.bnd_showHealthBar,
            new Vec3(500, 50, 1),
            this.props.hbScreenPosition,
            this.props.hbRotation,
            "grey",
            "red",
            this.props.hbShowText,
            "black"
          )
        ),
        //level up
        ...this.toNodes(
          numberUp(
            this.bnd_lvlNumber,
            this.props.lvlEnabled,
            this.props.lvlScreenPosition,
            this.props.lvlScale,
            this.props.lvlBackgroundOn,
            this.props.lvlBackgroundColor,
            this.props.lvlNumColor,
            this.animBnd_lvlScale,
            lvlImgAssetId
          )
        ),
        //score
        ...this.toNodes(
          numberUp(
            this.bnd_score,
            this.props.scoreEnabled,
            this.props.scoreScreenPosition,
            this.props.scoreScale,
            this.props.scoreBackgroundOn,
            this.props.scoreBackgroundColor,
            this.props.scoreNumColor,
            this.animBnd_scoreScale,
            scoreImgAssetId
          )
        ),
        View({
          children: [
            //region inventory count
            ...this.toNodes(
              buttonImg(
                this,
                "inventoryBtn",
                convertAssetIDToImageSource(inventoryImgAssetId),
                this.onButtonPressed.bind(this),
                100
              )
            ),
          ],
          style: {
            position: "absolute",
            layoutOrigin: [0.5, 0.5],
            left: `${this.props.inventoryScreenPosition.x!}%`,
            top: `${100 - this.props.inventoryScreenPosition.y!}%`,
            zIndex: this.props.inventoryScreenPosition.z!,
          },
        }),
        View({
          children: [
            // //region diamond count
            // ...this.toNodes(
            //   btnImgBndText(
            //     this,
            //     "diamondBtn",
            //     convertAssetIDToImageSource(diamondImgAssetId),
            //     this.bnd_diamondCount,
            //     convertAssetIDToImageSource(plusImgAssetId),
            //     this.animBnd_diamondScale,
            //     this.onButtonPressed.bind(this)
            //   )
            // ),
            //region currency count
            ...this.toNodes(
              btnImgBndText(
                this,
                "currencyBtn",
                convertAssetIDToImageSource(currencyImgAssetId),
                this.bnd_currencyCount,
                convertAssetIDToImageSource(plusImgAssetId),
                this.animBnd_currencyScale,
                this.onButtonPressed.bind(this)
              )
            ),
          ],
          style: {
            // backgroundColor: "rgba(0, 0, 0, 0.5)",
            left: `${this.props.currencyScreenPosition.x!}%`,
            top: `${100 - this.props.currencyScreenPosition.y!}%`,
            height: this.props.currencyContainerSize.y!,
            width: this.props.currencyContainerSize.x!,
            flexDirection: "row",

            alignItems: "center",
            position: "absolute",
            layoutOrigin: [0, 1],
            transform: [{ scale: this.props.currencyContainerSize.z }],
          },
        }),
        //popup window
        ...this.toNodes(
          popup(
            this.bnd_popupTitle,
            this.bnd_popupContent,
            this.bnd_popupWatermark,
            this.bnd_popupDisplay,
            this.animBnd_popupPosY,
            600,
            300,
            this.bnd_popupBtnScale,
            (player: Player) => this.onPopupBtnPressed(player)
          )
        ),
        //notification
        ...this.toNodes(
          notification(
            this.bnd_notifyDisplay,
            this.bndAlertImg,
            this.bndAlertMsg,
            this.animBnd_translateX,
            450,
            150,
            this.bnd_notifyBkgColor
          )
        ),
        //confirmation panel
        ...this.toNodes(
          confirm(
            this,
            this.bndHeaderText,
            this.bndConfirm_Scale,
            this.bndCancel_Scale,
            this.bnd_confirmDisplay,
            (accepted: boolean, player: Player) => this.handleConfirmationResponse(accepted, player)
          )
        ),
        //progress task popup
        ...this.toNodes(
          progressionTask(
            this.bnd_progTaskDisplay,
            this.bnd_progTaskHeader,
            this.bnd_progTaskContent,
            this.bnd_progTaskProgressAsString,
            this.bnd_progTaskResultImg,
            this.bnd_progTaskInstructImg,
            this.props.progTaskSize,
            this.props.progTaskScreenPosition,
            this.animBnd_ProgTaskTranslateY,
            this.bnd_showTaskProgressBar
          )
        ), //region daily reward window
        ...this.toNodes(
          dailyRewardWindow(
            this,
            this.onButtonPressed.bind(this),
            this.dailyReward_childrenUINodeArray,
            this.bnd_dailyRewardDisplay
          )
        ),
        ...this.toNodes(
          foodMenuWindow(
            this,
            this.onButtonPressed.bind(this),
            this.foodMenu_childrenUINodeArray,
            this.bnd_foodMenuDisplay
          )
        ),
        ...this.toNodes(
          inventoryMenuWindow(
            //FUTURE NOTE: make Menu for inventoryWindow
            this,
            this.onButtonPressed.bind(this),
            this.inventory_childrenUINodeArray,
            this.bnd_inventoryDisplay,
            this.bnd_inventoryHeaderText
          )
        ),
        ...this.toNodes(
          inventoryDetailWindow(
            this,
            this.bnd_inventoryItemInstanceId,
            this.bnd_inventoryItemName,
            this.bnd_inventoryItemImg,
            this.bnd_inventoryDetailText,
            this.bnd_inventoryDetailDisplay
          )
        ),
        //MERCHANT MENUS
        ...this.toNodes(
          merchantDetailWindow(
            this,
            this.bnd_merchantItemInstanceId,
            this.bnd_merchantItemName,
            this.bnd_merchantItemImg,
            this.bnd_merchantItemPrice,
            this.onButtonPressed.bind(this),
            this.bnd_merchantDetailDisplay,
            this.bnd_merchantBtnText
          )
        ),
        //Inventory Item Add VFX
        View({
          children: [
            Image({
              source: this.itemImgSource,
              style: {
                height: 75,
                aspectRatio: 1,
                position: "absolute",
                top: "50%",
                left: "50%",
                marginLeft: -50,
                marginTop: -50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              },
            }),
          ],
          style: {
            position: "absolute",
            left: this.itemImgPosX.interpolate([0, 1], ["0%", "100%"]),
            top: this.itemImgPosY.interpolate([0, 1], ["0%", "100%"]),
            display: this.itemImgDisplay,
          },
        }),
      ],
      style: {
        width: "100%",
        height: "100%",
        position: "absolute",
      },
    });
  }

  // inside class UI_OneHUD
  private toNodes(nodeOrNodes: UINode | UINode[] | undefined): UINode[] {
    if (!nodeOrNodes) return [];
    return Array.isArray(nodeOrNodes) ? nodeOrNodes : [nodeOrNodes];
  }

  progTaskIsHidden = true;
  //region preStart()
  preStart(): void {
    if (!this.props.enabled) return;

    // this.setupCurrencyContainer();

    this.inventoryMgr = getMgrClass<InventoryManager>(
      this,
      ManagerType.InventoryManager,
      InventoryManager
    );

    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      console.log(
        `Simple button called on ${this.entity.name.get()} pressed by ${data.player.name.get()}`
      );
      // if (this.progTaskIsHidden) {
      //   this.showProgTask([data.player], "Task In Progress", "Tap rapidly", "", "");
      //   this.progTaskIsHidden = false;
      // } else {
      //   this.hideProgTask([data.player]);
      //   this.progTaskIsHidden = true;
      // }
    });

    // progress subscriptions
    this.connectNetworkEvent(this.entity, oneHudEvents.SetProgressEvent, (data) => {
      this.setProgress(data.player, data.amount);
    });
    // level subscriptions
    this.connectNetworkEvent(this.entity, oneHudEvents.SetPlayerLevelEvent, (data) => {
      this.setLvlUp(data.player, data.level);
    });
    // health subscriptions
    this.connectNetworkEvent(this.entity, oneHudEvents.SetHealthEvent, (data) => {
      this.setHealth(data.player, data.amount);
    });

    // score subscriptions
    this.connectNetworkEvent(this.entity, oneHudEvents.SetScoreEvent, (data) => {
      this.setNumUpValue(data.player, "score", data.amount);
    });

    // notification subscriptions
    this.connectNetworkEvent(this.entity, oneHudEvents.NotificationEvent, (data) => {
      this.showNotification(data.message, data.players, data.imageAssetId, data.bkgColor);
    });

    // popup subscriptions
    this.connectNetworkEvent(this.entity, oneHudEvents.PopupRequest, (data) => {
      this.popupRequestResponseMap.set(data.player, data.requester);
      this.showPopup(data.player, data.title, data.message, data.imageAssetId);
    });

    // confirmation subscriptions
    this.connectNetworkEvent(this.entity, oneHudEvents.ConfirmationPanelRequest, (data) => {
      this.showConfirmationPanel(data.requester, data.player, data.confirmationMessage);
    });

    // prog task subscriptions
    this.connectNetworkEvent(this.entity, oneHudEvents.ShowProgressionTask, (data) => {
      this.showProgTask(
        data.players,
        data.header,
        data.instruction,
        data.resultImgAssetId,
        data.instructImgAssetId,
        data.showProgressBar
      );
    });
    this.connectNetworkEvent(this.entity, oneHudEvents.HideProgressionTask, (data) => {
      this.hideProgTask(data.players);
    });
    this.connectNetworkEvent(this.entity, oneHudEvents.UpdateProgressionTask, (data) => {
      this.updateProgTask(data.players, data.progressAsString);
    });
    //region update inventory UI
    this.connectNetworkEvent(this.entity, oneHudEvents.UpdateInventoryUI, (data) => {
      this.updateInventoryUI(data.player, data.inventoryType, data.newValue);
    });

    this.connectNetworkEvent(this.entity, OnImageSetResponse, (data) => {
      this.imageSetMap.set(data.imageSetType, {
        imageSetType: data.imageSetType,
        primaryTextArray: data.primaryTextArray,
        secondaryTextArray: data.secondaryTextArray,
        usePrimaryImage: data.usePrimaryImage,
        primaryImageAssetIDArray: data.primaryImageAssetIDArray,
        secondaryImageAssetIDArray: data.secondaryImageAssetIDArray,
      });

      if (data.imageSetType === "DailyRewards") {
        this.setupDailyRewardContainer([], this.imageSetMap.get("DailyRewards")!);
      } else if (data.imageSetType === "FoodMenu") {
        this.setupFoodMenuContainer([], this.imageSetMap.get("FoodMenu")!);
      } else if (data.imageSetType === "InventoryMenu") {
        // this.setupInventoryMenuContainer_deprecated([], this.imageSetMap.get("InventoryMenu")!);
        // this.setupInventoryMenuContainer([]);
      }
    });

    this.connectNetworkEvent(this.entity, oneHudEvents.UpdateDailyRewardStreak, (data) => {
      this.updateDailyRewardVisuals([data.player], data.newStreak);
    });

    //region CONTEXT MENU
    this.connectNetworkBroadcastEvent(sysEvents.updateMenuContext, (data) => {
      const { player, menuContext } = data;
      console.log(`Incoming menu context ${menuContext} for ${player.name.get()}`);
      const newContextMenuLength = menuContext.length;
      const isPrimaryMenu = newContextMenuLength == 1;
      const isSubMenu = newContextMenuLength == 2;
      const isDetailMenu = newContextMenuLength == 3;
      let inventoryMenuType: inventoryWindowType = inventoryWindowType.Undefined;

      const playerInventory = this.inventoryMgr?.getPlayerInventory(player);

      if (menuContext.length === 0) {
        this.bnd_progTaskDisplay.set("none", [player]);
      }

      if (isSubMenu && menuContext[1] === Sub_PlotType.FoodMenu) {
        // this.setupFoodMenuContainer([player], this.imageSetMap.get("FoodMenu")!);
        this.createFoodMenuUINodeArray([player]);
        this.bnd_foodMenuDisplay.set("flex", [player]);
      } else {
        this.bnd_foodMenuDisplay.set("none", [player]);
      }

      if (menuContext[1] === Sub_MerchantType.Buy) {
      }

      if (
        //INVENTORY MENU
        menuContext[0] === Primary_MenuType.InventoryMenu ||
        menuContext[1] === Sub_MerchantType.Sell ||
        menuContext[1] === Sub_MerchantType.Buy
      ) {
        //make sure player has an inventory
        if (!playerInventory) {
          console.error(`No inventory found for player ${player.name.get()}`);
          return;
        }

        if (menuContext[0] === Primary_MenuType.InventoryMenu) {
          inventoryMenuType = inventoryWindowType.Personal;
          this.bnd_inventoryHeaderText.set("Inventory", [player]);
        } else if (menuContext[1] === Sub_MerchantType.Sell) {
          inventoryMenuType = inventoryWindowType.Sell;
          this.bnd_inventoryHeaderText.set("Sell Inventory", [player]);
        } else {
          inventoryMenuType = inventoryWindowType.Buy;
          this.bnd_inventoryHeaderText.set("Buy Recipes", [player]);
        }

        if (
          inventoryMenuType === inventoryWindowType.Personal ||
          inventoryMenuType === inventoryWindowType.Sell
        ) {
          const recipients = player ? [player] : undefined;
          const newUIInventoryNodeArray = this.createInventoryMenuUINodeArray(player);
          this.inventory_childrenUINodeArray.set(newUIInventoryNodeArray, recipients);

          let playerItemCount = 0;
          foodTypes.forEach((fruit) => {
            playerItemCount = playerInventory.items[fruit.name] ?? 0;

            let bnd_itemCount = this.inventoryCountBindings.get(fruit.name);
            if (!bnd_itemCount) {
              bnd_itemCount = new Binding<string>("0");
              this.inventoryCountBindings.set(fruit.name, bnd_itemCount);
            }
            bnd_itemCount.set(playerItemCount.toString(), [player]);
          });
          pieTypes.forEach((pie) => {
            playerItemCount = playerInventory.items[pie.name] ?? 0;

            let bnd_itemCount = this.inventoryCountBindings.get(pie.name);
            if (!bnd_itemCount) {
              bnd_itemCount = new Binding<string>("0");
              this.inventoryCountBindings.set(pie.name, bnd_itemCount);
            }
            bnd_itemCount.set(playerItemCount.toString(), [player]);
          });
        } else {
          const recipients = player ? [player] : undefined;
          const newUIInventoryNodeArray = this.createBuyMenuUINodeArray([player]);
          this.inventory_childrenUINodeArray.set(newUIInventoryNodeArray, recipients);

          let playerItemCount = 0;
          pieTypes.forEach((pie) => {
            playerItemCount = playerInventory.items[pie.recipeType!] ?? 0;

            let bnd_itemCount = this.inventoryCountBindings.get(pie.recipeType!);
            if (!bnd_itemCount) {
              bnd_itemCount = new Binding<string>("0");
              this.inventoryCountBindings.set(pie.recipeType!, bnd_itemCount);
            }
            bnd_itemCount.set(playerItemCount.toString(), [player]);
          });
          // this.populateBuyMenuContainer([player]);
        }
        this.bnd_inventoryDisplay.set("flex", [player]);
      } else {
        this.bnd_inventoryDisplay.set("none", [player]);
      }

      //INVENTORY DETAIL MENU
      if (
        menuContext[0] === Primary_MenuType.InventoryMenu &&
        menuContext[1] === Sub_InventoryType.Fruit && //FUTURE NOTE: May need to expand beyond just fruit
        isDetailMenu
      ) {
        let itemId = menuContext[2]; //ex: "apple" or "applePie"
        console.log(`Inventory Menu Type is ${inventoryMenuType}`);
        this.bnd_inventoryItemInstanceId.set(itemId, [player]);

        this.bnd_inventoryDetailText.set("More item detail goes here", [player]);
        const fruitItem = foodTypes.find((fruit) => fruit.name === itemId);
        const pieItem = pieTypes.find((pie) => pie.name === itemId);
        const isFruit = fruitItem !== undefined;

        const itemAssetId = fruitItem?.imageAssetID ?? pieItem?.imageAssetID;
        if (!itemAssetId) {
          console.error(`No image asset id found for item ID ${itemId}`);
        }
        const itemImgSource =
          convertAssetIDToImageSource(itemAssetId!) ??
          convertAssetIDToImageSource(DefaultBlankImgAssetID);
        this.bnd_inventoryItemImg.set(itemImgSource, [player]);

        //FUTURE NOTE: Needs to pull detail info from sysTypes later
        // const fruitToSell = menuContext[2];
        // let price = 0;
        if (isFruit) {
          this.bnd_inventoryItemName.set(fruitItem!.itemName, [player]);
        } else {
          this.bnd_inventoryItemName.set(pieItem!.itemName, [player]);
        }
        // this.bnd_merchantItemPrice.set(price.toString(), [player]);

        this.bnd_inventoryDetailDisplay.set("flex", [player]);
      } else {
        this.bnd_inventoryDetailDisplay.set("none", [player]);
      }

      //region merchant detail
      if (menuContext[0] === Primary_MenuType.MerchantMenu && isDetailMenu) {
        let itemId = menuContext[2]; //ex: "apple" or "applePie"
        console.log(`Inventory Menu Type is ${inventoryMenuType}`);
        //SELL DETAIL MENU
        if (inventoryMenuType === inventoryWindowType.Sell) {
          //populate merchant detail window info here
          console.log(`Updating merchant detail window for item ID ${itemId}`);
          this.bnd_merchantItemInstanceId.set(itemId, [player]);
          this.bnd_merchantBtnText.set("Sell", [player]);
          const fruitItem = foodTypes.find((fruit) => fruit.name === itemId);
          const pieItem = pieTypes.find((pie) => pie.name === itemId);
          const isFruit = fruitItem !== undefined;

          if (isFruit) {
            this.bnd_merchantItemName.set(fruitItem!.itemName, [player]);
          } else {
            this.bnd_merchantItemName.set(pieItem!.itemName, [player]);
          }

          const itemAssetId = fruitItem?.imageAssetID ?? pieItem?.imageAssetID;
          if (!itemAssetId) {
            console.error(`No image asset id found for item ID ${itemId}`);
          }
          const itemImgSource =
            convertAssetIDToImageSource(itemAssetId!) ??
            convertAssetIDToImageSource(DefaultBlankImgAssetID);

          this.bnd_merchantItemImg.set(itemImgSource, [player]);
          //update to price from inventory mgr later
          const fruitToSell = menuContext[2];
          let price = 0;
          if (isFruit) {
            foodTypes.forEach((fruit) => {
              if (fruit.name === fruitToSell) {
                //find fruit in database
                price = fruit.sellPrice;
              }
            });
          } else {
            pieTypes.forEach((pie) => {
              if (pie.name === fruitToSell) {
                //find pie in database
                price = pie.sellPrice;
              }
            });
          }
          this.bnd_merchantItemPrice.set(price.toString(), [player]);
        } else if (inventoryMenuType === inventoryWindowType.Buy) {
          //populate merchant detail window info here
          itemId = itemId + "Recipe";
          console.log(`Updating merchant detail window for item ID ${itemId}`);
          this.bnd_merchantItemInstanceId.set(itemId, [player]);
          this.bnd_merchantBtnText.set("Buy", [player]);
          // const fruitItem = fruitTypes.find((fruit) => fruit.name === itemId);
          const pieItem = pieTypes.find((pie) => pie.recipeType === itemId);
          // const isFruit = fruitItem !== undefined;

          this.bnd_merchantItemName.set(pieItem!.recipeName, [player]);

          const itemAssetId = pieItem?.recipeImgAssetId;
          if (!itemAssetId) {
            console.error(`No image asset id found for item ID ${itemId}`);
          }
          const itemImgSource =
            convertAssetIDToImageSource(itemAssetId!) ??
            convertAssetIDToImageSource(DefaultBlankImgAssetID);

          this.bnd_merchantItemImg.set(itemImgSource, [player]);
          //update to price from inventory mgr later
          const fruitToSell = menuContext[2];
          let price = 0;

          pieTypes.forEach((pie) => {
            if (pie.name === fruitToSell) {
              //find pie in database
              price = pie.recipeBuyPrice;
            }
          });

          this.bnd_merchantItemPrice.set(price.toString(), [player]);
        }

        this.bnd_merchantDetailDisplay.set("flex", [player]);
      } else {
        this.bnd_merchantDetailDisplay.set("none", [player]);
      }

      this.playerMenuContextMap.set(player, menuContext);
    });

    this.connectNetworkEvent(this.entity, sysEvents.showDailyRewardUI, (data) => {
      const { player, show, giftBox } = data;
      this.bnd_dailyRewardDisplay.set(show ? "flex" : "none", [player]);
      this.playerGiftBoxMap.set(player, giftBox);
      const dailyRewardMgr = getMgrClass<DailyRewardManager>(
        this,
        ManagerType.DailyRewardManager,
        DailyRewardManager
      );
      const dailyStreak = dailyRewardMgr?.getDailyRewardInfo(player)?.dailyStreak ?? 0;
      this.updateDailyRewardVisuals([player], dailyStreak);
    });
  }

  private triggerAnimation(player: Player, imageAssetId: string, inventoryType?: string) {
    let screenX = 0.08;
    let screenY = 0.28;
    if (inventoryType && inventoryType === InventoryType.currency) {
      screenX = 0.1;
      screenY = 0.88;
    }

    const imgSource = convertAssetIDToImageSource(imageAssetId);
    this.itemImgSource.set(imgSource, [player]);
    this.itemImgDisplay.set("flex", [player]);

    // Define the animation sequence.
    this.itemImgPosX.set(0.5, undefined, [player]);
    this.itemImgPosY.set(0.5, undefined, [player]);

    const animationX = Animation.timing(screenX, { duration: 500, easing: Easing.ease }); // Move to 90% right
    const animationY = Animation.timing(screenY, { duration: 500, easing: Easing.ease }); // Move to 10% top

    // Set the new values for the animated bindings to start the animation.
    this.itemImgPosX.set(animationX, undefined, [player]);
    this.itemImgPosY.set(
      animationY,
      () => {
        this.itemImgDisplay.set("none", [player]);
      },
      [player]
    );
  }

  updateDailyRewardVisuals(players: Player[], curDaysClaimed: number): void {
    if (this.imageSetMap.has("DailyRewards")) {
      let imageSet_wStreak = this.imageSetMap.get("DailyRewards")!;
      //which images show vs which show locked
      for (let i = 0; i < imageSet_wStreak.usePrimaryImage.length; i++) {
        imageSet_wStreak.usePrimaryImage[i] = i <= curDaysClaimed;
      }
      this.playerDailyStreakMap.set(players[0], curDaysClaimed);
      this.setupDailyRewardContainer(players, imageSet_wStreak);
    }
  }

  updatedFoodMenuVisuals(players: Player[]): void {
    if (this.imageSetMap.has("FoodMenu")) {
      //migrate this to new function
      // let imageSet_foodMenu = this.imageSetMap.get("FoodMenu")!;
      // for (let i = 0; i < imageSet_foodMenu.usePrimaryImage.length; i++) {
      //   imageSet_foodMenu.usePrimaryImage[i] = i <= curDaysClaimed;
      // }
      // this.setupFoodMenuContainer(players, imageSet_foodMenu);
    }
  }

  //region start()
  start() {
    if (!this.props.enabled) return;

    this.notifyEasing = Easing.inOut(Easing.cubic);

    //prevents odd oversizing at start
    this.animBnd_currencyScale.set(1);
    this.animBnd_diamondScale.set(1);

    if (this.props.hidePopupOnStart) {
      this.bnd_popupDisplay.set("none");
    }

    if (this.props.hideNotificationOnStart) {
      this.bnd_notifyDisplay.set("none");
    } else {
      this.bnd_notifyDisplay.set("flex");
      this.displayNotification();
    }

    if (this.props.hideConfirmationOnStart) {
      this.bnd_confirmDisplay.set("none");
    } else {
      this.bnd_confirmDisplay.set("flex");
    }

    // this.setupInventoryMenuContainer([]);
  }

  setupDailyRewardContainer(players: Player[], imageSet: ImageSetProps): void {
    if (!this.imageSetMap.has("DailyRewards")) {
      console.warn("No daily reward child nodes to setup.");
      return;
    }
    const recipients = players.length > 0 ? players : undefined;

    const newUINodeArray = this.convertImageSetToUINodeArray(players[0], imageSet!);
    this.dailyReward_childrenUINodeArray.set(newUINodeArray, recipients);
    // Assuming you want to do something with newUINodeArray here
  }

  setupFoodMenuContainer(players: Player[], imageSet: ImageSetProps): void {
    if (!this.imageSetMap.has("FoodMenu")) {
      console.warn("No food menu child nodes to setup.");
      return;
    }

    const recipients = players.length > 0 ? players : undefined;
    const imageSetType = "FoodMenu";
    const newUINodeArray = this.convertImageSetToUINodeArray(
      players[0],
      this.imageSetMap.get(imageSetType)!
    );
    this.foodMenu_childrenUINodeArray.set(newUINodeArray, recipients);
    // Assuming you want to do something with newUINodeArray here
  }

  setupInventoryMenuContainer(players: Player[]): void {}

  // populateBuyMenuContainer(players: Player[]): void {
  //   const recipients = players.length > 0 ? players : undefined;
  //   const newUIInventoryNodeArray = this.createBuyMenuUINodeArray();
  //   this.inventory_childrenUINodeArray.set(newUIInventoryNodeArray, recipients);
  // }

  //region onButtonPressed()
  onButtonPressed(instanceId: string, player: Player) {
    let curInstanceId = instanceId;
    const curMenuContext = this.playerMenuContextMap.get(player) || [];
    let updatedMenuContext: string[] = [];
    let sendContextMenuUpdate = false;
    let inventoryMenuType: inventoryWindowType = inventoryWindowType.Undefined;
    if (
      //INVENTORY MENU
      curMenuContext[0] === Primary_MenuType.InventoryMenu ||
      curMenuContext[1] === Sub_MerchantType.Sell ||
      curMenuContext[1] === Sub_MerchantType.Buy
    ) {
      if (curMenuContext[1] === Sub_MerchantType.Buy) {
        inventoryMenuType = inventoryWindowType.Buy;
      } else if (curMenuContext[1] === Sub_MerchantType.Sell) {
        inventoryMenuType = inventoryWindowType.Sell;
      } else {
        inventoryMenuType = inventoryWindowType.Personal;
      }
    }

    //inventory/ merchant vars
    let isSellMenu = false;
    let primaryMenu = "";
    let subMenu = "";

    let inventoryItemName = "";

    // Handle inventory item button presses
    if (instanceId.startsWith("InventoryType_")) {
      const itemStr = instanceId.split("_")[1];
      console.log(`Parsed inventory item name: ${itemStr}`);
      inventoryItemName = itemStr;
      curInstanceId = "InventoryType_";
    }

    if (instanceId.startsWith("RecipeType_")) {
      const itemStr = instanceId.split("_")[1];
      console.log(`Parsed recipe item name: ${itemStr}`);
      inventoryItemName = itemStr;
      curInstanceId = "RecipeType_";
    }

    switch (curInstanceId) {
      case "currencyBtn":
        console.log("Currency Button Pressed");
        break;
      case "diamondBtn":
        console.log("Diamond Button Pressed");
        break;
      case "inventoryBtn":
        console.log("Inventory Button Pressed");
        if (curMenuContext[0] === Primary_MenuType.InventoryMenu) {
          updatedMenuContext = this.prevPlayerMenuContextMap.get(player) || [];
        } else {
          this.prevPlayerMenuContextMap.set(player, curMenuContext);
          updatedMenuContext = [Primary_MenuType.InventoryMenu];
        }
        this.playerMenuContextMap.set(player, updatedMenuContext);

        sendContextMenuUpdate = true;
        break;
      case "claimDailyRewards":
        console.log(`Daily Reward Claim Button Pressed by ${player.name.get()}`);
        if (this.playerGiftBoxMap.has(player)) {
          const giftBoxEntity = this.playerGiftBoxMap.get(player)!;
          this.sendNetworkEvent(giftBoxEntity, sysEvents.openDailyRewardGiftBox, {
            player: player,
          });

          const dailyRewardMgr = getMgrClass<DailyRewardManager>(
            this,
            ManagerType.DailyRewardManager,
            DailyRewardManager
          );
          dailyRewardMgr?.tryClaimDailyReward(player, Date.now());

          const dailyStreak = this.playerDailyStreakMap.get(player) || 0; //this is placeholder
          const rewardAmount = 10 + dailyStreak * 5; //example: base 10 currency + 5 per streak day

          this.async.setTimeout(() => {
            this.triggerAnimation(
              player,
              this.props.currencyImgAsset!.id?.toString(),
              InventoryType.currency
            );
            // this.triggerAnimation(player, "1973296496791704");
          }, 1700);

          this.async.setTimeout(() => {
            // Implement award logic here, e.g., give points, items, etc.
            const inventoryManager = getEntityListByTag(
              ManagerType.InventoryManager,
              this.world
            )[0];
            this.sendNetworkEvent(inventoryManager!, sysEvents.UpdatePlayerInventory, {
              player: player,
              item: InventoryType.currency,
              quantity: rewardAmount,
              sender: this.entity,
            });
          }, 2300);

          this.async.setTimeout(() => {
            this.bnd_dailyRewardDisplay.set("none", [player]);
          }, 200);
        }
        break;
      case "exitDailyRewards":
        console.log(`Daily Reward Exit Button Pressed by ${player.name.get()}`);
        this.async.setTimeout(() => {
          this.bnd_dailyRewardDisplay.set("none", [player]);
        }, 200);
        break;
      case "exitFoodMenu":
        console.log(`Food Menu Exit Button Pressed by ${player.name.get()}`);
        this.bnd_foodMenuDisplay.set("none", [player]);
        break;
      case "exitInventory":
        console.log(`Inventory Menu Exit Button Pressed by ${player.name.get()}`);
        isSellMenu = curMenuContext[1] === Sub_MerchantType.Sell;
        if (isSellMenu) {
          primaryMenu = Primary_MenuType.MerchantMenu;
          updatedMenuContext = [primaryMenu];
        } else {
          //
          updatedMenuContext = this.prevPlayerMenuContextMap.get(player) || [];
        }

        sendContextMenuUpdate = true;
        break;
      case "InventoryType_":
        // if(curMenuContext[1] ===)
        console.log(
          `Inventory Item Button Pressed by ${player.name.get()} for item name ${inventoryItemName}`
        );

        //do we react like an inventory menu or a sell menu
        isSellMenu = curMenuContext[1] === Sub_MerchantType.Sell;
        primaryMenu = isSellMenu ? Primary_MenuType.MerchantMenu : Primary_MenuType.InventoryMenu;
        subMenu = isSellMenu ? Sub_MerchantType.Sell : Sub_InventoryType.Fruit;
        // Handle inventory item button press logic here

        updatedMenuContext = [primaryMenu, subMenu, inventoryItemName]; // Example of navigating to a detail view

        sendContextMenuUpdate = true;
        break;
      case "RecipeType_":
        console.log(
          `Recipe Item Button Pressed by ${player.name.get()} for item name ${inventoryItemName}`
        );

        updatedMenuContext = [
          Primary_MenuType.MerchantMenu,
          Sub_MerchantType.Buy,
          inventoryItemName,
        ]; // Example of navigating to a detail view
        sendContextMenuUpdate = true;
        break;
      case "merchantEvent": //will need to know if we are buying or selling
        const playerInventory = this.inventoryMgr?.getPlayerInventory(player);
        let itemId = curMenuContext[2];
        let price = 0;

        if (inventoryMenuType === inventoryWindowType.Buy) {
          console.log(`Merchant Buy Button Pressed for ${curMenuContext[2]}`);
          const recipeName = itemId + "Recipe";

          const pie = pieTypes.find((pie) => pie.name === itemId);
          if (!pie) {
            console.error(`No pie found for item ID ${itemId}`);
            return;
          } else {
            console.log(`Found pie ${pie.name} for item ID ${itemId}`);
          }

          price = pie.recipeBuyPrice;
          if (playerInventory!.items[pie.recipeType!] < 1) {
            //determine if player has item to sell
            this.inventoryMgr!.updatePlayerInventory(player, InventoryType[pie.recipeType!], 1);
            this.inventoryMgr!.updatePlayerInventory(player, InventoryType.currency, -price);
            console.log(`Purchased recipe for ${price}`);
          } else {
            this.showNotification("You already know this recipe!", [player], null);
          }

          const newPlayerInventory = this.inventoryMgr?.getPlayerInventory(player);
          if (!newPlayerInventory) {
            console.error(`No inventory found for player ${player.name.get()}`);
            return;
          }

          const recipients = player ? [player] : undefined;
          const newUIInventoryNodeArray = this.createBuyMenuUINodeArray([player]);
          this.inventory_childrenUINodeArray.set(newUIInventoryNodeArray, recipients);

          let playerItemCount = 0;
          pieTypes.forEach((pie) => {
            console.log(`Updating inventory count for ${pie.recipeType}`);
            playerItemCount = newPlayerInventory!.items[pie.recipeType!] ?? 0;

            let bnd_itemCount = this.inventoryCountBindings.get(pie.recipeType!);
            console.log(`Player has ${playerItemCount} of ${pie.recipeType}`);
            if (!bnd_itemCount) {
              bnd_itemCount = new Binding<string>("0");
              console.log(`Creating new binding for ${pie.recipeType}`);
              this.inventoryCountBindings.set(pie.recipeType!, bnd_itemCount);
            }
            bnd_itemCount.set(playerItemCount.toString(), [player]);
          });

          //END OF BUY LOGIC
        } else if (inventoryMenuType === inventoryWindowType.Sell) {
          console.log(`Merchant Sell Button Pressed for ${curMenuContext[2]}`);
          const fruitItem = foodTypes.find((fruit) => fruit.name === itemId);
          const pieItem = pieTypes.find((pie) => pie.name === itemId);
          const isFruit = fruitItem !== undefined;
          const itemType = fruitItem ?? pieItem;

          if (isFruit) {
            foodTypes.forEach((fruit) => {
              if (fruit.name === itemType?.name) {
                //find fruit in database
                price = fruit.sellPrice;
                if (playerInventory!.items[fruit.name] > 0) {
                  //determine if player has item to sell
                  this.inventoryMgr!.updatePlayerInventory(player, InventoryType[fruit.name], -1);
                  this.inventoryMgr!.updatePlayerInventory(player, InventoryType.currency, price);
                } else {
                  this.showNotification("You do not have any to sell!", [player], null);
                }
              }
            });
          } else if (!isFruit) {
            pieTypes.forEach((pie) => {
              if (pie.name === itemType?.name) {
                //find pie in database
                price = pie.sellPrice;
                if (playerInventory!.items[pie.name] > 0) {
                  //determine if player has item to sell
                  this.inventoryMgr!.updatePlayerInventory(player, InventoryType[pie.name], -1);
                  this.inventoryMgr!.updatePlayerInventory(player, InventoryType.currency, price);
                } else {
                  this.showNotification("You do not have any to sell!", [player], null);
                }
              }
            });
          }

          const itemAssetId = itemType?.imageAssetID;
          if (!itemAssetId) {
            console.error(`No image asset id found for item ID ${itemId}`);
          }

          const newPlayerInventory = this.inventoryMgr?.getPlayerInventory(player);
          if (!newPlayerInventory) {
            console.error(`No inventory found for player ${player.name.get()}`);
            return;
          }

          let playerItemCount = 0;
          foodTypes.forEach((fruit) => {
            playerItemCount = newPlayerInventory!.items[fruit.name] ?? 0;

            let bnd_itemCount = this.inventoryCountBindings.get(fruit.name);
            if (!bnd_itemCount) {
              bnd_itemCount = new Binding<string>("0");
              this.inventoryCountBindings.set(fruit.name, bnd_itemCount);
            }
            bnd_itemCount.set(playerItemCount.toString(), [player]);
          });
          pieTypes.forEach((pie) => {
            playerItemCount = newPlayerInventory!.items[pie.name] ?? 0;

            let bnd_itemCount = this.inventoryCountBindings.get(pie.name);
            if (!bnd_itemCount) {
              bnd_itemCount = new Binding<string>("0");
              this.inventoryCountBindings.set(pie.name, bnd_itemCount);
            }
            bnd_itemCount.set(playerItemCount.toString(), [player]);
          });

          console.warn(`Sold item for ${price}`);
        }
        // this.bnd_merchantItemName.set(itemId, [player]);

        //lower inventory count for the player
        //add currency to player

        break;
      default:
        console.warn(`Unhandled button press for instanceId: ${instanceId}`);
        console.warn(`Current menu context: ${curMenuContext}`);
        break;
    }

    if (sendContextMenuUpdate) {
      console.log(`Sending updated menu context ${updatedMenuContext} for ${player.name.get()}`);
      this.sendNetworkBroadcastEvent(sysEvents.updateMenuContext, {
        player: player,
        menuContext: updatedMenuContext,
      });
    }
  }

  //region setProgress()
  // sets progress for the player
  public setProgress(player: Player, newValue: string) {
    // by adding [player] we ensure the UI updates for only the specific player
    this.bnd_progressBar.set(`${newValue}%`, [player]);
  }

  //region lvlUp()
  public setLvlUp(player: Player, newValue: string): void {
    this.animBnd_lvlScale.set(2, undefined, [player]);
    this.bnd_lvlNumber.set(newValue, [player]);
    this.animBnd_lvlScale.set(
      Animation.timing(1, {
        duration: 100,
        easing: Easing.inOut(Easing.elastic(1)),
      }),
      undefined,
      [player]
    );
  }

  //region numUp()
  public setNumUpValue(player: Player, type: string, newValue: string): void {
    let bindingValue: Binding<string> | undefined;
    let animBndScale: AnimatedBinding | undefined;
    switch (type) {
      case "score":
        bindingValue = this.bnd_score;
        animBndScale = this.animBnd_scoreScale;
        break;
      case "type1":
        break;
      default:
        console.warn(`Unknown type: ${type}`);
        return; // Exit the function if the type is unknown
    }

    if (bindingValue && animBndScale) {
      bindingValue.set(newValue, [player]);

      animBndScale.set(2, undefined, [player]);
      animBndScale.set(
        Animation.timing(1, {
          duration: 100,
          easing: Easing.inOut(Easing.elastic(1)),
        }),
        undefined,
        [player]
      );
    }
  }

  //region setHealth()
  // sets health for the player
  public setHealth(player: Player, newValue: string) {
    // by adding [player] we ensure the UI updates for only the specific player
    this.bnd_healthBar.set(`${newValue}%`, [player]);
  }

  //region showPopup()
  public showPopup(
    player: Player,
    title: string,
    message: string,
    imageAssetId: string | undefined
  ): void {
    this.bnd_popupTitle.set(title, [player]);
    this.bnd_popupContent.set(message, [player]);
    this.bnd_popupDisplay.set("flex", [player]);
    if (imageAssetId) {
      const imgSrc = convertAssetIDToImageSource(imageAssetId);
      this.bnd_popupWatermark.set(imgSrc, [player]);
    }
    const startVal = -900;
    this.animBnd_popupPosY.set(startVal);
    const defaultSequence = Animation.sequence(
      Animation.timing(0, {
        duration: 1000,
        easing: Easing.elastic(1.0),
      })
    );

    this.animBnd_popupPosY.set(defaultSequence, undefined, [player]);
  }

  //region hidePopup()
  private hidePopup(player: Player): void {
    const defaultSequence = Animation.sequence(
      Animation.timing(-900, {
        duration: 700,
        easing: Easing.sin,
      })
    );

    this.animBnd_popupPosY.set(
      defaultSequence,
      () => {
        this.bnd_popupDisplay.set("none", [player]);
      },
      [player]
    );
    const requester = this.popupRequestResponseMap.get(player);
    if (requester) {
      console.log(`Sending popup response to ${requester.name.get()}`);
      this.sendNetworkEvent(requester, oneHudEvents.PopupResponse, { player: player });
    }
  }

  private onPopupBtnPressed(player: Player): void {
    this.async.setTimeout(() => {
      this.bnd_popupBtnScale.set(1, [player]);
      this.hidePopup(player);
    }, 100);
  }

  //region showNotification()
  //Populate notification with required message and optional player & imageAssetId
  public showNotification(
    message: string,
    players: Player[],
    imageAssetId: string | null,
    bkgColor?: string
  ) {
    const asset = imageAssetId ? new Asset(BigInt(imageAssetId)) : this.props.notificationImg!;
    const imgSrc = ImageSource.fromTextureAsset(asset);
    let recipients = players.length > 0 ? players : undefined;
    this.bndAlertImg.set(imgSrc, recipients);

    this.bndAlertMsg.set(message, recipients);
    if (bkgColor) {
      this.bnd_notifyBkgColor.set(bkgColor, recipients);
    }

    this.displayNotification(recipients);
  }

  //region showNotification()
  //use showNotification.  displayNotification is more utility function
  private displayNotification(recipients: Player[] | null = null) {
    console.log("Showing notification");
    this.bnd_notifyDisplay.set("flex", recipients ?? undefined);
    //set the UI all the way to the right
    this.animBnd_translateX.set(1000);
    const defaultSequence = Animation.sequence(
      //Move the UI to the center(0px) over 800ms
      Animation.timing(0, {
        duration: 800,
        easing: this.notifyEasing,
      }),
      //wait for 1500ms
      Animation.delay(
        //Notice delay wraps the next animation
        2000,
        //then move the UI all the way to the left(-1000px) over 1000ms
        Animation.timing(-1000, {
          duration: 800,
          easing: this.notifyEasing,
        })
      )
    );

    this.animBnd_translateX.set(
      //apply the animation sequence
      defaultSequence,
      //this could easily be an arrow function () => {console.log("Anim finished");},
      undefined,
      //if recipients array has players then only show to those players
      //if recipients array is null, set to undefined == show to all players
      //that's what the ?? is doing
      recipients ?? undefined
    );
  }

  //region confirm Request()
  public showConfirmationPanel(
    requester: Entity,
    player: Player,
    confirmationMessage: string
  ): void {
    //set up confirmation message
    console.log(`Confirmation request received`);
    this.bndHeaderText.set(confirmationMessage);
    // Show the confirmation panel for specific player
    this.bnd_confirmDisplay.set("flex", [player]);

    //store message and requester to player (multiplayer support)
    this.playerMessageMap.set(player, { entity: requester, message: confirmationMessage });
  }
  //region Confirm Response()
  private handleConfirmationResponse(accepted: boolean, player: Player): void {
    // Get the message associated with the player from stored map
    const message = this.playerMessageMap.get(player)?.message ?? { message: "" };
    const requester = this.playerMessageMap.get(player)?.entity ?? null;
    if (requester) {
      this.sendNetworkEvent(requester, oneHudEvents.ConfirmationPanelResponse, {
        player: player,
        message: message,
        accepted,
      });
    }
    // Hide the confirmation panel for specific player after 100ms
    this.async.setTimeout(() => {
      this.bnd_confirmDisplay.set("none", [player]);
    }, 100);
  }

  /**bnd_progTaskHeader = new Binding<string>("Progression Task");
  bnd_progTaskContent = new Binding<string>("Complete the task to earn rewards!");
  bnd_progTaskResultImg = new Binding<ImageSource>(convertAssetIDToImageSource(DefaultBlankImgAssetID));
  bnd_progTaskInstructImg = new Binding<ImageSource>(convertAssetIDToImageSource(DefaultBlankImgAssetID));
  bnd_progTaskProgressAsString = new Binding<string>("0");
  animBnd_ProgTaskTranslateY = new AnimatedBinding(0);
  */

  //region prog task Request()
  public showProgTask(
    players: Player[],
    header: string,
    instruction: string,
    imgResultId: string | undefined,
    imgInstructId: string | undefined,
    showProgressBar: boolean = true
  ): void {
    const resultImgAsset =
      imgResultId && imgResultId !== ""
        ? new Asset(BigInt(imgResultId))
        : this.props.notificationImg!;
    const resultImgSrc = ImageSource.fromTextureAsset(resultImgAsset);
    const instructImgAsset =
      imgInstructId && imgInstructId !== ""
        ? new Asset(BigInt(imgInstructId))
        : this.props.notificationImg!;
    const instructImgSrc = ImageSource.fromTextureAsset(instructImgAsset);

    //populate or leave undefined to appeal to bind.set second param
    let recipients = players.length > 0 ? players : undefined;
    this.bnd_progTaskResultImg.set(resultImgSrc, recipients);
    this.bnd_progTaskInstructImg.set(instructImgSrc, recipients);

    this.bnd_progTaskHeader.set(header, recipients);
    this.bnd_progTaskContent.set(instruction, recipients);

    this.bnd_progTaskProgressAsString.set("0", recipients);
    this.animBnd_ProgTaskTranslateY.set(200);

    this.bnd_showTaskProgressBar.set(showProgressBar ? "flex" : "none", recipients);
    this.bnd_progTaskDisplay.set("flex", recipients);

    //then move the UI all the way to the left(-1000px) over 1000ms
    this.animBnd_ProgTaskTranslateY.set(
      Animation.timing(0, {
        duration: 200,
        easing: this.notifyEasing,
      }),
      undefined,
      recipients ?? undefined
    );
  }

  public hideProgTask(players: Player[]): void {
    let recipients = players.length > 0 ? players : undefined;
    this.animBnd_ProgTaskTranslateY.set(0);

    //then move the UI all the way to the left(-1000px) over 1000ms
    this.animBnd_ProgTaskTranslateY.set(
      Animation.timing(200, {
        duration: 200,
        easing: this.notifyEasing,
      }),
      () => this.bnd_progTaskDisplay.set("none", recipients),
      recipients ?? undefined
    );
  }

  public updateProgTask(players: Player[], progressAsString: string): void {
    if (progressAsString.endsWith("%")) {
      progressAsString = progressAsString.slice(0, -1);
    }
    let recipients = players.length > 0 ? players : undefined;
    this.bnd_progTaskProgressAsString.set(progressAsString, recipients);
  }

  //region animate scale

  public animateNewValue(player: Player, type: string, newValue: string): void {
    let bindingValue: Binding<string> | undefined;
    let animBndScale: AnimatedBinding | undefined;
    switch (type) {
      case "currency":
        bindingValue = this.bnd_currencyCount;
        animBndScale = this.animBnd_currencyScale;
        break;
      case "diamond":
        bindingValue = this.bnd_diamondCount;
        animBndScale = this.animBnd_diamondScale;
        break;
      default:
        console.warn(`Unknown type: ${type}`);
        return; // Exit the function if the type is unknown
    }

    if (bindingValue && animBndScale) {
      bindingValue.set(newValue, [player]);

      animBndScale.set(2, undefined, [player]);
      animBndScale.set(
        Animation.timing(1, {
          duration: 100,
          easing: Easing.inOut(Easing.elastic(1)),
        }),
        undefined,
        [player]
      );
    }
  }

  //region updateInventoryUI()
  updateInventoryUI(player: Player, inventoryType: string, newValue: string) {
    let bindingValue: Binding<string> | undefined;
    let animBndScale: AnimatedBinding | undefined;
    switch (inventoryType) {
      case InventoryType.currency:
        bindingValue = this.bnd_currencyCount;
        animBndScale = this.animBnd_currencyScale;
        break;
      case InventoryType.diamond:
        bindingValue = this.bnd_diamondCount;
        animBndScale = this.animBnd_diamondScale;
        break;
      default:
        // console.warn(`Unknown type: ${inventoryType}`);
        // return; // Exit the function if the type is unknown
        break;
    }

    if (inventoryType === InventoryType.currency || inventoryType === InventoryType.diamond) {
      if (bindingValue && animBndScale) {
        bindingValue.set(newValue, [player]);

        animBndScale.set(2, undefined, [player]);
        animBndScale.set(
          Animation.timing(1, {
            duration: 100,
            easing: Easing.inOut(Easing.elastic(1)),
          }),
          undefined,
          [player]
        );
      }
    }

    let imageAssetId = "";
    const matchingFood = foodTypes.find(
      (food) => food.name.toString() === inventoryType.toString()
    );
    if (matchingFood) {
      imageAssetId = matchingFood.imageAssetID.toString();
    }
    const matchingPie = pieTypes.find(
      (pie) =>
        pie.name.toString() === inventoryType.toString() ||
        pie.recipeType?.toString() === inventoryType.toString()
    );
    if (matchingPie) {
      imageAssetId = matchingPie.imageAssetID.toString();
    }
    const matchingRecipe = pieTypes.find(
      (pie) => pie.recipeType?.toString() === inventoryType.toString()
    );
    if (matchingRecipe) {
      imageAssetId = matchingRecipe.recipeImgAssetId.toString();
    }

    this.triggerAnimation(player, imageAssetId, inventoryType);
    // if (imageAssetId !== "") {
    // }
  }

  //region Asset[] to UINode[]
  private convertImageSetToUINodeArray(player: Player, imageSetProps: ImageSetProps): UINode[] {
    try {
      const newUIArray: UINode[] = [];
      const txtOffset = new Vec3(50, 0, 120); //(x%,y%, width%)

      imageSetProps.primaryTextArray.forEach((text, index) => {
        const imgIDToUse = imageSetProps.usePrimaryImage[index]
          ? imageSetProps.primaryImageAssetIDArray[index]
          : imageSetProps.secondaryImageAssetIDArray[index];

        newUIArray.push(
          ImgSetUIwStrings(
            convertAssetIDToImageSource(imgIDToUse),
            imageSetProps.primaryTextArray[index],
            imageSetProps.secondaryTextArray[index]
          )
        );
      });

      return newUIArray;
    } catch (error) {
      console.error(`Error fetching texture assets`, error);
      return []; // Skip this iteration if texture asset is not found
    }
  }

  private createFoodMenuUINodeArray(players: Player[]): UINode[] {
    const availableRecipes = this.getAvailableRecipes(players[0]);

    const newUIFoodMenuArray: UINode[] = [];
    const txtOffset = new Vec3(0, 0, 120); //(x%,y%, width%)

    pieTypes.forEach((pie) => {
      let bnd_itemCount = this.inventoryCountBindings.get(pie.recipeType!);
      if (!bnd_itemCount) {
        bnd_itemCount = new Binding<string>("0");
        this.inventoryCountBindings.set(pie.recipeType!, bnd_itemCount);
      }
      let isLocked = true;
      availableRecipes.forEach((recipe) => {
        if (recipe === pie.recipeType) {
          isLocked = false;
        }
      });
      newUIFoodMenuArray.push(
        inventorySlotButton(
          this,
          "RecipeType_" + pie.name,
          convertAssetIDToImageSource(pie.recipeImgAssetId),
          bnd_itemCount,
          txtOffset,
          isLocked,
          this.onButtonPressed.bind(this),
          RecipeBackgroundColor,
          70
        )
      );
    });

    return newUIFoodMenuArray;
  }

  private createBuyMenuUINodeArray(players: Player[]): UINode[] {
    const availableRecipes = this.getAvailableRecipes(players[0]);

    const newUIBuyMenuArray: UINode[] = [];
    const txtOffset = new Vec3(0, 0, 120); //(x%,y%, width%)

    pieTypes.forEach((pie) => {
      let bnd_itemCount = this.inventoryCountBindings.get(pie.recipeType!);
      if (!bnd_itemCount) {
        bnd_itemCount = new Binding<string>("0");
        this.inventoryCountBindings.set(pie.recipeType!, bnd_itemCount);
      }
      //which recipes are available
      let ifIsLocked = true;
      availableRecipes.forEach((recipe) => {
        if (recipe === pie.recipeType) {
          ifIsLocked = false;
        }
      });

      newUIBuyMenuArray.push(
        inventorySlotButton(
          this,
          "RecipeType_" + pie.name,
          convertAssetIDToImageSource(pie.recipeImgAssetId),
          bnd_itemCount,
          txtOffset,
          ifIsLocked,
          this.onButtonPressed.bind(this),
          RecipeBackgroundColor,
          70
        )
      );
    });

    return newUIBuyMenuArray;
  }

  //region Create Inventory
  private createInventoryMenuUINodeArray(player: Player): UINode[] {
    const playerInventory = this.inventoryMgr?.getPlayerInventory(player);
    const newUIInventoryArray: UINode[] = [];
    const txtOffset = new Vec3(0, 0, 120); //(x%,y%, width%)

    let ifIsEmpty = true;

    foodTypes.forEach((fruit) => {
      let bnd_itemCount = this.inventoryCountBindings.get(fruit.name);
      if (!bnd_itemCount) {
        bnd_itemCount = new Binding<string>("0");
        this.inventoryCountBindings.set(fruit.name, bnd_itemCount);
      }

      if (
        playerInventory &&
        playerInventory.items[fruit.name] &&
        playerInventory.items[fruit.name] > 0
      ) {
        ifIsEmpty = false;
      }

      newUIInventoryArray.push(
        inventorySlotButton(
          this,
          "InventoryType_" + fruit.name,
          convertAssetIDToImageSource(fruit.imageAssetID),
          bnd_itemCount,
          txtOffset,
          ifIsEmpty,
          this.onButtonPressed.bind(this),
          FruitBackgroundColor,
          70
        )
      );
    });

    pieTypes.forEach((pie) => {
      let bnd_itemCount = this.inventoryCountBindings.get(pie.name);
      if (!bnd_itemCount) {
        bnd_itemCount = new Binding<string>("0");
        this.inventoryCountBindings.set(pie.name, bnd_itemCount);
      }

      if (
        playerInventory &&
        playerInventory.items[pie.name] &&
        playerInventory.items[pie.name] > 0
      ) {
        ifIsEmpty = false;
      }

      newUIInventoryArray.push(
        inventorySlotButton(
          this,
          "InventoryType_" + pie.name,
          convertAssetIDToImageSource(pie.imageAssetID),
          bnd_itemCount,
          txtOffset,
          ifIsEmpty,
          this.onButtonPressed.bind(this),
          PieBackgroundColor,
          70
        )
      );
    });

    return newUIInventoryArray;
  }

  //region getAvailableRecipes()
  public getAvailableRecipes(player: Player): InventoryType[] {
    const playerInventory = this.inventoryMgr?.getPlayerInventory(player);
    if (!playerInventory) {
      console.error("No inventory found for active player.");
      return [];
    }
    //cycle through recipe catalog and return all recipes the player owns
    const availableRecipes: InventoryType[] = [];
    pieTypes.forEach((pieType) => {
      const recipeType = validate(this, pieType.recipeType);
      if (playerInventory.items[recipeType!] && playerInventory.items[recipeType!] > 0) {
        availableRecipes.push(recipeType!);
      }
    });
    return availableRecipes;
  }
}
UIComponent.register(UI_OneHUD);
