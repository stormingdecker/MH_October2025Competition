import { Asset, AttachableEntity, AttachablePlayerAnchor, AvatarGripPose, AvatarPoseGizmo, Color, Component, Entity, Handedness, Player, PropTypes, Vec3 } from "horizon/core";
import { Npc, NpcPlayer } from "horizon/npc";
import { NavMeshController } from "NavMeshController";
import { debugLog } from "sysHelper";

// --- World Greeter NPC State Machine ---

enum NPCMovementSpeedID {
  Casual,
  Walk,
  Run,
  DebugSuperFast,
}

const NPCMovementSpeed: number[] = [1, 2, 4.5, 10];

// --- World Greeter NPC State Machine ---

enum NPCAnimationID {
  None,
  Sitting,
}

const sittingAnimationAsset = new Asset(BigInt("1280729506637777"));

// --- State Machine Base Class ---

abstract class NPCStateMachine {
  protected currentState: number = 0;
  protected parentAgent: NPCAgent | undefined;
  protected debugLogging = false;

  public abstract onAgentReady(agent: NPCAgent, debugLogging: boolean): void;

  public async updateState(): Promise<void> {}
}

// --- World Greeter NPC State Machine ---

enum NPCStates_WorldGreeter {
  Initializing,
  WaitingForPlayerToApproach,
  TurnTowardsPlayer,
  GreetingPlayer,
  MovingToPlayer,
  TellingPlayerAboutWorld,
  ReturningToStartPosition,
}

const NPC_MIN_DISTANCE_TO_PLAYER = 1.5;
const NPC_MAX_DISTANCE_TO_PLAYER = 8;

class NPCStateMachine_WorldGreeter extends NPCStateMachine {
  private alreadyGreetedPlayers: Player[] = [];
  private targetPlayer: Player | undefined;

  public override onAgentReady(agent: NPCAgent, debugLogging: boolean) {
    this.debugLogging = debugLogging;
    debugLog(this.debugLogging, "StateMachine_WorldGreeter: onAgentReady");
    this.parentAgent = agent;
    this.currentState = NPCStates_WorldGreeter.WaitingForPlayerToApproach;
  }

  public override async updateState() {
    switch (this.currentState) {
      case NPCStates_WorldGreeter.Initializing: {
        break;
      }
      case NPCStates_WorldGreeter.WaitingForPlayerToApproach: {
        const players = this.parentAgent!.world.getPlayers();
        for (const player of players) {
          if (this.alreadyGreetedPlayers.includes(player)) {
            continue;
          }
          const playerDistance = player.position.get().distance(this.parentAgent!.entity.position.get());
          if (playerDistance > NPC_MIN_DISTANCE_TO_PLAYER && playerDistance < NPC_MAX_DISTANCE_TO_PLAYER) {
            debugLog(this.debugLogging, `StateMachine_WorldGreeter: Player ${player.name.get()} is within greeting distance (${playerDistance.toFixed(2)}m)`);
            this.targetPlayer = player;
            this.currentState = NPCStates_WorldGreeter.TurnTowardsPlayer;
            break;
          }
        }
        break;
      }
      case NPCStates_WorldGreeter.TurnTowardsPlayer: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Turning towards player`);
        await this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.currentState = NPCStates_WorldGreeter.GreetingPlayer;
        break;
      }
      case NPCStates_WorldGreeter.GreetingPlayer: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Greeting player`);
        const playerName = this.targetPlayer!.name.get();
        await this.parentAgent!.showAIConversation(`Quickly greet player named ${playerName}`, "NPC has noticed player approaching");
        this.currentState = NPCStates_WorldGreeter.MovingToPlayer;
        break;
      }
      case NPCStates_WorldGreeter.MovingToPlayer: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Moving to player`);
        // Move to a position in front of the player
        const targetPosition = this.targetPlayer!.position.get().add(this.targetPlayer!.forward.get().mul(NPC_MIN_DISTANCE_TO_PLAYER));
        await this.parentAgent!.moveToPosition(targetPosition, NPCMovementSpeedID.Run);
        await this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.currentState = NPCStates_WorldGreeter.TellingPlayerAboutWorld;
        break;
      }
      case NPCStates_WorldGreeter.TellingPlayerAboutWorld: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Telling player about world`);
        await this.parentAgent!.showAIConversation(`Tell that this colorful restaurant tycoon world is going to win the contest`);
        this.currentState = NPCStates_WorldGreeter.ReturningToStartPosition;
        break;
      }
      case NPCStates_WorldGreeter.ReturningToStartPosition: {
        debugLog(this.debugLogging, `StateMachine_WorldGreeter: Returning to start position`);
        const startPosition = this.parentAgent!.getStartPosition();
        await this.parentAgent!.rotateTowardsPosition(startPosition);
        await this.parentAgent!.moveToPosition(startPosition, NPCMovementSpeedID.Run);
        await this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.alreadyGreetedPlayers.push(this.targetPlayer!);
        this.targetPlayer = undefined;
        this.currentState = NPCStates_WorldGreeter.WaitingForPlayerToApproach;
        break;
      }
    }
  }
}

