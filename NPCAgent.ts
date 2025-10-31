import { Asset, AttachableEntity, AttachablePlayerAnchor, AvatarGripPose, AvatarPoseGizmo, AvatarPoseUseMode, Color, Component, Entity, Handedness, MeshEntity, Player, PropTypes, TextureAsset, Vec3, World } from "horizon/core";
import { Npc, NpcPlayer } from "horizon/npc";
import { KitchenManager } from "KitchenManager";
import { NavMeshController } from "NavMeshController";
import { debugLog } from "sysHelper";
import { pieTypes } from "sysTypes";

export enum NPCMovementSpeedID {
  Casual,
  Walk,
  Run,
  DebugSuperFast,
}

export const NPCMovementSpeed: number[] = [1, 3, 4.5, 10];

export enum NPCAnimationID {
  None,
  Sitting,
}

export const sittingAnimationAsset = new Asset(BigInt("1280729506637777"));

export interface NPCChair {
  chairEntity: Entity;
  tableEntity: Entity;
  seatPosition: Vec3;
  avatarPose?: AvatarPoseGizmo;
  parentPlayer: Player;
  inUseByPlayer: Player | undefined;
  plotBaseEntity: Entity;
  kitchenManager: KitchenManager;
  assignedToNPC: NPCAgent | undefined;
}

export interface NPCStall {
  stallEntity: Entity;
}

// --- NPC Want Icon ---

export class NPCWantIcon extends Component<typeof NPCWantIcon> {
  private meshEntity?: MeshEntity;

  override start() {
    this.meshEntity = this.entity.as(MeshEntity);
    this.meshEntity.visible.set(false);
  }

  public setPieType(pieType: string) {
    const foundPieType = pieTypes.find((pie) => pie.name === pieType);
    if (!foundPieType) {
      console.error(`NPCWantIcon: No pie type found for ${pieType}`);
      return;
    }

    const textureAsset = new TextureAsset(BigInt(foundPieType.imageAssetID));
    this.meshEntity!.setTexture(textureAsset);
    this.meshEntity!.visible.set(true);
  }

  public hideIcon() {
    this.meshEntity!.visible.set(false);
  }
}
Component.register(NPCWantIcon);

// --- State Machine Base Class ---

export abstract class NPCStateMachine {
  protected currentState: number = 0;
  protected parentAgent: NPCAgent | undefined;
  protected debugLogging = false;
  protected stateStartTime: number = 0;

  public abstract onAgentReady(agent: NPCAgent, debugLogging: boolean): void;
  public abstract isIdle(): boolean;

  protected setCurrentState(state: number) {
    this.currentState = state;
    this.stateStartTime = Date.now();
  }

  protected getStateDurationSeconds(): number {
    return (Date.now() - this.stateStartTime) / 1000;
  }

  public activateClient(chair: NPCChair) {}
  public onOrderServed(player: Player, servableFoodEntity: Entity): void {}

  public activateMerchant(stall: NPCStall) {}

  public async updateState(): Promise<void> {}
}

// --- NPC Agent ---

export class NPCAgent extends Component<typeof NPCAgent> {
  static propsDefinition = {
    stateMachineName: { type: PropTypes.String, default: "" },
    debugLogging: { type: PropTypes.Boolean, default: false },
  };

  private npcGizmo?: Npc;
  private npcPlayer?: NpcPlayer;
  private stateMachine?: NPCStateMachine;
  private startPosition = Vec3.zero;
  private isForcedReturnHome = false;
  private initializationHandle: number | undefined;
  private isInitializing = false;
  private wantIcon?: NPCWantIcon;

  override preStart(): void {
    this.npcGizmo = this.entity.as(Npc);
  }

  async start() {
    this.initializationHandle = this.async.setInterval(() => {
      if (!this.isInitializing) {
        this.initialize();
      }
    }, 5000);
  }

  public getWantIcon() {
    if (this.wantIcon === undefined) {
      this.wantIcon = this.findWantIconComponent(this.entity);
      if (this.wantIcon === undefined) {
        console.error(`NPCAgent: No NPCWantIcon component found for ${this.entity.name.get()}`);
        return;
      }
    }
    return this.wantIcon;
  }

  async initialize() {
    this.isInitializing = true;
    if (this.npcGizmo !== undefined) {
      //this.npcGizmo.spawnPlayer().then(async (result) => {
      //if (result !== NpcPlayerSpawnResult.Success) {
      //console.error(`NPCAgent: Failed to spawn NPC Player for ${this.entity.name.get()} with status:`, result);
      //this.isInitializing = false;
      //return;
      //}
      this.npcPlayer = await this.npcGizmo!.tryGetPlayer();
      if (this.npcPlayer === undefined) {
        console.error(`NPCAgent: Unable to get NpcPlayer for ${this.entity.name.get()}`);
        this.isInitializing = false;
        return;
      }
      debugLog(this.props.debugLogging, `NPCAgent: Successfully spawned NPC Player for ${this.entity.name.get()}`);
      this.async.clearInterval(this.initializationHandle!);
      this.initializationHandle = undefined;
      this.isInitializing = false;
      await this.onReady();
      //});
    }
  }

