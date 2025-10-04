import { AudioLabel, playAudio } from "AudioManager";
import { AttachEvent } from "AutoAttachListByTag";
import { CodeBlockEvent, Component, Entity, Player, PropTypes, Vec3, World, clamp } from "horizon/core";
import { sysEvents } from "sysEvents";
import { getEntityListByTag, ManagerType } from "sysHelper";
import { StatType } from "sysTypes";

export class PlayerJetMovement_ts extends Component<typeof PlayerJetMovement_ts> {
  private _debug: string = "";
  private _leftHandHolding: boolean = false;
  private _rightHandHolding: boolean = false;
  private _boostDirection: Vec3 = Vec3.zero;
  private _boostAmount: number = 0;
  private _boostDecay: number = 0.01;
  private _fallVelocity: Vec3 = Vec3.zero;
  private _isGrounded: boolean = false;
  private _tmp2: number = 0;
  private _tmp: number = 0;
  private _LJetPower: Vec3 = Vec3.zero;
  private _RJetPower: Vec3 = Vec3.zero;
  private _LJetDir: Vec3 = Vec3.zero;
  private _RJetDir: Vec3 = Vec3.zero;
  private _jetDirection: Vec3 = Vec3.zero;
  private _LJetVal: number = 0;
  private _RJetVal: number = 0;
  private _playerOwner?: Player;
  private _LBtn1Btn2Trigger: Vec3 = Vec3.zero;
  private _RBtn1Btn2Trigger: Vec3 = Vec3.zero;
  private _minBoostThrust: number = 1.0;
  private _minFlightThrust: number = 1.0;
  private _fallRecoveryAlpha: number = 0.02;
  private _combinedJet: Vec3 = Vec3.zero;
  private _storedVelocities: Vec3[] = [];
  private _avgVelocity: Vec3 = Vec3.zero;
  private _impactThreshold: number = 10.0;

  static propsDefinition = {
    showDebug: { type: PropTypes.Boolean, default: false },
    LJetFXObj: { type: PropTypes.Entity },
    RJetFXObj: { type: PropTypes.Entity },
    decel: { type: PropTypes.Number, default: 0.03 },
    accel: { type: PropTypes.Number, default: 0.025 },
    maxBoostSpeed: { type: PropTypes.Number, default: 7.0 },
    maxFlightSpeed: { type: PropTypes.Number, default: 5.0 },
    LeftJet: { type: PropTypes.Entity },
    RightJet: { type: PropTypes.Entity },
  };

  static readonly Events = {
    OnBoostEvent: new CodeBlockEvent<[boostAmount: number, boostDecay: number]>("OnBoostEvent", [
      PropTypes.Number,
      PropTypes.Number,
    ]),
  };

  localPlayer: Player | undefined;
  statsMgrEntity: Entity | undefined;

  override preStart() {
    this.connectLocalBroadcastEvent(World.onUpdate, this.onUpdateDefault.bind(this));

    this.connectNetworkEvent(this.entity, sysEvents.BoostEvent, (data) => {
      this.onBoostEvent(data.boostAmount, data.boostDecay);
    });

    this.connectNetworkEvent(this.entity, AttachEvent, (data) => {
      console.log(`Attach event received for player ${data.player.name.get()}`);
      this.entity.owner.set(data.player);
    });
  }
  override start() {
    if (this.entity.owner.get().id === this.world.getServerPlayer().id) {
      return;
    }

    this.localPlayer = this.entity.owner.get();
    this.statsMgrEntity = getEntityListByTag(ManagerType.StatsManager, this.world)[0];
  }

  public onGrabEvent(ownerID: Player, isInRightHand: boolean) {
    console.log(`Grab event received for player ${ownerID.name.get()}`);
    this._playerOwner = ownerID;
    this.entity.owner.set(this._playerOwner!);
    if (isInRightHand) {
      this._rightHandHolding = true;
    } else {
      this._leftHandHolding = true;
    }
    // LTP. Logic for player movement with jets
  }