// --- Gourmet NPC State Machine ---

const PossibleFoodItems = ["Coffee", "Cake", "Vegetables"];

enum NPCStates_Gourmet {
  Initializing,
  DecideOnFoodItem,
  WalkToSeat,
  Sit,
  WaitToBeServed,
  ReturningToStartPosition,
}

class NPCStateMachine_Gourmet extends NPCStateMachine {
  private wantedFoodItemIndex = -1;
  private assignedSeat: Entity | undefined;
  private targetTable: Entity | undefined;

  public override onAgentReady(agent: NPCAgent, debugLogging: boolean) {
    this.debugLogging = debugLogging;
    debugLog(this.debugLogging, "StateMachine_Gourmet: onAgentReady");
    this.parentAgent = agent;
    this.currentState = NPCStates_Gourmet.DecideOnFoodItem;
  }

  public override async updateState() {
    switch (this.currentState) {
      case NPCStates_Gourmet.Initializing: {
        break;
      }

      case NPCStates_Gourmet.DecideOnFoodItem: {
        this.wantedFoodItemIndex = Math.floor(Math.random() * PossibleFoodItems.length);
        debugLog(this.debugLogging, `Gourmet NPC wants to order: ${PossibleFoodItems[this.wantedFoodItemIndex]}`);
        const seatEntities = this.parentAgent?.world.getEntitiesWithTags(["ServiceTableSeat"]);
        if (seatEntities !== undefined && seatEntities.length > 0) {
          this.assignedSeat = seatEntities[0].as(AvatarPoseGizmo);
        }
        this.currentState = NPCStates_Gourmet.WalkToSeat;
        break;
      }
      case NPCStates_Gourmet.WalkToSeat: {
        debugLog(this.debugLogging, `Gourmet NPC walking to seat`);
        await this.parentAgent!.rotateTowardsPosition(this.assignedSeat!.position.get());
        //await this.parentAgent!.moveToPosition(this.assignedSeat!.position.get(), NPCMovementSpeedID.Walk);
        await this.parentAgent!.moveToPositionUsingNavMesh(this.assignedSeat!.position.get(), NPCMovementSpeedID.Walk);
        const tableEntities = this.parentAgent?.world.getEntitiesWithTags(["ServiceTable"]);
        if (tableEntities !== undefined && tableEntities.length > 0) {
          this.targetTable = tableEntities[0].as(AvatarPoseGizmo);
          await this.parentAgent!.rotateTowardsPosition(this.targetTable.position.get());
        }
        this.currentState = NPCStates_Gourmet.Sit;
        break;
      }
      case NPCStates_Gourmet.Sit: {
        debugLog(this.debugLogging, `Gourmet NPC sitting down`);
        this.parentAgent?.playAvatarAnimation(NPCAnimationID.Sitting);
        await this.parentAgent!.showAIConversation(`I'm ready to order ${PossibleFoodItems[this.wantedFoodItemIndex]}`);
        this.currentState = NPCStates_Gourmet.WaitToBeServed;
        break;
      }
      /*
      case NPCStates_Gourmet.WaitToBeServed: {
        // Move to a position in front of the player
        const targetPosition = this.targetPlayer!.position.get().add(this.targetPlayer!.forward.get().mul(NPC_MIN_DISTANCE_TO_PLAYER));
        await this.parentAgent!.moveToPosition(targetPosition);
        await this.parentAgent!.rotateTowardsPosition(this.targetPlayer!.position.get());
        this.currentState = NPCStates_Gourmet.WaitToBeServed;
        break;
      }
      case NPCStates_Gourmet.WaitToBeServed: {
        await this.parentAgent!.showAIConversation(`Please wait to be served`);
        this.currentState = NPCStates_Gourmet.ReturningToStartPosition;
        break;
      }
      case NPCStates_Gourmet.ReturningToStartPosition: {
        const startPosition = this.parentAgent!.getStartPosition();
        await this.parentAgent!.rotateTowardsPosition(startPosition);
        await this.parentAgent!.moveToPosition(startPosition);
        this.assignedSeat = undefined;
        this.currentState = NPCStates_Gourmet.DecideOnFoodItem;
        break;
      }
*/
    }
  }
}

