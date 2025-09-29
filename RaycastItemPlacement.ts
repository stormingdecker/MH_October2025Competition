// Copyright (c) Dave Mills (uRocketLife). Released under the MIT License.

import { AudioLabel, playAudio } from "AudioManager";
import LocalCamera, { CameraTransitionOptions, Easing } from "horizon/camera";
import {
  Component,
  PropTypes,
  Entity,
  Vec3,
  PlayerControls,
  InteractionInfo,
  RaycastTargetType,
  RaycastGizmo,
  Player,
  PlayerDeviceType,
  PlayerInput,
  PlayerInputAction,
  ButtonIcon,
  ButtonPlacement,
  FocusedInteractionTapOptions,
  FocusedInteractionTrailOptions,
  DefaultFocusedInteractionTapOptions,
  DefaultFocusedInteractionTrailOptions,
  NetworkEvent,
  Quaternion,
  CodeBlockEvents,
} from "horizon/core";
import { buildModeEvent } from "MoveableBase";
import { savePlayerPlot } from "PlayerPlotManager";
import { getEntityListByTag, getPlayerType, ManagerType } from "sysHelper";
import { Tween } from "Tween";
import { TweenAnimation } from "TweenAnimation";
import { TweenClock } from "TweenClock";
import { EasingFunctionGroup, EasingName } from "TweenEasing";
import { animateScaleEvent } from "TweenHandler";
import { ITween, ITweenClock } from "TweenInterfaces";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";
import { playVFX, VFXLabel } from "VFXManager";

export const damageEvent = new NetworkEvent<{ player: Player; damage: number }>("damageEvent");

/**
 *
 */
class RaycastItemPlacement extends Component<typeof RaycastItemPlacement> {
  static propsDefinition = {
    enabled: { type: PropTypes.Boolean, default: true },
    showDebugs: { type: PropTypes.Boolean, default: false },
    autoAssignToOwner: { type: PropTypes.Boolean, default: true },
    //raycast used to select items
    selectionRaycast: { type: PropTypes.Entity },
    //after selected we use the plane raycast to determine placement
    planeRaycast: { type: PropTypes.Entity },
    heightOffset: { type: PropTypes.Number, default: 0 },
    camAttachTarget: { type: PropTypes.Entity },
  };

  //player assigned ownership
  private playerOwner: Player | null = null;

  //tap and trail options
  private currentTapOptions: FocusedInteractionTapOptions = DefaultFocusedInteractionTapOptions;
  private currentTrailOptions: FocusedInteractionTrailOptions = DefaultFocusedInteractionTrailOptions;

  //custom input variables
  private swapInput?: PlayerInput;
  private rotateInput?: PlayerInput;

  //current player interaction state
  private isBuildMode: boolean = false;
  private inFocusMode = false;

  //camera transition options
  private transitionOptions: CameraTransitionOptions = {
    duration: 0.5,
    easing: Easing.EaseInOut,
  };
  //selection raycast gizmo
  private selectionRaycastGizmo: RaycastGizmo | null = null;
  private planeRaycastGizmo: RaycastGizmo | null = null;

  private moveableItem: Entity | null = null;
  private moveableOffset: Vec3 = Vec3.zero;

  private tweenHandler: Entity | null = null;



