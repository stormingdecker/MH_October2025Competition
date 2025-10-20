import { Asset, AttachableEntity, AttachablePlayerAnchor, AvatarGripPose, AvatarPoseGizmo, CodeBlockEvents, Color, Component, Entity, Handedness, Player, PropTypes, Vec3 } from "horizon/core";
import { Npc, NpcPlayer } from "horizon/npc";
import { KitchenManager, OrderTicket } from "KitchenManager";
import { NavMeshController } from "NavMeshController";
import { PlayerPlotManager, RestaurantItemTag } from "PlayerPlotManager";
import { RecipeType } from "RecipeCatalog";
import { debugLog, ManagerType } from "sysHelper";
import { getMgrClass } from "sysUtils";

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
  public abstract isIdle(): boolean;
  public abstract activate(targetChair: Entity): void;

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

  public isIdle() {
    //return this.currentState === NPCStates_WorldGreeter.WaitingForPlayerToApproach;
    // Greeters are never available to the pool
    return false;
  }

  public activate(targetChair: Entity) {
    // Greeters are always active
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

enum NPCStates_Client {
  Initializing,
  QueuedInPool,
  WalkToSeat,
  Sit,
  AnnounceFoodItem,
  WaitToBeServed,
  ReturningToPortal,
}

class NPCStateMachine_Client extends NPCStateMachine {
  private wantedFoodItemIndex = -1;
  private assignedChair?: Entity;

  public override onAgentReady(agent: NPCAgent, debugLogging: boolean) {
    this.debugLogging = debugLogging;
    debugLog(this.debugLogging, "StateMachine_Client: onAgentReady");
    this.parentAgent = agent;
    this.currentState = NPCStates_Client.QueuedInPool;
  }

  public isIdle() {
    return this.currentState === NPCStates_Client.QueuedInPool;
  }

  public activate(targetChair: Entity) {
    this.assignedChair = targetChair;
    if (this.currentState === NPCStates_Client.QueuedInPool) {
      this.currentState = NPCStates_Client.WalkToSeat;
    }
  }

  public override async updateState() {
    switch (this.currentState) {
      case NPCStates_Client.Initializing: {
        break;
      }
      case NPCStates_Client.QueuedInPool: {
        this.parentAgent!.teleportToPosition(new Vec3(0, -1000, 0));
        break;
      }
      case NPCStates_Client.WalkToSeat: {
        debugLog(this.debugLogging, `Client NPC walking to chair`);
        this.parentAgent!.teleportToPosition(this.parentAgent!.getSpawnPoint()?.position.get() ?? Vec3.zero);
        await this.parentAgent!.rotateTowardsPosition(this.assignedChair!.position.get());
        const isPathPossibleAlongNavMesh = this.parentAgent!.isPathPossibleAlongNavMesh(this.assignedChair!.position.get());
        if (isPathPossibleAlongNavMesh) {
          debugLog(this.debugLogging, `Client NPC walking to chair using NavMesh`);
          await this.parentAgent!.moveToPositionUsingNavMesh(this.assignedChair!.position.get(), NPCMovementSpeedID.Walk);
        } else {
          debugLog(this.debugLogging, `Client NPC walking to chair using direct movement`);
          await this.parentAgent!.moveToPosition(this.assignedChair!.position.get(), NPCMovementSpeedID.Walk);
        }
        this.currentState = NPCStates_Client.Sit;
        break;
      }
      case NPCStates_Client.Sit: {
        debugLog(this.debugLogging, `Client NPC sitting down`);
        await this.parentAgent!.rotateTowardsPosition(this.assignedChair!.position.get().add(this.assignedChair!.forward.get()));
        this.parentAgent?.playAvatarAnimation(NPCAnimationID.Sitting);
        await this.parentAgent!.showAIConversation(`I'm ready to order ${PossibleFoodItems[this.wantedFoodItemIndex]}`);
        this.currentState = NPCStates_Client.WaitToBeServed;
        break;
      }
      case NPCStates_Client.AnnounceFoodItem: {
        this.wantedFoodItemIndex = Math.floor(Math.random() * PossibleFoodItems.length);
        debugLog(this.debugLogging, `Client NPC wants to order: ${PossibleFoodItems[this.wantedFoodItemIndex]}`);
        const seatEntities = this.parentAgent?.world.getEntitiesWithTags(["ServiceTableSeat"]);
        if (seatEntities !== undefined && seatEntities.length > 0) {
          this.assignedChair = seatEntities[0].as(AvatarPoseGizmo);
        }
        this.currentState = NPCStates_Client.WalkToSeat;
        break;
      }
      case NPCStates_Client.WaitToBeServed: {
        await this.parentAgent!.showAIConversation(`Please wait to be served`);
        this.currentState = NPCStates_Client.ReturningToPortal;
        break;
      }
      case NPCStates_Client.ReturningToPortal: {
        this.parentAgent?.playAvatarAnimation(NPCAnimationID.None);
        const spawnPoint = this.parentAgent!.getSpawnPoint()!.position.get();
        await this.parentAgent!.rotateTowardsPosition(spawnPoint);
        await this.parentAgent!.moveToPosition(spawnPoint, NPCMovementSpeedID.Walk);
        this.parentAgent!.getParentPool()?.onAgentReleaseChair(this.parentAgent!);
        this.assignedChair = undefined;
        this.currentState = NPCStates_Client.QueuedInPool;
        break;
      }
    }
  }
}

// --- NPC Agent ---

class NPCAgent extends Component<typeof NPCAgent> {
  static propsDefinition = {
    useStateMachineWorldGreeter: { type: PropTypes.Boolean, default: false },
    useStateMachineClient: { type: PropTypes.Boolean, default: false },
    debugLogging: { type: PropTypes.Boolean, default: false },
  };

  private npcGizmo?: Npc;
  private npcPlayer?: NpcPlayer;
  private stateMachine?: NPCStateMachine;
  private startPosition = Vec3.zero;
  private parentPool?: NPCAgentPool;
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
    if (this.props.useStateMachineWorldGreeter) {
      this.stateMachine = new NPCStateMachine_WorldGreeter();
    } else if (this.props.useStateMachineClient) {
      this.stateMachine = new NPCStateMachine_Client();
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

  public isIdle() {
    if (this.stateMachine !== undefined) {
      return this.stateMachine.isIdle();
    }
    return false;
  }

  public activate(targetChair: Entity) {
    if (this.stateMachine !== undefined) {
      this.stateMachine.activate(targetChair);
    }
  }

  public getStartPosition() {
    return this.startPosition;
  }

  public setParentPool(agentPool: NPCAgentPool) {
    this.parentPool = agentPool;
  }

  public getParentPool() {
    return this.parentPool;
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

// --- NPC Agent Pool ---

interface NPCFoodAssignment {
  player: Player;
  chair: Entity;
  kitchenManager: KitchenManager;
  recipeType: string;
  orderTicket: OrderTicket;
}

class NPCAgentPool extends Component<typeof NPCAgentPool> {
  static propsDefinition = {
    spawnRateInSeconds: { type: PropTypes.Number, default: 30 },
    spawnPoint: { type: PropTypes.Entity },
    npcAgent1: { type: PropTypes.Entity },
    npcAgent2: { type: PropTypes.Entity },
    npcAgent3: { type: PropTypes.Entity },
    npcAgent4: { type: PropTypes.Entity },
    debugLogging: { type: PropTypes.Boolean, default: false },
  };

  private npcAgents: NPCAgent[] = [];
  private activePlayers: Player[] = [];
  private availableChairs: Entity[] = [];
  private assignedChairs: Map<NPCAgent, Entity> = new Map();

  override start() {
    this.registerAgent(this.props.npcAgent1);
    this.registerAgent(this.props.npcAgent2);
    this.registerAgent(this.props.npcAgent3);
    this.registerAgent(this.props.npcAgent4);

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterWorld, (player) => {
      this.activePlayers.push(player);
      this.availableChairs = [];
    });

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitWorld, (player) => {
      const index = this.activePlayers.indexOf(player);
      if (index > -1) {
        this.activePlayers.splice(index, 1);
        this.availableChairs = [];
      }
    });

    this.async.setInterval(() => {
      if (this.activePlayers.length > 0) {
        this.spawnAgent();
      }
    }, this.props.spawnRateInSeconds * 1000);
  }

  private spawnAgent() {
    // Rebuild the available chairs list if it's empty
    if (this.availableChairs.length === 0) {
      debugLog(this.props.debugLogging, "Rebuilding available chairs list");
      this.buildAvailableChairsList();
      if (this.availableChairs.length === 0) {
        return;
      }
    }

    // If all chairs are assigned, do nothing
    if (this.assignedChairs.size >= this.availableChairs.length) {
      debugLog(this.props.debugLogging, "All chairs are assigned");
      return;
    }

    // Find a random unassigned agent
    const availableAgent = this.getAvailableAgent();
    if (availableAgent === undefined) {
      debugLog(this.props.debugLogging, "No available agents");
      return;
    }

    // Find a random unassigned chair
    let chair: Entity | undefined;
    while (true) {
      const randomIndex = Math.floor(Math.random() * this.availableChairs.length);
      const potentialChair = this.availableChairs[randomIndex];
      if (!this.isChairAssigned(potentialChair)) {
        debugLog(this.props.debugLogging, `Assigning chair: ${potentialChair.name.get()}`);
        chair = potentialChair;
        this.assignedChairs.set(availableAgent, chair);
        chair.collidable.set(false);
        break;
      }
    }

    availableAgent.activate(chair);
    debugLog(this.props.debugLogging, "Activated NPC agent " + availableAgent.entity.name.get());
  }

  private isChairAssigned(chair: Entity) {
    let isAssigned = false;
    this.assignedChairs.forEach((assignedChair) => {
      if (assignedChair === chair) {
        isAssigned = true;
      }
    });
    return isAssigned;
  }

  private buildAvailableChairsList() {
    debugLog(this.props.debugLogging, "Building available chairs list");
    const plotManager = getMgrClass<PlayerPlotManager>(this, ManagerType.PlayerPlotManager, PlayerPlotManager);
    if (plotManager === undefined) {
      console.error("NPCAgentPool: PlayerPlotManager not found");
      return;
    }

    for (const player of this.activePlayers) {
      const kitchenManagerEntity = plotManager.getPlayerKitchen(player);
      if (kitchenManagerEntity === undefined) {
        debugLog(this.props.debugLogging, `No kitchen entity found for player ${player.name.get()}`);
        continue;
      }
      const kitchenManager = kitchenManagerEntity.getComponents(KitchenManager)[0];
      if (kitchenManager === undefined) {
        debugLog(this.props.debugLogging, `No KitchenManager component found for player ${player.name.get()}`);
        continue;
      }

      const orderTicket = kitchenManager.generateNewOrder(player, RecipeType.BurgerBasic);
      const foodAssignment: NPCFoodAssignment = {
        player: player,
        chair: null!,
        kitchenManager: kitchenManager,
        recipeType: RecipeType.BurgerBasic,
        orderTicket: orderTicket,
      };
      this.availableChairs.push(...(plotManager.getPlayerItemsByTag(player, RestaurantItemTag.chair) ?? []));
    }
  }

  private registerAgent(agentEntity?: Entity) {
    if (agentEntity !== undefined) {
      const npcAgent = agentEntity.getComponents(NPCAgent)[0];
      if (npcAgent !== undefined) {
        this.npcAgents.push(npcAgent);
        npcAgent.setParentPool(this);
        if (this.props.spawnPoint !== undefined) {
          npcAgent.setSpawnPoint(this.props.spawnPoint);
        }
      }
    }
  }

  private getAvailableAgent() {
    for (const npcAgent of this.npcAgents) {
      if (npcAgent.isIdle()) {
        return npcAgent;
      }
    }
    return undefined;
  }

  public onAgentReleaseChair(npcAgent: NPCAgent) {
    const chair = this.assignedChairs.get(npcAgent);
    if (chair === undefined) {
      return;
    }
    debugLog(this.props.debugLogging, `Releasing chair: ${chair.name.get()}`);
    chair.collidable.set(true);
    this.assignedChairs.delete(npcAgent);
  }
}
Component.register(NPCAgentPool);
