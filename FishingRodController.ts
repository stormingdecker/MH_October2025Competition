import {
  CodeBlockEvents,
  Component,
  PhysicalEntity,
  PropTypes,
  PhysicsForceMode,
  Vec3,
  NetworkEvent,
  Player,
  LocalEvent,
  ParticleGizmo,
  Entity,
  AttachableEntity,
  AttachablePlayerAnchor,
  AudioGizmo,
} from "horizon/core";

import LocalCamera from "horizon/camera";
import { assertAllNullablePropsSet, debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import { sysEvents } from "sysEvents";
import { randomRotation, scaleVec3, subtractVec3, vecDistance } from "sysUtils";
import { FishingState } from "sysFishing";
import { InventoryManager } from "InventoryManager";
import { InventoryType } from "sysTypes";

class FishingRodController extends Component<typeof FishingRodController> {
  static propsDefinition = {
    bobber: { type: PropTypes.Entity },
    bobberDummy: { type: PropTypes.Entity },
    readyToCastVFX: { type: PropTypes.Entity },
    castUI: { type: PropTypes.Entity },
    launchPoint: { type: PropTypes.Entity },
    castPwr: { type: PropTypes.Number, default: 1 },
    maxCastPwr: { type: PropTypes.Number, default: 10 },
    reelInSpeed: { type: PropTypes.Number, default: 1.5 },
    fishingGameUI: { type: PropTypes.Entity },
    fishingRewardUI: { type: PropTypes.Entity },
    sfxReadyToCast: { type: PropTypes.Entity },
  };

  private showDebugs = true;
  private fishingState!: FishingState;
  private powerCounter = -1;
  private powerDirection = 1;
  private isPoweringUp = false;
  private isReelingIn = false;
  private bobberHasFish = false;
  private tutorialEnabled = false;

  preStart() {
    assertAllNullablePropsSet(this, this.entity.name.get());

    this.connectLocalBroadcastEvent(sysEvents.setFishingState, (data) => {
      this.setFishingState(data.state);
    });

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnGrabStart,
      (right: boolean, player: Player) => {
        //set the player as the new owner of this entity
        this.transferOwnership(this.entity.owner.get(), player);
        this.entity.owner.set(player);

        debugLog(this.showDebugs, `Grab Start. Details: player: ${player}`);

        this.sendNetworkEvent(this.props.castUI!, sysEvents.NewOwnerEvent, {
          newOwner: player,
        });
        this.sendNetworkEvent(this.props.bobber!, sysEvents.NewOwnerEvent, {
          newOwner: player,
        });
        this.sendNetworkEvent(this.props.fishingGameUI!, sysEvents.NewOwnerEvent, {
          newOwner: player,
        });
        this.sendNetworkEvent(this.props.fishingRewardUI!, sysEvents.NewOwnerEvent, {
          newOwner: player,
        });
      }
    );

    //ATTACH TO PLAYER ON RELEASE
    let attachableEntity = this.entity.as(AttachableEntity);
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabEnd, (player: Player) => {
      attachableEntity?.attachToPlayer(player, AttachablePlayerAnchor.Torso);
      this.enableBobber(false);
      this.setFishingState(FishingState.ReadyToCast);
    });

    this.connectCodeBlockEvent(
      //Casting button
      this.entity,
      CodeBlockEvents.OnIndexTriggerDown,
      (player) => {
        this.onTriggerDown(player);
      }
    );

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnIndexTriggerUp, (player) => {
      this.onTriggerUp(player);
    });
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnButton1Down, (player) => {
      debugLog(this.showDebugs, "Button1 Down. Details: player: ${player},");
      // if (this.fishingState === FishingState.Catching) {
      //   this.setFishingState(FishingState.Reeling);
      // }
    });
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnButton1Up, (player) => {
      debugLog(this.showDebugs, "Button1 Up. Details: player: ${player},");
      this.setFishingState(FishingState.ReadyToCast);
    });
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnButton2Down, (player) => {
      debugLog(this.showDebugs, "Button2 Down. Details: player: ${player},");
    });
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnButton2Up, (player) => {
      debugLog(this.showDebugs, "Button2 Up. Details: player: ${player},");
    });

    this.connectLocalBroadcastEvent(sysEvents.tutorialEnabled, (data) => {
      this.enableTutorial();
    });
  }

  start() {
    this.setFishingState(FishingState.ReadyToCast);
  }

  onTriggerDown(player: Player) {
    switch (this.fishingState) {
      case FishingState.ReadyToCast:
        this.isPoweringUp = true;
        this.powerUp();
        break;
      case FishingState.Casting:
        break;
      case FishingState.Reeling:
        this.isReelingIn = true;
        this.reelInBobber();
        break;
      case FishingState.Catching:
        //cancel any active reeling
        this.isReelingIn = false;

        this.sendLocalEvent(this.props.fishingGameUI!, sysEvents.myCatchActionEvent, {
          active: true,
        });
        break;
      case FishingState.CollectingReward:
        if (this.tutorialEnabled) {
          debugLog(this.showDebugs, "No Rewards when tutorial enabled");
          return;
        }
        this.sendLocalEvent(this.props.fishingRewardUI!, sysEvents.myCatchActionEvent, {
          active: true,
        });

        break;
      default:
        break;
    }
  }

  onTriggerUp(player: Player) {
    switch (this.fishingState) {
      case FishingState.ReadyToCast:
        if (this.isPoweringUp) {
          this.cast();
        } else break;
      case FishingState.Casting:
        break;
      case FishingState.Reeling:
        this.isReelingIn = false;

        break;
      case FishingState.Catching:
        this.sendLocalEvent(this.props.fishingGameUI!, sysEvents.myCatchActionEvent, {
          active: false,
        });
        break;
      case FishingState.CollectingReward:
        break;
      default:
        break;
    }
  }

  //region setFishingState()
  setFishingState(state: FishingState) {
    if (this.fishingState === state) return;
    if (state === FishingState.Catching && this.bobberHasFish) {
      return;
    }

    debugLog(this.showDebugs, `Fishing state changed to: ${FishingState[state]}`);

    switch (state) {
      case FishingState.ReadyToCast:
        this.disableAnyActiveTutorial();
        this.enableBobber(false);
        this.showReadyToCastVFX();
        this.playReadyToCastSFX();
        this.bobberHasFish = false;
        this.fishingState = FishingState.ReadyToCast;
        break;
      case FishingState.Casting:
        this.async.setTimeout(() => {
          this.setFishingState(FishingState.Reeling);
        }, 100);

        this.fishingState = FishingState.Casting;
        break;
      case FishingState.Reeling:
        this.fishingState = FishingState.Reeling;
        break;
      case FishingState.Catching:
        this.isReelingIn = false; //this prevents continuous reeling when catching starts
        this.fishingState = FishingState.Catching;
        break;
      case FishingState.Caught:
        this.fishingState = FishingState.Caught;
        this.bobberHasFish = true;
        this.async.setTimeout(() => {
          this.setFishingState(FishingState.Reeling);
        }, 500);
        break;
      case FishingState.CollectingReward:
        this.fishingState = FishingState.CollectingReward;
        const inventoryEntity = getEntityListByTag(ManagerType.InventoryManager, this.world)[0];
        this.sendNetworkEvent(inventoryEntity!, sysEvents.UpdatePlayerInventory, {
          player: this.entity.owner.get(),
          item: InventoryType.fish,
          quantity: 1,
          sender: this.entity,
        });
        this.setFishingState(FishingState.ReadyToCast);
        break;
      default:
        break;
    }

    this.sendLocalBroadcastEvent(sysEvents.fishingStateChanged, {
      state: this.fishingState,
    });
  }

  showReadyToCastVFX() {
    this.props.readyToCastVFX!.position.set(this.props.bobberDummy!.position.get());
    this.props.readyToCastVFX!.as(ParticleGizmo).play();
  }
  playReadyToCastSFX() {
    this.props.sfxReadyToCast!.position.set(this.props.bobberDummy!.position.get());
    this.props.sfxReadyToCast!.as(AudioGizmo).play();
  }

  private disableAnyActiveTutorial() {
    this.enableTutorial(false);
  }
  private enableTutorial(enabled: boolean = true) {
    this.tutorialEnabled = enabled;
  }

  private enableBobber(enabled: boolean) {
    if (this.props.bobber !== undefined) {
      this.props.bobber.visible.set(enabled);
      if (enabled) {
        this.props.bobber.position.set(this.props.launchPoint!.position.get());
      } else {
        this.props.bobber.position.set(new Vec3(0, -10, 0));
      }
      const physicalEntity = this.props.bobber.as(PhysicalEntity);
      physicalEntity.gravityEnabled.set(enabled);
      physicalEntity.zeroVelocity();
    }
    if (this.props.bobberDummy !== undefined) {
      this.props.bobberDummy.visible.set(!enabled);
    }
  }

  private powerUp() {
    if (!this.isPoweringUp) {
      return;
    }
    this.powerCounter += this.powerDirection;
    if (this.powerCounter >= this.props.maxCastPwr) {
      this.powerCounter = this.props.maxCastPwr;
      this.powerDirection = -1;
    } else if (this.powerCounter <= 0) {
      this.powerCounter = 0;
      this.powerDirection = 1;
    }

    //Send the power counter to the cast UI
    if (this.props.castUI !== undefined) {
      this.sendNetworkEvent(this.props.castUI, sysEvents.myCastPowerEvent, {
        power: this.powerCounter,
      });
    }

    this.async.setTimeout(() => {
      this.powerUp();
    }, 100);
  }

  private cast() {
    // console.log(`Casting with power: ${this.powerCounter}`);
    this.isPoweringUp = false;

    if (this.props.bobber !== undefined) {
      //Enable the bobber
      this.enableBobber(true);

      // let aimDirection = this.world.getLocalPlayer().head.forward.get();
      let aimDirection = LocalCamera.forward.get();
      aimDirection.y = 0.5;
      const forceVector = scaleVec3(aimDirection, this.powerCounter);

      const launchPosition = this.props.launchPoint!.position.get();
      const physicalEntity = this.props.bobber.as(PhysicalEntity);

      //move bobber position to the end of the fishing rod
      physicalEntity.position.set(launchPosition);
      //get a random rotation
      physicalEntity.rotation.set(randomRotation());
      physicalEntity.applyForce(forceVector, PhysicsForceMode.VelocityChange);
      //add a rotation to the bobber
      const randomVec3 = new Vec3(0, -1.25, 1);
      physicalEntity.applyTorque(scaleVec3(randomVec3, 4));

      this.setFishingState(FishingState.Casting);
    }

    this.resetPower();
  }

  private resetPower() {
    //reset power counter
    this.powerCounter = -1;

    if (this.props.castUI !== undefined) {
      this.sendNetworkEvent(this.props.castUI, sysEvents.myCastPowerEvent, {
        power: this.powerCounter,
      });
    }
  }

  //region reelInBobber()
  private reelInBobber() {
    const physicalEntity = this.props.bobber!.as(PhysicalEntity);
    //move bobber position closer to the player
    const playerPosition = this.world.getLocalPlayer().position.get();
    const bobberPosition = physicalEntity.position.get();

    //if distance is less than 1, stop reeling in
    if (vecDistance(playerPosition, bobberPosition) < 1.75) {
      this.enableBobber(false);
      this.isReelingIn = false;
      //decide
      if (this.bobberHasFish) {
        this.setFishingState(FishingState.CollectingReward);
      } else {
        this.setFishingState(FishingState.ReadyToCast);
      }
      return;
    }

    const direction = subtractVec3(playerPosition, bobberPosition).normalize();
    const forceVector = scaleVec3(direction, this.props.reelInSpeed);
    physicalEntity.applyForce(forceVector, PhysicsForceMode.VelocityChange);

    if (this.isReelingIn) {
      this.async.setTimeout(() => {
        this.reelInBobber();
      }, 100);
    }
  }
}

Component.register(FishingRodController);