  //region preStart()
  preStart(): void {
    if (!this.props.enabled) return;

    if (this.props.autoAssignToOwner) {
      this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player) => {
        const playerType = getPlayerType(player, this.world);
        if (playerType === "npc") {
          return;
        } //only assign to human players
        if (!this.playerOwner) {
          this.entity.owner.set(player);
        }
      });
    }

    const isServerOwner = this.entity.owner.get() === this.world.getServerPlayer();
    if (isServerOwner) return;

    this.playerOwner = this.entity.owner.get();

    this.connectNetworkEvent(this.entity, simpleButtonEvent, (data) => {
      // still need a local check
      // if (!this.inFocusMode) {
      //   console.log("Entering Focused Interaction Mode");
      //   this.entity.owner.get().enterFocusedInteractionMode();
      //   this.inFocusMode = true;
      // } else {
      //   console.log("Exiting Focused Interaction Mode");
      //   this.entity.owner.get().exitFocusedInteractionMode();
      //   this.inFocusMode = false;
      // }
    });

    //region focused interaction events
    this.connectLocalBroadcastEvent(PlayerControls.onFocusedInteractionInputStarted, (data) => {
      const firstInteraction = data.interactionInfo[0];
      console.log("Focused Interaction Input Started", firstInteraction);
      if (firstInteraction.interactionIndex !== 0) return;

      this.onInputStarted({ interactionInfo: [firstInteraction] });
      playAudio(this, AudioLabel.button);
    });

    this.connectLocalBroadcastEvent(PlayerControls.onFocusedInteractionInputMoved, (data) => {
      const firstInteraction = data.interactionInfo[0];
      if (firstInteraction.interactionIndex !== 0) return;

      this.onInputMoved({ interactionInfo: [firstInteraction] });
    });

    this.connectLocalBroadcastEvent(PlayerControls.onFocusedInteractionInputEnded, (data) => {
      const firstInteraction = data.interactionInfo[0];
      if (firstInteraction.interactionIndex !== 0) return;

      this.onInputEnded({ interactionInfo: [firstInteraction] });
    });

    //region custom input
    //custom input subscription
    this.swapInput = PlayerControls.connectLocalInput(PlayerInputAction.RightTertiary, ButtonIcon.Swap, this, {
      preferredButtonPlacement: ButtonPlacement.Default,
    });
    this.swapInput.registerCallback((action, pressed) => {
      if (this.playerOwner?.deviceType.get() === PlayerDeviceType.VR) {
        console.error("VR not supported for camera switching");
        return;
      }

      if (pressed) {
        if (!this.isBuildMode) {
          //Enter build mode
          this.sendNetworkBroadcastEvent(buildModeEvent, {
            player: this.playerOwner!,
            inBuildMode: true,
          });
          
          console.log("Switching to First Person View");
          // LocalCamera.setCameraModeFirstPerson(this.transitionOptions);
          LocalCamera.setCameraModeAttach(this.props.camAttachTarget!, {});
          this.playerOwner?.enterFocusedInteractionMode();
          this.inFocusMode = true;
          playAudio(this, AudioLabel.open);
        } else {
          //End build mode
          //save placements
          this.sendNetworkBroadcastEvent(buildModeEvent, {
            player: this.playerOwner!,
            inBuildMode: false,
          });
          const plotManager = getEntityListByTag(ManagerType.PlayerPlotManager, this.world)[0] || null;
          this.sendNetworkEvent(plotManager!, savePlayerPlot, { player: this.playerOwner! });

          console.log("Switching to Third Person View");
          LocalCamera.setCameraModeThirdPerson(this.transitionOptions);
          this.playerOwner?.exitFocusedInteractionMode();
          this.inFocusMode = false;
          playAudio(this, AudioLabel.close);
        }
        this.isBuildMode = !this.isBuildMode;
      }
    });

    this.rotateInput = PlayerControls.connectLocalInput(
      PlayerInputAction.RightSecondary,
      ButtonIcon.MouseScroll,
      this,
      {
        preferredButtonPlacement: ButtonPlacement.Default,
      }
    );
    this.rotateInput.registerCallback((action, pressed) => {
      console.log("Rotate input", action, pressed);
      if (this.playerOwner?.deviceType.get() === PlayerDeviceType.VR) {
        console.error("VR not supported for camera switching");
        return;
      }

      if (pressed && this.moveableItem) {
        let currentRotation = this.moveableItem.rotation.get();
        const addRotation = Quaternion.fromEuler(new Vec3(0, 90, 0));
        const newRotation = Quaternion.mul(currentRotation, addRotation);
        this.moveableItem.rotation.set(newRotation);
        playAudio(this, AudioLabel.button);
      }
    });
  }

  //region start()
  start(): void {
    if (!this.props.enabled) return;

    const isServerOwner = this.entity.owner.get() === this.world.getServerPlayer();
    if (isServerOwner) return;

    this.tweenHandler = getEntityListByTag("TweenHandler", this.world)[0];

    if (this.props.selectionRaycast && this.props.planeRaycast) {
      this.selectionRaycastGizmo = this.props.selectionRaycast.as(RaycastGizmo);
      this.planeRaycastGizmo = this.props.planeRaycast.as(RaycastGizmo);
    } else {
      console.error("Missing raycast props");
    }
  }

  //region onInputStarted()
  private onInputStarted(data: { interactionInfo: InteractionInfo[] }) {
    const touchInfo = data.interactionInfo[0];

    const hitEntity = this.raycastHitTarget(this.selectionRaycastGizmo!, touchInfo);
    const hitPoint = this.raycastHitPoint(this.selectionRaycastGizmo!, touchInfo);
    debugLog(
      this.props.showDebugs,
      `Hit slot: ${hitEntity ? hitEntity.name.get() : "None"}, Hit point: ${hitPoint ? hitPoint.toString() : "None"}`
    );
    //Entity must have tag "item" to be considered in hit
    if (hitEntity) {
      const tags = hitEntity.tags.get();
      if (tags.includes("damageable")) {
        debugLog(this.props.showDebugs, `Hit damageable slot: ${hitEntity.name.get()}`);
        //send damage event
        this.sendNetworkEvent(hitEntity, damageEvent, { player: this.playerOwner, damage: 10 });
        playAudio(this, AudioLabel.impact);
        playVFX(this, VFXLabel.sparkles, [], hitPoint!, Quaternion.zero);
        this.moveableItem = null;
      } else if (tags.includes("moveable")) {
        debugLog(this.props.showDebugs, `Hit moveable slot: ${hitEntity.name.get()}`);
        this.moveableItem = hitEntity;
        // this.sendNetworkEvent(this.moveableItem, placeableOffsetRequest, { requester: this.entity });
        const downScale = 0.9;
        this.moveableItem.scale.set(new Vec3(downScale, downScale, downScale));
      } else {
        debugLog(this.props.showDebugs, "Clearing selected item");
        this.moveableItem = null;
      }
    } else {
      this.moveableItem = null;
    }
  }

  //region onInputMoved()
  // Snap to nearest .5, but never a whole number (e.g., 1.0 becomes 1.5)
  private snapToHalfNoWhole(n: number): number {
    let snapped = Math.floor(n) + 0.5;
    return snapped;
  }

  private snapToWhole(n: number): number {
    return Math.round(n);
  }

  prevHitPointRounded = Vec3.zero;

  private onInputMoved(data: { interactionInfo: InteractionInfo[] }) {
    const touchInfo = data.interactionInfo[0];
    if (this.moveableItem) {
      const hitPoint = this.raycastHitPoint(this.planeRaycastGizmo!, touchInfo);
      if (hitPoint) {
        let hitPointRounded = new Vec3(
          this.snapToWhole(hitPoint.x),
          this.props.heightOffset,
          this.snapToWhole(hitPoint.z)
        );
        if (this.prevHitPointRounded && !hitPointRounded.equals(this.prevHitPointRounded)) {
          this.moveableItem.position.set(hitPointRounded.add(this.moveableOffset));
        }

        this.prevHitPointRounded = hitPointRounded;
      }
    }
  }

  //region onInputEnded()
  private onInputEnded(data: { interactionInfo: InteractionInfo[] }) {
    debugLog(this.props.showDebugs, "Input ended, processing drop...");

    //IF SLOT THEN REQUEST INFO
    const hitSlot = this.raycastHitTarget(this.selectionRaycastGizmo!, data.interactionInfo[0]);
    if (hitSlot) {
    } else {
      //return the object
    }
    if (this.moveableItem) {
      this.moveableItem.position.set(this.moveableItem.position.get());
      this.sendNetworkEvent(this.tweenHandler!, animateScaleEvent, { targetEntity: this.moveableItem! });
    }
  }

  //region raycastHitTarget()
  private raycastHitTarget(ray: RaycastGizmo, interactionInfo: InteractionInfo): Entity | null {
    const hit = ray.raycast(interactionInfo.worldRayOrigin, interactionInfo.worldRayDirection);
    return hit && hit.targetType === RaycastTargetType.Entity ? hit.target : null;
  }

  //region raycastHitPoint()
  private raycastHitPoint(ray: RaycastGizmo, interactionInfo: InteractionInfo): Vec3 | null {
    const hit = ray.raycast(interactionInfo.worldRayOrigin, interactionInfo.worldRayDirection);
    return hit && hit.targetType === RaycastTargetType.Entity ? hit.hitPoint : null;
  }
}

Component.register(RaycastItemPlacement);

export function debugLog(showDebug: boolean, message: string): void {
  if (showDebug) {
    console.log(message);
  }
}
