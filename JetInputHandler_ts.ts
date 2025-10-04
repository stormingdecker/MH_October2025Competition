import { AttachEvent } from "AutoAttachListByTag";
import {
  AttachableEntity,
  AttachablePlayerAnchor,
  CodeBlockEvent,
  CodeBlockEvents,
  Component,
  Player,
  PropTypes,
  Vec3,
} from "horizon/core";
import { PlayerJetMovement_ts } from "PlayerJetMovement_ts";

class JetInputHandler_ts extends Component<typeof JetInputHandler_ts> {
  static readonly propsDefinition = {
    autoAssignOwnership: { type: PropTypes.Boolean, default: true },
    isRightJet: { type: PropTypes.Boolean, default: true },
    PlayerJetMovement: { type: PropTypes.Entity },
    JetFX: { type: PropTypes.Entity },
  };

  localPlayer!: Player;
  Btn1Btn2Trigger: Vec3 = Vec3.zero;
  isInRightHand: boolean = false;

  playerJetMovement!: PlayerJetMovement_ts;

  static readonly Events = {
    checkhandedness: new CodeBlockEvent<[]>("checkhandedness", []),
  };

  override preStart() {
    if (this.props.autoAssignOwnership) {
      this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player) => {
        if (!this.entity.owner.get()) {
          this.entity.owner.set(player);
        }
      });
    }

    if (this.entity.owner.get().id === this.world.getServerPlayer().id) {
      return;
    }

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabStart, this.onGrabStart.bind(this));

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabEnd, this.onGrabEnd.bind(this));

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnIndexTriggerDown, this.onIndexTriggerDown.bind(this));

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnIndexTriggerUp, this.onIndexTriggerUp.bind(this));

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnButton1Down, this.onButton1Down.bind(this));

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnButton1Up, this.onButton1Up.bind(this));

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnButton2Down, this.onButton2Down.bind(this));

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnButton2Up, this.onButton2Up.bind(this));



    this.connectNetworkEvent(this.entity, AttachEvent, (data) => {
      const player = data.player;
      if (player) {
        this.entity.owner.set(player);
        if (this.props.isRightJet) {
          this.sendNetworkEvent(this.props.PlayerJetMovement!, AttachEvent, {
            player: player,
          });
          // Add a semicolon to terminate the statement
          // this.entity.as(GrabbableEntity).forceHold(player, Handedness.Right, true);
        } else {
          // this.entity.as(GrabbableEntity).forceHold(player, Handedness.Left, true);
        }
      }
    });
  }

  override start() {
    if (this.entity.owner.get().id === this.world.getServerPlayer().id) {
      return;
    }

    this.localPlayer = this.entity.owner.get()!;
    this.playerJetMovement = this.props.PlayerJetMovement!.getComponents(PlayerJetMovement_ts)[0];
  }

  getPlayerJetMovement(): PlayerJetMovement_ts | null {
    if (!this.playerJetMovement) {
      this.playerJetMovement = this.props.PlayerJetMovement!.getComponents(PlayerJetMovement_ts)[0];
      if (!this.playerJetMovement) {
        console.error("PlayerJetMovement component still not found after retrying.");
        return null;
      }
    }
    return this.playerJetMovement;
  }

  onGrabStart(isRight: boolean, player: Player) {
    this.isInRightHand = isRight;
    this.getPlayerJetMovement()?.onGrabEvent(player, isRight);
    this.sendCodeBlockEvent(this.props.JetFX!, new CodeBlockEvent<[]>("OnGrabEvent", []));
  }

  onGrabEnd(player: Player) {
    this.entity.as(AttachableEntity)?.attachToPlayer(player, AttachablePlayerAnchor.Torso);
    this.playerJetMovement.onReleaseEvent(this.isInRightHand, Vec3.zero);
    this.sendCodeBlockEvent(this.props.JetFX!, new CodeBlockEvent<[]>("OnReleaseEvent", []));
  }

  onIndexTriggerDown(player: Player) {
    this.Btn1Btn2Trigger = new Vec3(this.Btn1Btn2Trigger.x, this.Btn1Btn2Trigger.y, 1.0);
    this.playerJetMovement.onButtonEvent(this.isInRightHand, this.Btn1Btn2Trigger);
    this.sendCodeBlockEvent(this.props.JetFX!, new CodeBlockEvent<[]>("OnFlightActivated", []));
  }

  onIndexTriggerUp(player: Player) {
    this.Btn1Btn2Trigger = new Vec3(this.Btn1Btn2Trigger.x, this.Btn1Btn2Trigger.y, 0.0);
    this.playerJetMovement.onButtonEvent(this.isInRightHand, this.Btn1Btn2Trigger);
    this.sendCodeBlockEvent(this.props.JetFX!, new CodeBlockEvent<[]>("OnIdle", []));
  }

  onButton1Down(player: Player) {
    this.Btn1Btn2Trigger = new Vec3(1.0, this.Btn1Btn2Trigger.y, this.Btn1Btn2Trigger.z);
    this.playerJetMovement.onButtonEvent(this.isInRightHand, this.Btn1Btn2Trigger);
  }

  onButton1Up(player: Player) {
    this.Btn1Btn2Trigger = new Vec3(0.0, this.Btn1Btn2Trigger.y, this.Btn1Btn2Trigger.z);
    this.playerJetMovement.onButtonEvent(this.isInRightHand, this.Btn1Btn2Trigger);
  }

  onButton2Down(player: Player) {
    this.Btn1Btn2Trigger = new Vec3(this.Btn1Btn2Trigger.x, 1.0, this.Btn1Btn2Trigger.z);
    this.playerJetMovement.onButtonEvent(this.isInRightHand, this.Btn1Btn2Trigger);

    this.sendCodeBlockEvent(this.props.JetFX!, new CodeBlockEvent<[]>("OnBoostActivated", []));
  }

  onButton2Up(player: Player) {
    this.Btn1Btn2Trigger = new Vec3(this.Btn1Btn2Trigger.x, 0.0, this.Btn1Btn2Trigger.z);
    this.playerJetMovement.onButtonEvent(this.isInRightHand, this.Btn1Btn2Trigger);
    this.sendCodeBlockEvent(this.props.JetFX!, new CodeBlockEvent<[]>("OnIdle", []));
  }

  onRightThumbStickButtonChange(pressed: boolean) {
    if (pressed) {
      this.Btn1Btn2Trigger = new Vec3(1.0, this.Btn1Btn2Trigger.y, this.Btn1Btn2Trigger.z);
      this.playerJetMovement.onButtonEvent(this.isInRightHand, this.Btn1Btn2Trigger);
    } else {
      this.Btn1Btn2Trigger = new Vec3(0.0, this.Btn1Btn2Trigger.y, this.Btn1Btn2Trigger.z);
      this.playerJetMovement.onButtonEvent(this.isInRightHand, this.Btn1Btn2Trigger);
    }
  }
  
}

Component.register(JetInputHandler_ts);
