import { CameraTransitionOptions, Easing } from "horizon/camera";
import {
  CodeBlockEvents,
  Component,
  Entity,
  InteractionInfo,
  Player,
  PlayerDeviceType,
  PropTypes,
  Quaternion,
  TriggerGizmo,
  Vec3,
} from "horizon/core";
import { ProgTaskType } from "RecipeCatalog";
import { sysEvents } from "sysEvents";
import { debugLog, getEntityListByTag, ManagerType } from "sysHelper";
import { oneHudEvents } from "UI_OneHUDEvents";

//T=Trigger Fint=FocusedInteraction
export class TFint_ProgressionTask extends Component<typeof TFint_ProgressionTask> {
  static propsDefinition = {
    showDebug: { type: PropTypes.Boolean, default: false },
  };

  //camera transition options
  private transitionOptions: CameraTransitionOptions = {
    duration: 0.5,
    easing: Easing.EaseInOut,
  };

  private curTaskType = ProgTaskType.DragToProgress;
  private kitchenManager: Entity | null = null;

  private inFocusMode = false;
  private activePlayer!: Player;
  private OneHudEntity: Entity | null = null;
  private subscribedToFintEvents = false;
  //tap variables
  private tapCount = 0;
  //drag variables
  private prevScreenPos: Vec3 | null = null;
  private dragDistance = 0;
  private counter: number = 0; // Throttles progress updates
  private lastProgressTime: number = 0;
  private readonly progressInterval: number = 200; // in ms

  resetValues(){
    this.inFocusMode = false;
    this.activePlayer = undefined!;
    this.subscribedToFintEvents = false;
    this.tapCount = 0;
    this.prevScreenPos = null;
    this.dragDistance = 0;
    this.counter = 0;
    this.lastProgressTime = 0;
  }

