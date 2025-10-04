// Copyright (c) Dave Mills (uRocketLife). Released under the MIT License.

import { Asset, Color, Entity, NetworkEvent, Player, PropTypes, Vec3 } from "horizon/core";
import { AnimatedBinding, Animation, Binding, Easing, ImageSource, UIComponent, UINode, View } from "horizon/ui";
import { confirm, DefaultBlankImgAssetID, notification, numberUp, popup, progressBar } from "sysUIStyleGuide";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";

export const UI_OneHudTag = "UI_OneHUD";

export const oneHudEvents = {
  //region Events
  SetProgressEvent: new NetworkEvent<{ player: Player; amount: string }>("SetProgressEvent"),
  SetPlayerLevelEvent: new NetworkEvent<{ player: Player; level: string }>("SetPlayerLevelEvent"),
  SetHealthEvent: new NetworkEvent<{ player: Player; amount: string }>("SetHealthEvent"),
  SetScoreEvent: new NetworkEvent<{ player: Player; amount: string }>("SetScoreEvent"),
  // A request/response event pair informs any requesting Entity when the player closes the popup.
  PopupRequest: new NetworkEvent<{ requester: Entity; player: Player; title: string; message: string }>("PopupRequest"),
  PopupResponse: new NetworkEvent<{ player: Player }>("PopupResponse"),

  NotificationEvent: new NetworkEvent<{
    message: string;
    players: Player[];
    imageAssetId: string | null;
  }>("NotificationEvent"),

  ConfirmationPanelRequest: new NetworkEvent<{
    requester: Entity;
    player: Player;
    confirmationMessage: string;
  }>("ConfirmationPanelRequest"),
  ConfirmationPanelResponse: new NetworkEvent<{ player: Player; message: string; accepted: boolean }>(
    "ConfirmationPanelResponse"
  ),
};

