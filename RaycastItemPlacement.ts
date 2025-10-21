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
  FocusedInteractionTapOptions,
  FocusedInteractionTrailOptions,
  DefaultFocusedInteractionTapOptions,
  DefaultFocusedInteractionTrailOptions,
  NetworkEvent,
  Quaternion,
  CodeBlockEvents,
} from "horizon/core";
import { KitchenApplianceTag } from "KitchenManager";
import { buildModeEvent } from "MoveableBase";
import { PlayerPlotManager } from "PlayerPlotManager";
import { sysEvents } from "sysEvents";
import { getEntityListByTag, getPlayerType, ManagerType } from "sysHelper";
import { getMgrClass } from "sysUtils";
import { animateScaleEvent } from "TweenHandler";
import { Primary_MenuType, Sub_PlotType } from "UI_MenuManager";
import { simpleButtonEvent } from "UI_SimpleButtonEvent";
import { playVFX, VFXLabel } from "VFXManager";

export const damageEvent = new NetworkEvent<{ player: Player; damage: number }>("damageEvent");
export const tryDeleteSelectedItemEvent = new NetworkEvent<{ player: Player }>(
  "tryDeleteSelectedItemEvent"
);
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
    camOffsetRoot: { type: PropTypes.Entity },
    camAttachTarget: { type: PropTypes.Entity },
  };

  //player assigned ownership
  private playerOwner: Player | null = null;

  //tap and trail options
  private currentTapOptions: FocusedInteractionTapOptions = DefaultFocusedInteractionTapOptions;
  private currentTrailOptions: FocusedInteractionTrailOptions =
    DefaultFocusedInteractionTrailOptions;

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

  private selectedItem: Entity | null = null;
  private moveableOffset: Vec3 = Vec3.zero;
  private heightOffset: number = 0;

  private tweenHandler: Entity | null = null;

  //this prevents multiple subscriptions to fint events
  private subscribedToFintEvents = false;

  private activePlot: Entity | undefined = undefined;

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
    });

    this.connectNetworkBroadcastEvent(sysEvents.assignSelectedItem, (data) => {
      console.log("Assign selected item event received");
      if (data.player !== this.playerOwner) return;
      this.selectedItem = data.selected;
    });

    //region focused interaction events
    this.connectLocalBroadcastEvent(PlayerControls.onFocusedInteractionInputStarted, (data) => {
      if (!this.subscribedToFintEvents) return;
      const firstInteraction = data.interactionInfo[0];
      console.log("Focused Interaction Input Started", firstInteraction);
      if (firstInteraction.interactionIndex !== 0) return;

      this.onInputStarted({ interactionInfo: [firstInteraction] });
      playAudio(this, AudioLabel.button);
    });

    this.connectLocalBroadcastEvent(PlayerControls.onFocusedInteractionInputMoved, (data) => {
      if (!this.subscribedToFintEvents) return;
      const firstInteraction = data.interactionInfo[0];
      if (firstInteraction.interactionIndex !== 0) return;

      this.onInputMoved({ interactionInfo: [firstInteraction] });
    });

    this.connectLocalBroadcastEvent(PlayerControls.onFocusedInteractionInputEnded, (data) => {
      if (!this.subscribedToFintEvents) return;
      const firstInteraction = data.interactionInfo[0];
      if (firstInteraction.interactionIndex !== 0) return;

      this.onInputEnded({ interactionInfo: [firstInteraction] });
    });

    //region build mode event
    this.connectNetworkBroadcastEvent(sysEvents.updateMenuContext, (data) => {
      console.log("Build mode event received");
      if (data.player !== this.playerOwner) return;
      if (this.playerOwner?.deviceType.get() === PlayerDeviceType.VR) {
        console.error("VR not supported for camera switching");
        return;
      }

      const isDetailMenu = data.menuContext.length == 3;
      const isSubMenu = data.menuContext.length == 2;

      if (
        data.menuContext[0] === Primary_MenuType.PlotMenu &&
        data.menuContext[1] === Sub_PlotType.BuildMode &&
        !this.isBuildMode
      ) {
        //Enter build mode
        this.sendNetworkBroadcastEvent(buildModeEvent, {
          player: this.playerOwner!,
          inBuildMode: true,
        });

        const cameraRootPos = this.activePlot!.position.get();
        // const playerOffset = this.playerOwner!.position.get().add(new Vec3(-3, 0, 3));
        this.props.camOffsetRoot!.position.set(cameraRootPos);
   
        LocalCamera.setCameraModeAttach(this.props.camAttachTarget!, {});

        this.playerOwner?.enterFocusedInteractionMode();
        this.subscribedToFintEvents = true;
        this.inFocusMode = true;
        playAudio(this, AudioLabel.open);
      } else if (
        this.isBuildMode &&
        !isDetailMenu &&
        data.menuContext[1] !== Sub_PlotType.BuildMode
      ) {
        //End build mode
        //save placements
        this.sendNetworkBroadcastEvent(buildModeEvent, {
          player: this.playerOwner!,
          inBuildMode: false,
        });
        const plotManager =
          getEntityListByTag(ManagerType.PlayerPlotManager, this.world)[0] || null;
        this.sendNetworkEvent(plotManager!, sysEvents.savePlayerPlot, {
          player: this.playerOwner!,
        });

        console.log("Switching to Third Person View");
        LocalCamera.setCameraModeThirdPerson(this.transitionOptions);
        this.async.setTimeout(() => {
          this.playerOwner?.exitFocusedInteractionMode();
          this.subscribedToFintEvents = false;
          this.inFocusMode = false;
          playAudio(this, AudioLabel.close);
        }, 250);
      } else {
        return;
      }
      this.isBuildMode = !this.isBuildMode;

      const plotManager = getEntityListByTag(ManagerType.PlayerPlotManager, this.world)[0] || null;
      this.sendNetworkEvent(plotManager!, sysEvents.toggleBuildingEvent, {
        player: this.playerOwner!,
        enabled: this.isBuildMode,
      });
    });

    this.connectNetworkBroadcastEvent(sysEvents.buildRotateEvent, (data) => {
      if (data.player !== this.playerOwner) return;

      if (this.playerOwner?.deviceType.get() === PlayerDeviceType.VR) {
        console.error("VR not supported for camera switching");
        return;
      }

      if (this.selectedItem) {
        let currentRotation = this.selectedItem.rotation.get();
        const addRotation = Quaternion.fromEuler(new Vec3(0, 90, 0));
        const newRotation = Quaternion.mul(currentRotation, addRotation);
        this.selectedItem.rotation.set(newRotation);
        playAudio(this, AudioLabel.button);
      }
    });

    this.connectNetworkBroadcastEvent(tryDeleteSelectedItemEvent, (data) => {
      if (data.player !== this.playerOwner) return;

      if (this.playerOwner?.deviceType.get() === PlayerDeviceType.VR) {
        console.error("VR not supported for camera switching");
        return;
      }

      this.tryDeleteSelectedItem();
      // playAudio(this, AudioLabel.trash);
    });

    this.connectNetworkEvent(this.playerOwner!, sysEvents.announcePlotOwner, (data) => {
      //FUTURE NOTE: announcePlotOwner will eventually carry PlotOwners or KitchenManagers array

      if (data.plotOwner !== this.playerOwner) return;

      this.activePlot = data.plotBase;
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
      `Hit slot: ${hitEntity ? hitEntity.name.get() : "None"}, Hit point: ${
        hitPoint ? hitPoint.toString() : "None"
      }`
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
        this.selectedItem = null;
      } else if (tags.includes("moveable")) {
        debugLog(this.props.showDebugs, `Hit moveable slot: ${hitEntity.name.get()}`);
        this.selectedItem = hitEntity;
        this.heightOffset = hitEntity.position.get().y;
        // this.sendNetworkEvent(this.moveableItem, placeableOffsetRequest, { requester: this.entity });
        const downScale = 0.9;
        this.selectedItem.scale.set(new Vec3(downScale, downScale, downScale));
      } else {
        debugLog(this.props.showDebugs, "Clearing selected item");
        this.selectedItem = null;
      }
    } else {
      this.selectedItem = null;
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
    if (this.selectedItem) {
      const hitPoint = this.raycastHitPoint(this.planeRaycastGizmo!, touchInfo);
      if (hitPoint) {
        let hitPointRounded = new Vec3(
          this.snapToHalfNoWhole(hitPoint.x),
          this.heightOffset,
          this.snapToHalfNoWhole(hitPoint.z)
        );
        if (this.prevHitPointRounded && !hitPointRounded.equals(this.prevHitPointRounded)) {
          this.selectedItem.position.set(hitPointRounded.add(this.moveableOffset));
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
    if (this.selectedItem) {
      this.selectedItem.position.set(this.selectedItem.position.get());
      this.sendNetworkEvent(this.tweenHandler!, animateScaleEvent, {
        targetEntity: this.selectedItem!,
      });
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

  tryDeleteSelectedItem(): void {
    if (this.selectedItem) {
      const itemToDelete = this.selectedItem;
      this.selectedItem = null;
      const plotManager = getEntityListByTag(ManagerType.PlayerPlotManager, this.world)[0] || null;
      this.sendNetworkEvent(plotManager!, sysEvents.deleteSelectedItemEvent, {
        player: this.playerOwner!,
        selected: itemToDelete,
        alsoSave: true,
      });
    }
  }
}

Component.register(RaycastItemPlacement);

export function debugLog(showDebug: boolean, message: string): void {
  if (showDebug) {
    console.log(message);
  }
}