  preStart() {
    this.OneHudEntity = getEntityListByTag(ManagerType.UI_OneHUD, this.world)[0];

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, (player: Player) => {
      if (player.deviceType.get() !== PlayerDeviceType.VR) {
        this.OnPlayerEnterTrigger(player);
      } else {
        console.warn(`Player ${player.name.get()} did not satisfy entry conditions`);
      }
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnExitFocusMode, (data) => {
      this.onPlayerExitedFocusMode(data.player);
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnFocusedInteractionInputStarted, (data) => {
      if (!this.subscribedToFintEvents) return;
      switch (this.curTaskType) {
        case ProgTaskType.TapToProgress:
          this.onFintInputStarted_TapTask(data.interactionInfo);
          break;
        case ProgTaskType.DragToProgress:
          this.prevScreenPos = null;
          return;
      }
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnFocusedInteractionInputMoved, (data) => {
      if (!this.subscribedToFintEvents) return;
      switch (this.curTaskType) {
        case ProgTaskType.TapToProgress:
          return; //do nothing
        case ProgTaskType.DragToProgress:
          this.onFintInputMoved_DragTask(data.interactionInfo);
          break;
      }
    });

    this.connectNetworkEvent(this.entity, sysEvents.OnFocusedInteractionInputEnded, (data) => {
      if (!this.subscribedToFintEvents) return;
      switch (this.curTaskType) {
        case ProgTaskType.TapToProgress:
          this.onFintInputEnded_TapTask(data.interactionInfo);
          break;
        case ProgTaskType.DragToProgress:
          return; //do nothing
      }
    });

    this.connectNetworkEvent(this.entity, sysEvents.SetKitchenManager, (data) => {
      this.kitchenManager = data.kitchenManager;
    });
  }

  start() {
    this.activePlayer = this.world.getServerPlayer();
  }

  OnPlayerEnterTrigger(player: Player) {
    this.activePlayer = player;
    this.subscribedToFintEvents = true;
    this.inFocusMode = true;

    //setup camera change
    const curPos = this.entity.position.get();
    const fixedPosition = new Vec3(curPos.x, curPos.y + 2.5, curPos.z).add(this.entity.forward.get().mul(2.5));
    const direction = this.entity.position.get().sub(fixedPosition).normalize();
    const fixedRotation = Quaternion.lookRotation(direction);
    this.sendNetworkEvent(this.activePlayer, sysEvents.OnSetCameraModeFixed, {
      position: fixedPosition,
      rotation: fixedRotation,
    });
    //start focus mode
    this.sendNetworkEvent(player, sysEvents.OnStartFocusMode, {
      requester: this.entity,
    });
  }

  OnPlayerExitTrigger(player: Player) {
  
  }

  onFintInputStarted_TapTask(interactionInfo: InteractionInfo): void {
    this.tapCount++;
    // console.log(`Tap Count: ${this.tapCount}`);

    this.sendProgressEvent(this.tapCount / 10);
  }
  onFintInputStarted_DragTask(interactionInfo: InteractionInfo): void {
    this.prevScreenPos = null;
  }

  onFintInputMoved_DragTask(interactionInfo: InteractionInfo): void {
    if (!this.inFocusMode) return;

    const pos = new Vec3(interactionInfo.screenPosition.x, interactionInfo.screenPosition.y, 0);

    // Track cumulative drag distance
    if (this.prevScreenPos) {
      const delta = pos.sub(this.prevScreenPos).magnitude();
      this.dragDistance += delta;
    }
    this.prevScreenPos = pos;

    // Calculate progress (scaled and rounded)
    const progress = Math.round(this.dragDistance * 2);

    // Debounce progress updates
    const now = Date.now();
    if (progress !== this.counter && now - this.lastProgressTime > this.progressInterval) {
      this.counter = progress;
      this.lastProgressTime = now;
      debugLog(this.props.showDebug, `Drag Progress: ${this.counter}/10`);
      this.sendProgressEvent(this.counter / 10);
    }
    // Exit focus mode after reaching threshold
    if (this.counter >= 10) {
      debugLog(this.props.showDebug, "Drag Distance Threshold Reached — Exiting Focus Mode");
      this.onCompleteTask(this.activePlayer);
    }
  }

  onFintInputEnded_TapTask(interactionInfo: InteractionInfo): void {
    if (this.tapCount >= 10 && this.inFocusMode) {
      this.onCompleteTask(this.activePlayer);
    }
  }

  onPlayerExitedFocusMode(player: Player): void {
    this.resetValues();
  }

  onCompleteTask(player: Player): void {
    switch (this.curTaskType) {
      case ProgTaskType.TapToProgress:
        this.tapCount = 0;
        // this.curTaskType = ProgTaskType.DragToProgress;
        break;
      case ProgTaskType.DragToProgress:
        this.dragDistance = 0;
        this.counter = 0;
        this.prevScreenPos = null;
        // this.curTaskType = ProgTaskType.TapToProgress;
        break;
    }

    this.subscribedToFintEvents = false;
    this.inFocusMode = false;

    this.activePlayer = undefined!;

    this.inFocusMode = false;
    this.subscribedToFintEvents = false;
    this.sendNetworkBroadcastEvent(sysEvents.ForceExitFocusMode, { player: player });
    this.sendNetworkEvent(player, sysEvents.OnSetCameraModeThirdPerson, null);
    // this.sendNetworkEvent(this.OneHudEntity!, oneHudEvents.HideProgressionTask, { players: [player] });

    this.sendNetworkEvent(this.kitchenManager!, sysEvents.UpdateOrderTicketStatus,{
      player: player,
      triggerEntity: this.entity,
    })
  }

  sendProgressEvent(progress: number): void {
    if (!this.OneHudEntity) {
      console.error("No OneHUD entity found");
      return;
    }
    this.sendNetworkEvent(this.OneHudEntity, oneHudEvents.UpdateProgressionTask, {
      players: [this.activePlayer],
      progressAsString: `${progress * 100}`,
    });
  }

  public setTaskType(taskType: string, kitchenManager: Entity): void {
    if (taskType !== ProgTaskType.TapToProgress && taskType !== ProgTaskType.DragToProgress) {
      console.error(`Invalid task type: ${taskType}`);
      return;
    }
    this.curTaskType = taskType;
    this.kitchenManager = kitchenManager;
  }
}
Component.register(TFint_ProgressionTask);