export class UI_OneHUD extends UIComponent<typeof UI_OneHUD> {
  //region propsDefs
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    //progress bar vars
    PROGRESS_BAR_HEADER: { type: PropTypes.String, default: "ProgressBar" },
    progressBarEnabled: { type: PropTypes.Boolean, default: true },
    pbScreenPosition: { type: PropTypes.Vec3, default: new Vec3(50, 90, 10) },
    pbRotation: { type: PropTypes.Number, default: 0 },
    pbScale: { type: PropTypes.Number, default: 0.75 },
    pbBarColor: { type: PropTypes.Color, default: new Color(1, 1, 1) },
    pbFillColor: { type: PropTypes.Color, default: new Color(1, 1, 0) },
    pbShowText: { type: PropTypes.Boolean, default: true },
    pbTextColor: { type: PropTypes.Color, default: new Color(0, 0, 0) },
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
    hbScale: { type: PropTypes.Number, default: 0.65 },
    hbBarColor: { type: PropTypes.Color, default: new Color(1, 1, 1) },
    hbFillColor: { type: PropTypes.Color, default: new Color(1, 0, 0) },
    hbShowText: { type: PropTypes.Boolean, default: true },
    hbTextColor: { type: PropTypes.Color, default: new Color(0, 0, 0) },
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
    //coin count vars
    COIN_HEADER: { type: PropTypes.String, default: "CoinCount" },
    coinEnabled: { type: PropTypes.Boolean, default: true },
    coinImgAsset: { type: PropTypes.Asset },
    coinScreenPosition: { type: PropTypes.Vec3, default: new Vec3(50, 70, 11) },
    coinScale: { type: PropTypes.Number, default: 1.0 },
    coinNumColor: { type: PropTypes.Color, default: new Color(1, 1, 1) },
    coinBackgroundOn: { type: PropTypes.Boolean, default: true },
    coinBackgroundColor: { type: PropTypes.Color, default: new Color(1, 0.84, 0) },
    //diamond count vars
    DIAMOND_HEADER: { type: PropTypes.String, default: "DiamondCount" },
    diamondEnabled: { type: PropTypes.Boolean, default: true },
    diamondImgAsset: { type: PropTypes.Asset },
    diamondScreenPosition: { type: PropTypes.Vec3, default: new Vec3(50, 70, 11) },
    diamondScale: { type: PropTypes.Number, default: 1.0 },
    diamondNumColor: { type: PropTypes.Color, default: new Color(1, 1, 1) },
    diamondBackgroundOn: { type: PropTypes.Boolean, default: true },
    diamondBackgroundColor: { type: PropTypes.Color, default: new Color(0, 1, 1) },
  };

  //region private var
  //progressBar Variables
  bnd_progressBar = new Binding<string>("0%");

  //lvlUp Variables
  bnd_lvlNumber = new Binding<string>("0");
  animBnd_lvlScale = new AnimatedBinding(1);

  //healthBar Variables
  //this is just visual, default value is set in setHealth()
  bnd_healthBar = new Binding<string>("100");
  playerHealthMap: Map<Player, number> = new Map();

  //score Variables
  bnd_score = new Binding<string>("0");
  animBnd_scoreScale = new AnimatedBinding(1);

  //coin Variables
  bnd_coinCount = new Binding<string>("0");
  animBnd_coinScale = new AnimatedBinding(1);

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

    const coinImgAssetId = this.props.coinImgAsset?.id?.toString() ?? DefaultBlankImgAssetID; // default to blank image asset
    const diamondImgAssetId = this.props.diamondImgAsset?.id?.toString() ?? DefaultBlankImgAssetID; // default to blank image asset

    // Initialize UI elements here
    return View({
      children: [
        //progress bar
        ...progressBar(
          this.bnd_progressBar,
          this.props.progressBarEnabled,
          this.props.pbScreenPosition,
          this.props.pbRotation,
          this.props.pbScale,
          this.props.pbBarColor,
          this.props.pbFillColor,
          this.props.pbShowText,
          this.props.pbTextColor
        ),
        //health bar
        ...progressBar(
          this.bnd_healthBar,
          this.props.healthBarEnabled,
          this.props.hbScreenPosition,
          this.props.hbRotation,
          this.props.hbScale,
          this.props.hbBarColor,
          this.props.hbFillColor,
          this.props.hbShowText,
          this.props.hbTextColor
        ),
        //level up
        ...numberUp(
          this.bnd_lvlNumber,
          this.props.lvlEnabled,
          this.props.lvlScreenPosition,
          this.props.lvlScale,
          this.props.lvlBackgroundOn,
          this.props.lvlBackgroundColor,
          this.props.lvlNumColor,
          this.animBnd_lvlScale,
          lvlImgAssetId
        ),
        //score
        ...numberUp(
          this.bnd_score,
          this.props.scoreEnabled,
          this.props.scoreScreenPosition,
          this.props.scoreScale,
          this.props.scoreBackgroundOn,
          this.props.scoreBackgroundColor,
          this.props.scoreNumColor,
          this.animBnd_scoreScale,
          scoreImgAssetId
        ),
        //coin count
        ...numberUp(
          this.bnd_coinCount,
          this.props.coinEnabled,
          this.props.coinScreenPosition,
          this.props.coinScale,
          this.props.coinBackgroundOn,
          this.props.coinBackgroundColor,
          this.props.coinNumColor,
          this.animBnd_coinScale,
          coinImgAssetId
        ),
        //diamond count
        ...numberUp(
          this.bnd_diamondCount,
          this.props.diamondEnabled,
          this.props.diamondScreenPosition,
          this.props.diamondScale,
          this.props.diamondBackgroundOn,
          this.props.diamondBackgroundColor,
          this.props.diamondNumColor,
          this.animBnd_diamondScale,
          diamondImgAssetId
        ),
        //popup window
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
        ),
        //notification
        notification(this.bnd_notifyDisplay, this.bndAlertImg, this.bndAlertMsg, this.animBnd_translateX, 400, 100),
        //confirmation panel
        confirm(
          this,
          this.bndHeaderText,
          this.bndConfirm_Scale,
          this.bndCancel_Scale,
          this.bnd_confirmDisplay,
          (accepted: boolean, player: Player) => this.handleConfirmationResponse(accepted, player)
        ),
      ],
      style: {
        width: "100%",
        height: "100%",
        position: "absolute",
      },
    });
  }

  //region preStart()
  preStart(): void {
    if (!this.props.enabled) return;

    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      console.log(`Simple button called on ${this.entity.name.get()} pressed by ${data.player.name.get()}`);
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
  }

  //region start()
  start() {
    if (!this.props.enabled) return;

    this.notifyEasing = Easing.inOut(Easing.cubic);

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
    //set the UI alll the way to the right
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
        //then move the UI alll the way to the left(-1000px) over 1000ms
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

  //region Request()
  public showConfirmationPanel(requester: Entity, player: Player, confirmationMessage: string): void {
    //set up confirmation message
    console.log(`Confirmation request received`);
    this.bndHeaderText.set(confirmationMessage);
    // Show the confirmation panel for specific player
    this.bnd_confirmDisplay.set("flex", [player]);

    //store message and requester to player (multiplayer support)
    this.playerMessageMap.set(player, { entity: requester, message: confirmationMessage });
  }
  //region Response()
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
}
UIComponent.register(UI_OneHUD);
