import { CodeBlockEvents, Component, Entity, Player, PropTypes } from "horizon/core";
import { oneHudEvents } from "UI_OneHUD";

class UI_OneHUD_Demo extends Component<typeof UI_OneHUD_Demo> {
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
  };

  oneHUD: Entity | null = null;

  demoIndex = 0;

  preStart() {
    if (!this.props.enabled) {
      return;
    }
    this.oneHUD = this.world.getEntitiesWithTags(["UI_OneHUD"])[0] || null;
    if (!this.oneHUD) {
      console.error("UI_OneHUD entity not found in the world. Please add an entity with the 'UI_OneHUD' tag.");
      return;
    }

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player) => {
      console.log(`${player.name.get()} entered the world.`);
      this.playDemoOrder(player);
    });

    this.connectNetworkEvent(this.entity, oneHudEvents.PopupResponse, (data) => {
      console.log(`Popup closed by ${data.player.name.get()}`);
      this.playDemoOrder(data.player);
    });

    this.connectNetworkEvent(this.entity, oneHudEvents.ConfirmationPanelResponse, (data) => {
      console.log(`Confirmation response from ${data.player.name.get()}: ${data.accepted}`);
      this.playDemoOrder(data.player, data.accepted);
    });
  }

  start() {
    if (!this.props.enabled) {
      return;
    }
  }

  playDemoOrder(player: Player, accepted: boolean = false): void {
    console.log(`Demo step ${this.demoIndex}`);

    switch (this.demoIndex) {
      case 0:
        this.sendNetworkEvent(this.oneHUD!, oneHudEvents.PopupRequest, {
          requester: this.entity,
          title: "Welcome!",
          message: `Hello ${player.name.get()}, welcome to the UI_OneHUD demo!`,
          player,
        });
        break;
      case 1:
        const message = "We're glad you're here!";
        this.sendNetworkEvent(this.oneHUD!, oneHudEvents.NotificationEvent, {
          message,
          players: [player],
          imageAssetId: null,
        });
        this.async.setTimeout(() => {
          this.playDemoOrder(player);
        }, 3000);
        break;
      case 2:
        const msg = "Do you want to Lvl Up?";
        this.sendNetworkEvent(this.oneHUD!, oneHudEvents.ConfirmationPanelRequest, {
          requester: this.entity,
          player,
          confirmationMessage: msg,
        });
        break;
      case 3:
        if (accepted) {
          this.sendNetworkEvent(this.oneHUD!, oneHudEvents.NotificationEvent, {
            message: `Good choice!`,
            players: [player],
            imageAssetId: null,
          });
          this.async.setTimeout(() => {
            this.levelUp(player, 0);
          }, 2000);
        } else {
          this.sendNetworkEvent(this.oneHUD!, oneHudEvents.NotificationEvent, {
            message: `Wrong choice!`,
            players: [player],
            imageAssetId: null,
          });
          this.async.setTimeout(() => {
            this.hurt(player, 100);
          }, 2000);
        }
        break;
      case 4:
        const msg2 = "Do you want 9,999 points?";
        this.sendNetworkEvent(this.oneHUD!, oneHudEvents.ConfirmationPanelRequest, {
          requester: this.entity,
          player,
          confirmationMessage: msg2,
        });
        break;
      case 5:
        if (accepted) {
          this.sendNetworkEvent(this.oneHUD!, oneHudEvents.SetScoreEvent, {
            player,
            amount: "9999",
          });
        }
        const note = accepted ? `Here's your points!` : `No points for you!`;
        this.sendNetworkEvent(this.oneHUD!, oneHudEvents.NotificationEvent, {
          message: note,
          players: [player],
          imageAssetId: null,
        });

        this.async.setTimeout(() => {
          this.playDemoOrder(player);
        }, 3000);
        break;
      case 6:
        this.sendNetworkEvent(this.oneHUD!, oneHudEvents.PopupRequest, {
          requester: this.entity,
          title: "That's all folks!",
          message: `Hope it helps and I'll check you later! -uRocketLife`,
          player,
        });
        break;
      default:
        console.log("No more demos.");
        break;
    }
    console.log(`Demo step ${this.demoIndex} done.`);
    this.demoIndex++;
  }

  levelUp(player: Player, curAmount: number): void {
    const newAmount = curAmount + 11;
    this.sendNetworkEvent(this.oneHUD!, oneHudEvents.SetProgressEvent, {
      player: player,
      amount: "11",
    });
    if (newAmount < 100) {
      this.async.setTimeout(() => {
        this.levelUp(player, newAmount);
      }, 1000);
    } else {
      this.async.setTimeout(() => {
        this.playDemoOrder(player);
      }, 1500);
    }
  }

  hurt(player: Player, curAmount: number): void {
    const newAmount = curAmount - 25;
    this.sendNetworkEvent(this.oneHUD!, oneHudEvents.SetHealthEvent, {
      player: player,
      amount: newAmount.toString(),
    });
    if (newAmount > 0) {
      this.async.setTimeout(() => {
        this.hurt(player, newAmount);
      }, 500);
    } else {
      this.playDemoOrder(player);
    }
  }
}
Component.register(UI_OneHUD_Demo);
