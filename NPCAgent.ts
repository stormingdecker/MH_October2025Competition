import { Asset, AttachableEntity, AttachablePlayerAnchor, AvatarGripPose, Color, Component, Entity, Handedness, Player, PropTypes, Vec3 } from "horizon/core";
import { Npc, NpcPlayer } from "horizon/npc";
import { KitchenManager, OrderTicket } from "KitchenManager";
import { NavMeshController } from "NavMeshController";
import { debugLog } from "sysHelper";

export enum NPCMovementSpeedID {
  Casual,
  Walk,
  Run,
  DebugSuperFast,
}

export const NPCMovementSpeed: number[] = [1, 2, 4.5, 10];

export enum NPCAnimationID {
  None,
  Sitting,
}

export const sittingAnimationAsset = new Asset(BigInt("1280729506637777"));

export interface NPCChair {
  chairEntity: Entity;
  parentPlayer: Player;
  kitchenManager: KitchenManager;
  assignedToNPC: NPCAgent | undefined;
}

export interface NPCRecipeAssignment {
  chair: NPCChair;
  recipeType: string;
  orderTicket: OrderTicket;
}

// --- State Machine Base Class ---

export abstract class NPCStateMachine {
  protected currentState: number = 0;
  protected parentAgent: NPCAgent | undefined;
  protected debugLogging = false;

  public abstract onAgentReady(agent: NPCAgent, debugLogging: boolean): void;
  public abstract isIdle(): boolean;
  public abstract activate(chair: NPCChair): void;

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
  private spawnPoint?: Entity;

  async start() {
    this.async.setTimeout(() => {
      this.initialize();
    }, 3000);
  }

  async initialize() {
    this.npcGizmo = this.entity.as(Npc);
    if (this.npcGizmo !== undefined) {
      this.npcPlayer = await this.npcGizmo.tryGetPlayer();
      if (this.npcPlayer === undefined) {
        console.error("NPCAgent: Unable to get NpcPlayer from Npc");
        return;
      }
      await this.onReady();
    }
  }

  public async onReady() {
    debugLog(this.props.debugLogging, "NPCAgent: onReady");
    this.startPosition = this.entity.position.get();

    if (this.stateMachine === undefined) {
      console.error("NPCAgent: No state machine assigned");
      return;
    }

    this.stateMachine.onAgentReady(this, this.props.debugLogging);

    let isUpdatingState = false;
    this.async.setInterval(async () => {
      if (!isUpdatingState) {
        isUpdatingState = true;
        await this.stateMachine?.updateState();
        isUpdatingState = false;
      }
    }, 100);
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

  public activate(chair: NPCChair) {
    if (this.stateMachine !== undefined) {
      this.stateMachine.activate(chair);
    }
  }

  public getStartPosition() {
    return this.startPosition;
  }

  public setSpawnPoint(spawnPoint: Entity) {
    this.spawnPoint = spawnPoint;
  }

  public getSpawnPoint() {
    return this.spawnPoint;
  }

  public getNpcPlayer() {
    return this.npcPlayer;
  }

  public teleportToPosition(targetPosition: Vec3) {
    debugLog(this.props.debugLogging, `Teleporting to position: ${targetPosition}`);
    this.npcPlayer?.position.set(targetPosition);
  }

  public async moveToPosition(targetPosition: Vec3, movementSpeedID: NPCMovementSpeedID) {
    debugLog(this.props.debugLogging, `Moving to position: ${targetPosition}`);
    await this.npcPlayer?.moveToPosition(targetPosition, { movementSpeed: NPCMovementSpeed[movementSpeedID] });
  }

  public isPathPossibleAlongNavMesh(targetPosition: Vec3) {
    const currentPosition = this.npcPlayer!.position.get();
    const waypoints = NavMeshController.getWaypointsBetween(currentPosition, targetPosition);
    return waypoints !== undefined && waypoints.length > 0;
  }

  public async moveToPositionUsingNavMesh(targetPosition: Vec3, movementSpeedID: NPCMovementSpeedID) {
    debugLog(this.props.debugLogging, `Moving to position using NavMesh: ${targetPosition}`);
    const currentPosition = this.npcPlayer!.position.get();
    const waypoints = NavMeshController.getWaypointsBetween(currentPosition, targetPosition);
    if (waypoints === undefined || waypoints.length === 0) {
      console.error("No waypoints found, cannot move using NavMesh");
      return;
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