  private onWorldUpdate() {
    if (this.wantIcon !== undefined) {
      const parentEntity = this.wantIcon.entity.parent.get() ?? undefined;
      if (parentEntity !== undefined) {
        const npcPosition = this.npcPlayer?.position.get() || Vec3.zero;
        parentEntity.position.set(npcPosition.add(new Vec3(0, 1.25, 0)));
      }
    }
  }

  private findWantIconComponent(rootEntity: Entity): NPCWantIcon | undefined {
    const wantIconComponents = rootEntity.getComponents(NPCWantIcon);
    if (wantIconComponents.length > 0) {
      return wantIconComponents[0];
    }
    const children = rootEntity.children.get();
    for (const child of children) {
      const wantIconComponent = this.findWantIconComponent(child);
      if (wantIconComponent !== undefined) {
        return wantIconComponent;
      }
    }
    return undefined;
  }

  public async onReady() {
    this.startPosition = this.entity.position.get();

    if (this.stateMachine === undefined) {
      console.error(`NPCAgent: No state machine assigned for agent ${this.entity.name.get()}`);
      return;
    }

    this.stateMachine.onAgentReady(this, this.props.debugLogging);

    this.connectLocalBroadcastEvent(World.onUpdate, () => this.onWorldUpdate());

    let isUpdatingState = false;
    this.async.setInterval(async () => {
      if (!isUpdatingState) {
        isUpdatingState = true;
        await this.stateMachine?.updateState();
        isUpdatingState = false;
      }
    }, 100);
  }

  public getIsForcedReturnHome() {
    return this.isForcedReturnHome;
  }

  public forceReturnHome(forced: boolean) {
    this.isForcedReturnHome = forced;
  }

  public getStateMachineName() {
    return this.props.stateMachineName;
  }

  public setStateMachine(stateMachine: NPCStateMachine) {
    this.stateMachine = stateMachine;
  }

  public isIdle() {
    if (this.stateMachine !== undefined) {
      return this.stateMachine.isIdle();
    }
    return false;
  }

  public activateClient(chair: NPCChair, activePlayers: Player[]) {
    if (this.stateMachine !== undefined) {
      this.assignChair(chair, activePlayers);
      this.stateMachine.activateClient(chair);
    }
  }

  public activateMerchant(stall: NPCStall) {
    if (this.stateMachine !== undefined) {
      this.stateMachine.activateMerchant(stall);
    }
  }

  public assignChair(chair: NPCChair, activePlayers: Player[]) {
    chair.assignedToNPC = this;
    if (chair.avatarPose !== undefined) {
      chair.avatarPose.setCanUseForPlayers(activePlayers, AvatarPoseUseMode.DisallowUse);
    }
  }

  public releaseChair(chair: NPCChair) {
    if (chair.avatarPose !== undefined) {
      chair.avatarPose.resetCanUseForPlayers();
    }
    chair.assignedToNPC = undefined;
  }

  public onOrderServed(player: Player, servableFoodEntity: Entity) {
    debugLog(this.props.debugLogging, `NPCAgent: onOrderServed called for player ${player.name.get()}`);
    if (this.stateMachine !== undefined) {
      this.stateMachine.onOrderServed(player, servableFoodEntity);
    }
  }

  public getStartPosition() {
    return this.startPosition;
  }

  public getNpcPlayer() {
    return this.npcPlayer;
  }

  public teleportToPosition(targetPosition: Vec3) {
    debugLog(this.props.debugLogging, `Teleporting to position: ${targetPosition}`);
    this.npcPlayer?.position.set(targetPosition);
  }

  public async moveToPosition(targetPosition: Vec3, movementSpeedID: NPCMovementSpeedID, giveUpAfterSeconds: number = 0) {
    debugLog(this.props.debugLogging, `Moving to position: ${targetPosition}`);
    if (giveUpAfterSeconds > 0) {
      this.async.setTimeout(() => {
        debugLog(this.props.debugLogging, `Giving up on moving to position: ${targetPosition}`);
        this.npcPlayer?.stopMovement();
      }, giveUpAfterSeconds * 1000);
    }
    await this.npcPlayer?.moveToPosition(targetPosition, { movementSpeed: NPCMovementSpeed[movementSpeedID] });
  }

  public isPathPossibleAlongNavMesh(targetPosition: Vec3) {
    const currentPosition = this.npcPlayer!.position.get();
    const waypoints = NavMeshController.getWaypointsBetween(currentPosition, targetPosition);
    return waypoints !== undefined && waypoints.length > 0;
  }

