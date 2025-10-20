import {
  Component,
  Player,
  AudioGizmo,
  CodeBlockEvents,
  AttachableEntity,
  AttachablePlayerAnchor,
  PlayerControls,
  PlayerInputAction,
  ButtonIcon,
  Vec3,
  EventSubscription,
  World,
  PropTypes,
  PlayerInput,
  DynamicLightGizmo,
  MeshEntity,
  Color,
} from "horizon/core";
import { sysEvents } from "sysEvents";

enum ThrustState {
  OFF,
  ON,
  IDLE,
  FLY,
  DESCEND,
}

export class EXO_JETPACK extends Component<typeof EXO_JETPACK> {
  static propsDefinition = {
    JetpackMeshA: { type: PropTypes.Entity },
    JetpackMeshB: { type: PropTypes.Entity },
    thrustFXL: { type: PropTypes.Entity },
    thrustFXR: { type: PropTypes.Entity },
    thrustLIGHTL: { type: PropTypes.Entity },
    thrustLIGHTR: { type: PropTypes.Entity },
    SFXtakeoff: { type: PropTypes.Entity },
    SFXhover: { type: PropTypes.Entity },
    SFXidle: { type: PropTypes.Entity },
    SFXfly: { type: PropTypes.Entity },
    JetpackCOLORa: { type: PropTypes.Color, default: new Color(1, 1, 1) },
    JetpackCOLORb: { type: PropTypes.Color, default: new Color(0.93, 0.01, 0.06) },
    JetpackThrustCOLOR: { type: PropTypes.Color, default: new Color(0, 0.93, 1) },
    thrust: { type: PropTypes.Number, default: 0.1 },
    flyAnim: { type: PropTypes.Asset },
  };

  private playerGravityMap = new Map<number, number>();
  private playerSpeedMap = new Map<number, number>();
  private updateSubscription?: EventSubscription;
  private isAscending = false;
  private isDescending = false;
  private currentPlayer?: Player;
  private speed: number = 0;
  private height: number = 0;
  private isAirborne: boolean = false;
  private ascendInput?: PlayerInput;
  private descendInput?: PlayerInput;
  private ascentTimeout?: number;
  private joystickInput?: PlayerInput;
  private enableFly?: PlayerInput;
  private isAlreadyFlying: boolean = false;
  private isFlyingLatchOpen: boolean = false;
  private isFlyingEnabled: boolean = false;
  private thrustState: ThrustState = ThrustState.OFF;

  private localPlayer: Player | undefined;
  private isGrabbed: boolean = false;

