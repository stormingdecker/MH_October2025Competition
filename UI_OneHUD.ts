// Copyright (c) Dave Mills (uRocketLife). Released under the MIT License.

import { DailyRewardManager } from "DailyRewardManager";
import { Asset, Color, Entity, NetworkEvent, Player, PropTypes, Vec3 } from "horizon/core";
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
import { sysEvents } from "sysEvents";
import { debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import { InventoryType } from "sysTypes";
import {
  btnImgBndText,
  confirm,
  convertAssetIDToImageSource,
  dailyRewardWindow,
  DefaultBlankImgAssetID,
  foodMenuWindow,
  ImgSetUIwStrings,
  notification,
  numberUp,
  popup,
  progressBar,
  progressionTask,
} from "sysUIStyleGuide";
import { getMgrClass } from "sysUtils";
import { oneHudEvents } from "UI_OneHUDEvents";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

export const UI_OneHudTag = "UI_OneHUD";

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
    currencyContainerSize: { type: PropTypes.Vec3, default: new Vec3(75, 75, 0) },
    //task progress popup
    PROGRESSION_TASK_HEADER: { type: PropTypes.String, default: "Progression Task" },
    progTaskEnabled: { type: PropTypes.Boolean, default: false },
    progTaskSize: { type: PropTypes.Vec3, default: new Vec3(300, 100, 1) }, //width, height, scale
    progTaskScreenPosition: { type: PropTypes.Vec3, default: new Vec3(50, 60, 11) }, //x%, y%, z-index
    progTaskResultImg: { type: PropTypes.Asset },
    progTaskInstructImg: { type: PropTypes.Asset },
  };

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

  //popup Variables
  bnd_popupDisplay = new Binding<string>("flex");
  bnd_popupTitle = new Binding<string>("New Popup!");
  bnd_popupContent = new Binding<string>("Popup Content");
  bnd_popupWatermark = new Binding<ImageSource>(""); // Provide an initial value, e.g., empty string or default image source
  animBnd_popupPosY = new AnimatedBinding(1);
  bnd_popupBtnScale = new Binding<number>(1);
  //keeps track of which entity by which player requested the popup, so we can respond to the right entity when they close it
  popupRequestResponseMap = new Map<Player, Entity>();

  //notification variables
  bnd_notifyDisplay = new Binding<string>("flex");
  bndAlertImg = new Binding<ImageSource>("");
  bndAlertMsg = new Binding<string>("Looking good today!");
  animBnd_translateX = new AnimatedBinding(0);
  private notifyEasing!: Easing;

  //confirmation variables
  bnd_confirmDisplay = new Binding<string>("flex");
  bndHeaderText = new Binding<string>("Are you sure you want to proceed?");
  //Stores player to message making multiplayer confirmations work per player
  playerMessageMap: Map<Player, { entity: Entity; message: string }> = new Map();
  bndConfirm_Scale = new Binding<number>(1);
  bndCancel_Scale = new Binding<number>(1);

  //prog task
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
  bnd_showTaskProgressBar = new Binding<string>("flex");

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

  private curMenuContext: string[] = [];

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

    const currencyImgAssetId =
      this.props.currencyImgAsset?.id?.toString() ?? DefaultBlankImgAssetID; // default to blank image asset
    const diamondImgAssetId = this.props.diamondImgAsset?.id?.toString() ?? DefaultBlankImgAssetID; // default to blank image asset
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
            //region diamond count
            ...this.toNodes(
              btnImgBndText(
                this,
                "diamondBtn",
                convertAssetIDToImageSource(diamondImgAssetId),
                this.bnd_diamondCount,
                convertAssetIDToImageSource(plusImgAssetId),
                this.animBnd_diamondScale,
                this.onButtonPressed.bind(this)
              )
            ),
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
            // transform: [{ scale: this.props.currencyContainerSize }],
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
            400,
            100
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
            this.props.progTaskEnabled,
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

    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      console.log(
        `Simple button called on ${this.entity.name.get()} pressed by ${data.player.name.get()}`
      );
      if (this.progTaskIsHidden) {
        this.showProgTask([data.player], "Task In Progress", "Tap rapidly", "", "");
        this.progTaskIsHidden = false;
      } else {
        this.hideProgTask([data.player]);
        this.progTaskIsHidden = true;
      }
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
      this.showNotification(data.message, data.players, data.imageAssetId);
    });

    // popup subscriptions
    this.connectNetworkEvent(this.entity, oneHudEvents.PopupRequest, (data) => {
      this.popupRequestResponseMap.set(data.player, data.requester);
      this.showPopup(data.player, data.title, data.message);
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
      }
    });

    this.connectNetworkEvent(this.entity, oneHudEvents.ShowDailyRewardUI, (data) => {
      this.bnd_dailyRewardDisplay.set("flex", data.players);
    });
    this.connectNetworkEvent(this.entity, oneHudEvents.UpdateDailyRewardStreak, (data) => {
      this.updateDailyRewardStreak([data.player], data.newStreak);
    });

    //region context menu updates
    this.connectNetworkBroadcastEvent(sysEvents.updateMenuContext, (data) => {
      const newContextMenuLength = data.menuContext.length;
      const isSubMenu = data.menuContext.length == 2;
      const isDetailMenu = data.menuContext.length == 3;

      if (isSubMenu && data.menuContext[1] === "FoodMenu") {
        this.bnd_foodMenuDisplay.set("flex", [data.player]);
      } else {
        this.bnd_foodMenuDisplay.set("none", [data.player]);
      }

      this.curMenuContext = data.menuContext ?? [];
    });

    this.connectNetworkEvent(this.entity, sysEvents.showDailyRewardUI, (data) => {
      // this.bnd_dailyRewardDisplay.set(data.show ? "flex" : "none", [data.player]);
      this.playerGiftBoxMap.set(data.player, data.giftBox);
      const dailyRewardMgr = getMgrClass<DailyRewardManager>(
        this,
        ManagerType.DailyRewardManager,
        DailyRewardManager
      );
      const dailyStreak = dailyRewardMgr?.getDailyRewardInfo(data.player)?.dailyStreak ?? 0;
      console.log(
        `Updating daily reward streak to ${dailyStreak} for player ${data.player.name.get()}`
      );
      this.updateDailyRewardStreak([data.player], dailyStreak);
    });
  }

  updateDailyRewardStreak(players: Player[], newStreak: number): void {
    if (this.imageSetMap.has("DailyRewards")) {
      let imageSet_wStreak = this.imageSetMap.get("DailyRewards")!;
      for (let i = 0; i < imageSet_wStreak.usePrimaryImage.length; i++) {
        imageSet_wStreak.usePrimaryImage[i] = i <= newStreak;
      }
      console.log(`Updating daily reward streak to ${newStreak} for player ${players[0].name.get()}`);
      this.playerDailyStreakMap.set(players[0], newStreak);
      this.setupDailyRewardContainer(players, imageSet_wStreak);
    } else if (this.imageSetMap.has("FoodMenu")) {
      let imageSet_foodMenu = this.imageSetMap.get("FoodMenu")!;
      for (let i = 0; i < imageSet_foodMenu.usePrimaryImage.length; i++) {
        imageSet_foodMenu.usePrimaryImage[i] = i <= newStreak;
      }
      this.setupFoodMenuContainer(players, imageSet_foodMenu);
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
  }

  setupDailyRewardContainer(players: Player[], imageSet: ImageSetProps): void {
    if (!this.imageSetMap.has("DailyRewards")) {
      console.warn("No daily reward child nodes to setup.");
      return;
    }
    const recipients = players.length > 0 ? players : undefined;
    const imageSetType = "DailyRewards";
    const newUINodeArray = this.convertImageSetToUINodeArray(this.imageSetMap.get(imageSetType)!);
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
    const newUINodeArray = this.convertImageSetToUINodeArray(this.imageSetMap.get(imageSetType)!);
    this.foodMenu_childrenUINodeArray.set(newUINodeArray, recipients);
    // Assuming you want to do something with newUINodeArray here
  }

  //region onButtonPressed()
  onButtonPressed(instanceId: string, player: Player) {
    switch (instanceId) {
      case "currencyBtn":
        console.log("Currency Button Pressed");
        break;
      case "diamondBtn":
        console.log("Diamond Button Pressed");
        break;
      case "claimDailyRewards":
        console.log(`Daily Reward Claim Button Pressed by ${player.name.get()}`);
        this.bnd_dailyRewardDisplay.set("none", [player]);
        if (this.playerGiftBoxMap.has(player)) {
          const giftBoxEntity = this.playerGiftBoxMap.get(player)!;

          const dailyStreak = this.playerDailyStreakMap.get(player) || 0; //this is placeholder
          const rewardAmount = 10 + dailyStreak * 5; //example: base 10 currency + 5 per streak day
          this.sendNetworkEvent(giftBoxEntity, sysEvents.openDailyRewardGiftBox, {
            player: player,
          });

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
          }, 2000);
        }
        break;
      case "exitDailyRewards":
        console.log(`Daily Reward Exit Button Pressed by ${player.name.get()}`);
        this.bnd_dailyRewardDisplay.set("none", [player]);
        break;
      case "exitFoodMenu":
        console.log(`Food Menu Exit Button Pressed by ${player.name.get()}`);
        this.bnd_foodMenuDisplay.set("none", [player]);
        break;
      default:
        console.warn(`Unhandled button press for instanceId: ${instanceId}`);
        break;
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
  public showPopup(player: Player, title: string, message: string): void {
    this.bnd_popupTitle.set(title, [player]);
    this.bnd_popupContent.set(message, [player]);
    this.bnd_popupDisplay.set("flex", [player]);
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
  public showNotification(message: string, players: Player[], imageAssetId: string | null) {
    const asset = imageAssetId ? new Asset(BigInt(imageAssetId)) : this.props.notificationImg!;
    const imgSrc = ImageSource.fromTextureAsset(asset);
    let recipients = players.length > 0 ? players : undefined;
    this.bndAlertImg.set(imgSrc, recipients);

    this.bndAlertMsg.set(message, recipients);

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
        1500,
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
      undefined,
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
        console.warn(`Unknown type: ${inventoryType}`);
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

  //region Asset[] to UINode[]
  private convertImageSetToUINodeArray(imageSetProps: ImageSetProps): UINode[] {
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
}
UIComponent.register(UI_OneHUD);