  public onReleaseEvent(wasInRightHand: boolean, zeroV: Vec3) {
    console.log(`Release event received`);
    if (wasInRightHand === true) {
      this._rightHandHolding = false;
      this._RBtn1Btn2Trigger = zeroV;
      this._RJetPower = new Vec3(0.0, 0.0, 0.0);
    } else {
      this._leftHandHolding = false;
      this._LBtn1Btn2Trigger = zeroV;
      this._LJetPower = new Vec3(0.0, 0.0, 0.0);
    }
  }

  public onButtonEvent(isRightHand: boolean, b1b2trig: Vec3) {
    if (isRightHand === true) {
      this._RBtn1Btn2Trigger = b1b2trig;
      const thrustDir = this._RBtn1Btn2Trigger.z + this._RBtn1Btn2Trigger.y * -1.0;
      this._RJetPower = new Vec3(thrustDir, this._RJetPower.y, this._RJetPower.z);
    } else {
      this._LBtn1Btn2Trigger = b1b2trig;
      const thrustDir = this._LBtn1Btn2Trigger.z + this._LBtn1Btn2Trigger.y * -1.0;
      this._LJetPower = new Vec3(thrustDir, this._LJetPower.y, this._LJetPower.z);
    }
  }

  private onUpdateDefault({ deltaTime }: { deltaTime: number }) {
    if (!this._playerOwner) return;

    const currentVelocity = this._playerOwner.velocity.get();
    const isAccelerating = currentVelocity.magnitude() > this._avgVelocity.magnitude();
    const changeInVelocity = this._avgVelocity.sub(currentVelocity).magnitude();

    if (changeInVelocity > this._impactThreshold && !isAccelerating) {
      const damage = Math.max(0, Math.floor((changeInVelocity - this._impactThreshold) * 3.0));
      console.warn(`Hard impact detected, damage: ${damage}`);
      this._avgVelocity = Vec3.zero;
      this._storedVelocities = [];
      this.sendNetworkEvent(this.statsMgrEntity!, sysEvents.UpdatePlayerStat, {
      player: this._playerOwner!,
      statType: StatType.health,
      value: -damage,
      });
      playAudio(this, AudioLabel.impact, [this._playerOwner!], this._playerOwner!.position.get());
    }

    //if trigger
    if (this._RJetPower.x === 1.0) {
      this._tmp = clamp(this._RJetPower.y + this.props.accel, this._minFlightThrust, this.props.maxFlightSpeed);
      this._RJetPower = new Vec3(this._RJetPower.x, this._tmp, 0.0);
    }
    //if button
    else if (this._RJetPower.x === -1.0) {
      this._tmp2 = clamp(
        this._RJetPower.z - this.props.accel,
        this.props.maxBoostSpeed * -1.0,
        -1.0 * this._minBoostThrust
      );
      this._RJetPower = new Vec3(this._RJetPower.x, 0.0, this._tmp2);
    }
    //if nothing
    else {
      this._RJetPower = new Vec3(0.0, 0.0, 0.0);
    }
    if (this._LJetPower.x === 1.0) {
      this._tmp2 = clamp(this._LJetPower.y + this.props.accel, this._minFlightThrust, this.props.maxFlightSpeed);
      this._LJetPower = new Vec3(this._LJetPower.x, this._tmp2, 0.0);
    } else if (this._LJetPower.x === -1.0) {
      this._tmp = this.props.accel * 2.0;
      this._tmp2 = clamp(this._LJetPower.z - this._tmp, this.props.maxBoostSpeed * -1.0, -1.0 * this._minBoostThrust);
      this._LJetPower = new Vec3(this._LJetPower.x, 0.0, this._tmp2);
    } else {
      this._LJetPower = new Vec3(0.0, 0.0, 0.0);
    }

    //hover if both trigger and button are pressed, remove vertical component
    this._RJetVal = this._RJetPower.y + this._RJetPower.z;
    this._RJetDir = this.props.RightJet!.forward.get().mul(this._RJetVal);

    this._LJetVal = this._LJetPower.y + this._LJetPower.z;
    this._LJetDir = this.props.LeftJet!.forward.get().mul(this._LJetVal);

    this._jetDirection = this._LJetDir.add(this._RJetDir);
    this._boostAmount = this._boostAmount + (0.0 - this._boostAmount) * this._boostDecay;

    // Determine if the player is hovering (both trigger and button pressed)
    let isHovering = false;
    if (
      (this._RBtn1Btn2Trigger.z && this._RBtn1Btn2Trigger.y) ||
      (this._LBtn1Btn2Trigger.z && this._LBtn1Btn2Trigger.y)
    ) {
      isHovering = true;
    }

    let finalVelocity = new Vec3(0.0, 0.0, 0.0);
    if (isHovering) {
      // If hovering, reduce fall velocity gradually to simulate a hover effect
      this._fallVelocity = Vec3.lerp(this._fallVelocity, new Vec3(0.0, 0.0, 0.0), 0.03);
      this._combinedJet = Vec3.lerp(this._combinedJet, Vec3.zero, 0.03);

      // Apply a small upward force to counteract gravity
      const hoverForce = new Vec3(0.0, 9.8 * deltaTime * 0.1, 0.0); // Adjust the multiplier for stronger/weaker hover
      finalVelocity = this._fallVelocity.add(hoverForce).add(this._combinedJet);
      // this._playerOwner!.velocity.set(finalVelocity);
    }
    // Not hovering, normal jetpack behavior
    else {
      //no jet power, apply gravity
      if (this._jetDirection.equals(Vec3.zero)) {
        // this._fallVelocity = this._fallVelocity.add(new Vec3(0.0, -9.8 * deltaTime, 0.0));
        this._fallVelocity = this._playerOwner!.velocity.get();
        finalVelocity = this._fallVelocity;
      }
      //If there is jet power, apply it to the player's velocity
      else {
        // Determine if jet direction is up or down using dot product with world up vector
        const worldUp = new Vec3(0, 1, 0);
        const jetDirNormalized = this._jetDirection.normalize();
        const dot = jetDirNormalized.dot(worldUp);
        // Only counter fall velocity if jet direction is upwards
        if (dot > -0.4) {
          this._fallVelocity = Vec3.lerp(this._fallVelocity, new Vec3(0.0, 0.0, 0.0), this._fallRecoveryAlpha);
        }

        this._boostDirection = this._jetDirection.normalize().mul(this._boostAmount);
        this._combinedJet = this._jetDirection.add(this._boostDirection);
        finalVelocity = this._combinedJet.add(this._fallVelocity);
      }
    }

    this._storedVelocities.push(finalVelocity);
    if (this._storedVelocities.length > 10) {
      this._storedVelocities.shift(); // Remove the oldest velocity to maintain a max size of 10
    }

    // Average the stored velocities
    this._avgVelocity = Vec3.zero;
    for (const vel of this._storedVelocities) {
      this._avgVelocity = this._avgVelocity.add(vel);
    }
    this._avgVelocity = this._avgVelocity.div(this._storedVelocities.length);

    this._playerOwner!.velocity.set(finalVelocity);


    // this.sendCodeBlockEvent(
    //   this.props.LJetFXObj!,
    //   new CodeBlockEvent<[boolean, Vec3]>("OnUpdateVelocity", [PropTypes.Boolean, PropTypes.Vec3]),
    //   false,
    //   finalVelocity,
    //   // this._LJetDir
    // );
    // this.sendCodeBlockEvent(
    //   this.props.RJetFXObj!,
    //   new CodeBlockEvent<[boolean, Vec3]>("OnUpdateVelocity", [PropTypes.Boolean, PropTypes.Vec3]),
    //   true,
    //   finalVelocity,
    //   // this._RJetDir
    // );
  }

  public onBoostEvent(boostAmount: number, boostDecay: number) {
    this._boostAmount = boostAmount;
    this._boostDecay = boostDecay;
  }
}

Component.register(PlayerJetMovement_ts);