  public async moveToPositionUsingNavMesh(targetPosition: Vec3, movementSpeedID: NPCMovementSpeedID, giveUpAfterSeconds: number = 0) {
    debugLog(this.props.debugLogging, `Moving to position using NavMesh: ${targetPosition}`);
    const currentPosition = this.npcPlayer!.position.get();
    const waypoints = NavMeshController.getWaypointsBetween(currentPosition, targetPosition);
    if (waypoints === undefined || waypoints.length === 0) {
      console.error("No waypoints found, cannot move using NavMesh");
      return;
    }
    if (giveUpAfterSeconds > 0) {
      this.async.setTimeout(() => {
        debugLog(this.props.debugLogging, `Giving up on moving to position: ${targetPosition}`);
        this.npcPlayer?.stopMovement();
      }, giveUpAfterSeconds * 1000);
    }
    await this.npcPlayer?.moveToPositions(waypoints, { movementSpeed: NPCMovementSpeed[movementSpeedID] });
  }

  public async rotateTowardsPosition(targetPosition: Vec3) {
    const currentPosition = this.npcPlayer!.position.get();
    debugLog(this.props.debugLogging, `Rotating towards position: ${targetPosition} from ${currentPosition}`);
    const lookDirection = targetPosition.sub(currentPosition);
    await this.npcPlayer?.rotateTo(lookDirection, { rotationSpeed: 360 });
  }

  public stopMovement() {
    debugLog(this.props.debugLogging, `Stopping movement`);
    this.npcPlayer?.stopMovement();
  }

  public lookAtPosition(position: Vec3) {
    debugLog(this.props.debugLogging, `Looking at position: ${position}`);
    this.npcPlayer?.setLookAtTarget(position);
  }

  public clearLookAt() {
    debugLog(this.props.debugLogging, `Clearing look at target`);
    this.npcPlayer?.clearLookAtTarget();
  }

  public async grabEntity(entity: Entity) {
    debugLog(this.props.debugLogging, `Grabbing entity: ${entity.name.get()}`);
    await this.npcPlayer?.grab(Handedness.Right, entity);
  }

  public dropEntity() {
    debugLog(this.props.debugLogging, `Dropping entity`);
    this.npcPlayer?.drop(Handedness.Right);
  }

  public attachEntityToAnchor(entity: Entity, anchor: AttachablePlayerAnchor) {
    debugLog(this.props.debugLogging, `Attaching entity: ${entity.name.get()} to anchor: ${AttachablePlayerAnchor[anchor]}`);
    const attachable = entity.as(AttachableEntity);
    attachable.attachToPlayer(this.npcPlayer!, anchor);
  }

  public detachEntity(entity: Entity) {
    debugLog(this.props.debugLogging, `Detaching entity: ${entity.name.get()}`);
    const attachable = entity.as(AttachableEntity);
    attachable.detach();
  }

  public setAvatarPose(pose: AvatarGripPose) {
    debugLog(this.props.debugLogging, `Setting avatar pose: ${AvatarGripPose[pose]}`);
    this.npcPlayer?.setAvatarGripPoseOverride(pose);
  }

  public clearAvatarPose() {
    debugLog(this.props.debugLogging, `Clearing avatar pose`);
    this.npcPlayer?.clearAvatarGripPoseOverride();
  }

  public async speakLine(conversationLine: string) {
    debugLog(this.props.debugLogging, `Speaking line: ${conversationLine}`);
    await this.npcGizmo?.conversation.speak(conversationLine);
  }

  public async showAIConversation(instruction: string, eventPerception?: string, dynamicContextKey?: string, dynamicContextValue?: string) {
    debugLog(this.props.debugLogging, `Showing AI conversation: ${instruction}`);
    if (eventPerception !== undefined) {
      await this.npcGizmo?.conversation.addEventPerception(eventPerception);
    }
    if (dynamicContextKey !== undefined && dynamicContextValue !== undefined) {
      await this.npcGizmo?.conversation.setDynamicContext(dynamicContextKey, dynamicContextValue);
    }
    await this.npcGizmo?.conversation.elicitResponse(instruction);
  }

  public showPopupConversation(player: Player, conversationLine: string) {
    debugLog(this.props.debugLogging, `Showing popup conversation to player ${player.name.get()}: ${conversationLine}`);
    this.world.ui.showPopupForPlayer(player, conversationLine, 6, {
      fontSize: 2,
      fontColor: new Color(255, 255, 255),
      backgroundColor: new Color(0, 0, 0),
      position: new Vec3(0, -0.3, -0.5),
    });
  }

  public playAvatarAnimation(animationID: NPCAnimationID) {
    debugLog(this.props.debugLogging, `Playing avatar animation: ${NPCAnimationID[animationID]}`);
    switch (animationID) {
      case NPCAnimationID.None:
        this.npcPlayer?.stopAvatarAnimation();
        break;
      case NPCAnimationID.Sitting:
        this.npcPlayer?.playAvatarAnimation(sittingAnimationAsset, { looping: true });
        break;
    }
  }

  public isPlayerThisNPC(player: Player) {
    return this.npcPlayer?.id === player.id;
  }

  public static isPlayerAnNPC(player: Player) {
    return player.id > 10000;
  }
}
Component.register(NPCAgent);