// --- NPC Agent ---

class NPCAgent extends Component<typeof NPCAgent> {
  static propsDefinition = {
    useStateMachineWorldGreeter: { type: PropTypes.Boolean, default: false },
    useStateMachineGourmet: { type: PropTypes.Boolean, default: false },
    debugLogging: { type: PropTypes.Boolean, default: false },
  };

  private npcGizmo: Npc | undefined;
  private npcPlayer: NpcPlayer | undefined;
  private startPosition = Vec3.zero;
  private stateMachine: NPCStateMachine | undefined;

  async start() {
    this.async.setTimeout(() => {
      this.initialize();
    }, 3000);
  }

  async initialize() {
    this.npcGizmo = this.entity.as(Npc);
    if (this.npcGizmo !== undefined) {
      this.startPosition = this.entity.position.get();
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
    if (this.props.useStateMachineWorldGreeter) {
      this.stateMachine = new NPCStateMachine_WorldGreeter();
    } else if (this.props.useStateMachineGourmet) {
      this.stateMachine = new NPCStateMachine_Gourmet();
    }

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

  public getStartPosition() {
    return this.startPosition;
  }

  public getNpcPlayer() {
    return this.npcPlayer;
  }

  public async moveToPosition(targetPosition: Vec3, movementSpeedID: NPCMovementSpeedID) {
    debugLog(this.props.debugLogging, `Moving to position: ${targetPosition}`);
    await this.npcPlayer?.moveToPosition(targetPosition, { movementSpeed: NPCMovementSpeed[movementSpeedID] });
  }

  public async moveToPositionUsingNavMesh(targetPosition: Vec3, movementSpeedID: NPCMovementSpeedID) {
    debugLog(this.props.debugLogging, `Moving to position using NavMesh: ${targetPosition}`);
    const currentPosition = this.entity.position.get();
    const waypoints = NavMeshController.getWaypointsBetween(currentPosition, targetPosition);
    if (waypoints === undefined || waypoints.length === 0) {
      console.error("No waypoints found, cannot move using NavMesh");
      return;
    }

    await this.npcPlayer?.moveToPositions(waypoints, { movementSpeed: NPCMovementSpeed[movementSpeedID] });
  }

  public async rotateTowardsPosition(position: Vec3) {
    debugLog(this.props.debugLogging, `Rotating towards position: ${position}`);
    const lookDirection = position.sub(this.entity.position.get()).normalize();
    return this.npcPlayer?.rotateTo(lookDirection /*, { rotationSpeed: 360 }*/);
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