  //region preStart()
  override preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabStart, (isRightHand: boolean, player: Player) =>
      this.onGrab(player)
    );

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabEnd, (player: Player) => this.onRelease(player));
  
   this.connectNetworkBroadcastEvent(sysEvents.updateMenuContext, (data) => {
      if (data.menuContext.length > 0){
        this.isGrabbed = false;
        this.ascendInput?.disconnect();
        this.descendInput?.disconnect();
        this.enableFly?.disconnect();
        this.updateSubscription?.disconnect();
        this.isAscending = false;
        this.isDescending = false;
        this.updateThrustState(ThrustState.OFF);
      }
      else if (!this.isGrabbed && this.localPlayer) {
        this.onGrab(this.localPlayer!);
      }
   });
  }

  //region start()
  override start() {
    this.updateThrustState(ThrustState.OFF);
    this.jetpackTINT();

    if (this.entity.owner.get().id === this.world.getServerPlayer().id) {
      return;
    }
    //-----ONLY LOCAL PLAYER BEYOND THIS POINT-----

    this.localPlayer = this.entity.owner.get();
    const raceConditionDelay = 500;
    this.async.setTimeout(() => {
      if (this.localPlayer) this.onGrab(this.localPlayer);
    }, raceConditionDelay);
  }

  //region onWorldUpdate()
  private onWorldUpdate() {
    if (!this.currentPlayer) return;

    if (this.isAscending) {
      this.currentPlayer.applyForce(Vec3.up.mul(this.props.thrust * 2));
    }

    if (this.isDescending) {
      this.currentPlayer.applyForce(Vec3.down.mul(this.props.thrust * 4));
    }

    this.speed = this.currentPlayer.velocity.get().magnitude();

    //region grounded check
    if (this.currentPlayer && this.currentPlayer?.isGrounded.get()) {
      if (this.isAirborne && !this.ascentTimeout) {
        //reset stuff
        // this.isAirborne = false;
        // this.currentPlayer?.gravity.set(9.81);
        // this.stopPlayerAnimation();
        this.updateThrustState(ThrustState.OFF);
      }
    }

    //region isAirborne check
    if (this.isAirborne) {
      const axisValue = this.joystickInput?.axisValue.get();
      if (axisValue && axisValue > 0.5 && (this.isFlyingEnabled || this.isFlyingLatchOpen)) {
        console.log(`Flying enabled ${this.isFlyingEnabled} Latch ${this.isFlyingLatchOpen}`);
        this.isFlyingEnabled = true;
        if (!this.isAlreadyFlying) {
          this.updateThrustState(ThrustState.FLY);
          this.isAlreadyFlying = true;
          this.currentPlayer?.playAvatarAnimation(this.props.flyAnim!, {
            looping: true,
            playRate: 1, // Adjust play rate based on speed (max speed 5
          });
          this.currentPlayer?.locomotionSpeed.set(9);
        }
      } else if (this.isAlreadyFlying) {
        this.isFlyingEnabled = false;
        this.updateThrustState(ThrustState.IDLE);
        this.currentPlayer?.locomotionSpeed.set(6.75);
        this.stopPlayerAnimation();
      }
    }
  }

  stopPlayerAnimation() {
    if (!this.isAlreadyFlying) return;
    this.isAlreadyFlying = false;
    if (!this.currentPlayer) return;
    this.currentPlayer?.stopAvatarAnimation();
    const originalSpeed = this.playerSpeedMap.get(this.currentPlayer.id);
    this.currentPlayer?.locomotionSpeed.set(originalSpeed !== undefined ? originalSpeed : 4.5);
  }

  //region onGrab()
  private onGrab(player: Player) {
    this.isGrabbed = true;
    const attachable = this.entity.as(AttachableEntity);
    if (!attachable) return;

    attachable.attachToPlayer(player, AttachablePlayerAnchor.Torso);

    this.playerGravityMap.set(player.id, player.gravity.get());
    this.playerSpeedMap.set(player.id, player.locomotionSpeed.get());
    this.currentPlayer = player;

    this.ascendInput = PlayerControls.connectLocalInput(PlayerInputAction.Jump, ButtonIcon.Rocket, this);
    this.ascendInput.registerCallback((action, pressed) => {
      this.handlePlayerAscent(action, pressed);
    });

    this.descendInput = PlayerControls.connectLocalInput(PlayerInputAction.RightTertiary, ButtonIcon.Contract, this);
    this.descendInput.registerCallback((action, pressed) => {
      this.handlePlayerDescent(action, pressed);
    });

    this.enableFly = PlayerControls.connectLocalInput(PlayerInputAction.RightSecondary, ButtonIcon.Expand, this);
    this.enableFly.registerCallback((action, pressed) => {
      this.isFlyingLatchOpen = pressed;
    });

    this.joystickInput = PlayerControls.connectLocalInput(PlayerInputAction.LeftYAxis, ButtonIcon.None, this);
    this.joystickInput.registerCallback((action, pressed) => {});

    //for grounded check
    this.updateSubscription = this.connectLocalBroadcastEvent(World.onUpdate, () => this.onWorldUpdate());
  }

  //region handleAscent()
  handlePlayerAscent(action: PlayerInputAction, pressed: boolean) {
    //If player is grounded and jump is pressed, start jetpack after short delay
    if (pressed) {
      this.updateThrustState(ThrustState.ON);
      this.currentPlayer?.gravity.set(0);
      //if already airborn then immediately start ascending
      if (this.isAirborne) {
        this.isAscending = true;
      } else {
        //start 2 second timer
        this.ascentTimeout = this.async.setTimeout(() => {
          this.isAscending = true;
          this.isAirborne = true;
        }, 500);
      }
    }
    //If jump is released
    else {
      //clear timer if still running to return to ground
      if (this.ascentTimeout) {
        this.async.clearTimeout(this.ascentTimeout);
        this.ascentTimeout = undefined;
      }
      //If player was flying up, stop ascending and lerp to zero
      if (this.isAscending) {
        this.isAscending = false;
        this.lerpVelocityToZero();
        this.updateThrustState(ThrustState.IDLE);
      }
      //Player didn't stay in air longer than Timeout so return to normal gravity
      else {
        this.currentPlayer?.gravity.set(9.81);
        this.updateThrustState(ThrustState.OFF);
      }
    }
  }

  //region handleDescent()
  handlePlayerDescent(action: PlayerInputAction, pressed: boolean) {
    this.isDescending = pressed;
    if (pressed) {
      this.updateThrustState(ThrustState.DESCEND);
    } else {
      this.lerpVelocityToZero();

      if (this.isAirborne) {
        this.updateThrustState(ThrustState.IDLE);
      } else {
        this.updateThrustState(ThrustState.OFF);
      }
    }
  }

  //region lerpToZero()
  lerpVelocityToZero() {
    this.async.setTimeout(() => {
      if (this.currentPlayer) {
        const velocity = this.currentPlayer.velocity.get();
        const lerped = Vec3.lerp(velocity, Vec3.zero, 0.2);
        this.currentPlayer.velocity.set(lerped);
        if (lerped.magnitude() > 0.1) {
          this.lerpVelocityToZero();
        } else {
          this.currentPlayer.velocity.set(Vec3.zero);
        }
      }
    }, 100);
  }

  //region onRelease()
  private onRelease(player: Player) {
    this.entity.as(AttachableEntity)?.detach();

    const originalGravity = this.playerGravityMap.get(player.id);
    const originalSpeed = this.playerSpeedMap.get(player.id);
    player.gravity.set(originalGravity !== undefined ? originalGravity : 9.81);
    player.locomotionSpeed.set(originalSpeed !== undefined ? originalSpeed : 4.5);
    this.playerGravityMap.delete(player.id);
    this.playerSpeedMap.delete(player.id);

    this.ascendInput?.disconnect();
    this.descendInput?.disconnect();
    this.updateSubscription?.disconnect();
    this.isAscending = false;
    this.isDescending = false;
    this.isAirborne = false;
    this.currentPlayer = undefined;
  }

  //region updateThrustState()
  updateThrustState(newState: ThrustState) {
    this.props.SFXtakeoff?.as(AudioGizmo)?.stop();
    this.props.SFXhover?.as(AudioGizmo)?.stop();
    this.props.SFXidle?.as(AudioGizmo)?.stop();
    this.props.SFXfly?.as(AudioGizmo)?.stop();

    let thrustScale = Vec3.zero;
    let thrusLight = 0;
    switch (newState) {
      case ThrustState.OFF:
        this.isAirborne = false;
        this.currentPlayer?.gravity.set(9.81);
        this.stopPlayerAnimation();
        break;
      case ThrustState.ON:
        thrustScale = new Vec3(1.12, 1.12, 1.12);
        thrusLight = 0.5;
        this.props.SFXtakeoff?.as(AudioGizmo)?.play();
        this.props.SFXhover?.as(AudioGizmo)?.play();
        break;
      case ThrustState.IDLE:
        thrustScale = new Vec3(1.12, 0.5, 1.12);
        thrusLight = 0.2;
        this.props.SFXidle?.as(AudioGizmo)?.play();
        break;
      case ThrustState.FLY:
        thrustScale = new Vec3(2, 2, 2);
        thrusLight = 0.7;
        this.props.SFXtakeoff?.as(AudioGizmo)?.play();
        this.props.SFXfly?.as(AudioGizmo)?.play();
        break;
      case ThrustState.DESCEND:
        thrustScale = new Vec3(0.5, 0.5, 0.5);
        thrusLight = 0.1;
        this.props.SFXidle?.as(AudioGizmo)?.play();
        break;
      default:
        break;
    }

    this.props.thrustFXL?.scale.set(thrustScale);
    this.props.thrustFXR?.scale.set(thrustScale);
    this.props.thrustLIGHTL?.as(DynamicLightGizmo)?.intensity.set(0);
    this.props.thrustLIGHTR?.as(DynamicLightGizmo)?.intensity.set(0);

    // console.error(`Thrust State: ${ThrustState[newState]}`);
    this.thrustState = newState;
  }

  //region jetpackTINT()
  private jetpackTINT() {
    this.props.JetpackMeshA?.as(MeshEntity)?.style.tintColor.set(this.props.JetpackCOLORa);
    this.props.JetpackMeshB?.as(MeshEntity)?.style.tintColor.set(this.props.JetpackCOLORb);
    this.props.thrustFXL?.as(MeshEntity)?.style.tintColor.set(this.props.JetpackThrustCOLOR);
    this.props.thrustFXR?.as(MeshEntity)?.style.tintColor.set(this.props.JetpackThrustCOLOR);
  }
}

Component.register(EXO_JETPACK);
