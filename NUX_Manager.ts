import { Component, Entity, Player, Vec3 } from "horizon/core";
import { KitchenApplianceTag } from "KitchenManager";
import { NPCAgentPool } from "NPCAgentPool";
import { PlayerManager, PlayerMgrEvents } from "PlayerManager";
import { PlayerPlotManager } from "PlayerPlotManager";
import { sysEvents } from "sysEvents";
import { getEntityListByTag, ManagerType } from "sysHelper";
import { getMgrClass } from "sysUtils";
import { oneHudEvents } from "UI_OneHUDEvents";
import { WaypointEvents } from "WaypointArrows";

enum NUXStepType {
  Waypoint,
  Popup,
  Confirmation,
  Notification,
  Delay,
  Completion,
}

enum WaypointTargetType {
  Position, // Use a specific Vec3 position
  Entity, // Target a specific entity
  StationTag, // Target entities by kitchen station tag
  PlotTag, // Target entities by plot tag (chairs, tables, etc.)
  PlotEntity, // Target specific plot entities (fruit tree, merchant stall, etc.)
}

interface NUXStep {
  type: NUXStepType;
  title?: string;
  message?: string;
  waypointTarget?: string | Vec3 | Entity; // Backwards compatibility
  waypointTargetType?: WaypointTargetType;
  waypointTargetData?: {
    targetType: WaypointTargetType;
    target: string | Vec3 | Entity; // The actual target data
  };
  imageAssetId?: string;
  autoAdvance?: boolean; // For steps that advance automatically
  showNotificationWithWaypoint?: boolean; // Show notification when setting waypoint
  delayDuration?: number; // Duration in milliseconds for delay steps
}

enum NUXSteps {
  Introduction,
  MovementTutorial,
  InteractionTutorial,
  Completion,
}

interface PlayerPlotData {
  playerPlotManager: PlayerPlotManager;
  plotBaseEntity: Entity; // The PerPlotManager entity for this player's plot
}

/**
 * Enhanced NUX Manager with flexible waypoint targeting system
 *
 * Supports multiple waypoint target types:
 * - Position: Target specific Vec3 coordinates
 * - Entity: Target a specific entity directly
 * - StationTag: Target kitchen stations (orderStation, prepStation, cookingStation, pickupStation)
 * - PlotTag: Target plot entities (chair, table, etc.)
 * - PlotEntity: Target plot-specific entities (FruitTree, MerchantStall)
 *
 * Supports multiple step types:
 * - Popup: Modal popup with OK button
 * - Confirmation: Yes/No confirmation dialog
 * - Notification: Non-blocking notification banner
 * - Delay: Silent pause between steps (useful between consecutive popups)
 * - Waypoint: Sets waypoint arrow (optionally with notification)
 * - Completion: Final step that auto-advances
 */
class NUX_Manager extends Component<typeof NUX_Manager> {
  static propsDefinition = {};

  private oneHUD: Entity | null = null;
  private playerPlotDataMap: Map<Player, PlayerPlotData> = new Map();
  private playerCurrentStepMap: Map<Player, number> = new Map();
  private playerStepDataMap: Map<Player, NUXStep[]> = new Map();

  // Define the NUX steps sequence
  private readonly nuxSteps: NUXStep[] = [
    {
      type: NUXStepType.Confirmation,
      title: "Welcome!",
      message: "Would you like to start the New User Experience tutorial?",
    },
    {
      type: NUXStepType.Popup,
      title: "This restaurant is yours to run & build!",
      message: "Next we'll head inside and discover how you will serve your customers!",
      imageAssetId: undefined,
    },
    {
      type: NUXStepType.Delay,
      delayDuration: 1000,
    },
    {
      type: NUXStepType.Popup,
      title: "Find your order station.",
      message: "Follow the arrows to explore your kitchen.",
    },
    {
      type: NUXStepType.Waypoint,
      title: "",
      message: "",
      waypointTargetData: {
        targetType: WaypointTargetType.StationTag,
        target: KitchenApplianceTag.OrderStation,
      },
      showNotificationWithWaypoint: false,
    },
    {
      type: NUXStepType.Popup,
      title: "Order Station",
      message: "This is where you pick-up orders from your customers. Next, let's find the prep station!",
    },
    {
      type: NUXStepType.Waypoint,
      title: "",
      message: "",
      waypointTargetData: {
        targetType: WaypointTargetType.StationTag,
        target: KitchenApplianceTag.PrepStation,
      },
      showNotificationWithWaypoint: false,
    },
    {
      type: NUXStepType.Popup,
      title: "Prep Station",
      message: "This is where you prepare ingredients for cooking. Let's locate the pickup station!",
    },
    {
      type: NUXStepType.Waypoint,
      title: "",
      message: "",
      waypointTargetData: {
        targetType: WaypointTargetType.StationTag,
        target: KitchenApplianceTag.PickUpStation,
      },
      showNotificationWithWaypoint: false,
    },
    {
      type: NUXStepType.Popup,
      title: "Pickup Station",
      message: "This is where you collect finished orders to deliver to customers.",
    },
    {
      type: NUXStepType.Waypoint,
      title: "",
      message: "",
      waypointTargetData: {
        targetType: WaypointTargetType.PlotEntity,
        target: "FruitTree",
      },
      showNotificationWithWaypoint: false,
    },
    {
      type: NUXStepType.Popup,
      title: "Fruit Tree",
      message: "Your tree provides fresh fruit here for your recipes. Next, let's visit the merchant stall.",
    },
    {
      type: NUXStepType.Waypoint,
      title: "",
      message: "",
      waypointTargetData: {
        targetType: WaypointTargetType.PlotEntity,
        target: "MerchantStall",
      },
      showNotificationWithWaypoint: false,
    },
    {
      type: NUXStepType.Popup,
      title: "Merchant Stall",
      message: "Here you can buy & sell items for your restaurant. Finally... the central island.",
    },
    {
      type: NUXStepType.Delay,
      delayDuration: 1000,
    },
    {
      type: NUXStepType.Popup,
      title: "The Central Island",
      message: "On the other side of the bridge are the other player lots, as well as orchards that change daily!",
    },
    {
      type: NUXStepType.Delay,
      delayDuration: 1000,
    },
    {
      type: NUXStepType.Popup,
      title: "Tutorial Complete",
      message: "Congratulations! You've learned about all the stations and locations. Ready to start cooking?",
    },
    {
      type: NUXStepType.Completion,
      title: "NUX Complete",
      message: "Welcome to the game! Enjoy your restaurant experience!",
      autoAdvance: true,
    },
  ];

  preStart() {
    this.connectNetworkEvent(this.entity, sysEvents.startNUXForPlayer, (data) => {
      const { player, playerPlot } = data;
      this.startNUXForPlayer(player, playerPlot);
    });

    this.connectNetworkEvent(this.entity, PlayerMgrEvents.PlayerLeft, (data) => {
      const player = data.player;
      this.cleanupPlayerData(player);
    });

    this.connectNetworkEvent(this.entity, oneHudEvents.PopupResponse, (data) => {
      this.onPopupResponse(data.player);
    });

    this.connectNetworkEvent(this.entity, oneHudEvents.ConfirmationPanelResponse, (data) => {
      this.onConfirmationResponse(data.player, data.accepted);
    });

    this.connectNetworkBroadcastEvent(WaypointEvents.onTargetReached, (data) => {
      this.onTargetReached(data.player);
    });
  }

  start() {
    PlayerManager.instance.registerSubscriber(this.entity, ["human"]);
    this.oneHUD = getEntityListByTag(ManagerType.UI_OneHUD, this.world)[0] || null;
  }

  private startNUXForPlayer(player: Player, playerPlot: Entity) {
    const plotManager = getMgrClass<PlayerPlotManager>(this, ManagerType.PlayerPlotManager, PlayerPlotManager);

    this.playerPlotDataMap.set(player, {
      playerPlotManager: plotManager!,
      plotBaseEntity: playerPlot,
    });

    this.playerCurrentStepMap.set(player, 0);
    this.playerStepDataMap.set(player, [...this.nuxSteps]); // Create a copy for this player

    console.log(`Starting NUX for player ${player.name.get()} at plot ${playerPlot.name.get()}.`);
    this.executeCurrentStep(player);
  }

  private cleanupPlayerData(player: Player) {
    this.playerPlotDataMap.delete(player);
    this.playerCurrentStepMap.delete(player);
    this.playerStepDataMap.delete(player);
  }

  private executeCurrentStep(player: Player) {
    const currentStepIndex = this.playerCurrentStepMap.get(player);
    const steps = this.playerStepDataMap.get(player);

    if (currentStepIndex === undefined || !steps || currentStepIndex >= steps.length) {
      console.log(`NUX completed for player ${player.name.get()}`);
      this.cleanupPlayerData(player);
      return;
    }

    const step = steps[currentStepIndex];
    console.log(`Executing step ${currentStepIndex} (${NUXStepType[step.type]}) for player ${player.name.get()}`);

    switch (step.type) {
      case NUXStepType.Popup:
        this.executePopupStep(player, step);
        break;
      case NUXStepType.Confirmation:
        this.executeConfirmationStep(player, step);
        break;
      case NUXStepType.Notification:
        this.executeNotificationStep(player, step);
        break;
      case NUXStepType.Delay:
        this.executeDelayStep(player, step);
        break;
      case NUXStepType.Waypoint:
        this.executeWaypointStep(player, step);
        break;
      case NUXStepType.Completion:
        this.executeCompletionStep(player, step);
        break;
    }
  }

  private executePopupStep(player: Player, step: NUXStep) {
    this.popupRequest(player, step.title || "", step.message || "");
  }

  private executeConfirmationStep(player: Player, step: NUXStep) {
    this.confirmationRequest(player, step.message || "Continue");
  }

  private executeNotificationStep(player: Player, step: NUXStep) {
    this.notificationRequest(player, step.title || "", step.message || "", step.imageAssetId, "rgba(124, 0, 173, 1)");

    // Wait 3 seconds before advancing
    this.async.setTimeout(() => {
      this.advanceToNextStep(player);
    }, 3000);
  }

  private executeDelayStep(player: Player, step: NUXStep) {
    const delayDuration = step.delayDuration || 1000; // Default 1 second delay
    console.log(`Delay step for ${player.name.get()}: waiting ${delayDuration}ms`);

    // Wait for the specified duration before advancing
    this.async.setTimeout(() => {
      this.advanceToNextStep(player);
    }, delayDuration);
  }

  private executeWaypointStep(player: Player, step: NUXStep) {
    const targetPosition = this.resolveWaypointTarget(player, step);
    if (targetPosition) {
      this.sendNetworkEvent(player, WaypointEvents.updateTargetPosition, {
        newPosition: targetPosition,
      });

      console.log(`Setting waypoint for ${player.name.get()} to position: ${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z}`);

      // Show notification with waypoint if requested
      if (step.showNotificationWithWaypoint) {
        this.notificationRequest(player, step.title || "", step.message || "", step.imageAssetId, "rgba(255, 0, 221, 1)");
      }
    } else {
      this.sendNetworkEvent(player, WaypointEvents.stopwaypointArrow, {});
      console.error(`Could not resolve waypoint target for player ${player.name.get()}, step: ${step.title}`);
      // Skip to next step if target cannot be resolved
      this.advanceToNextStep(player);
    }
  }

  private resolveWaypointTarget(player: Player, step: NUXStep): Vec3 | null {
    // Handle backwards compatibility with old waypointTarget
    if (step.waypointTarget && !step.waypointTargetData) {
      if (step.waypointTarget instanceof Vec3) {
        return step.waypointTarget;
      } else if (step.waypointTarget instanceof Entity) {
        return step.waypointTarget.position.get();
      }
    }

    // Handle new waypoint target data
    if (step.waypointTargetData) {
      const targetData = step.waypointTargetData;

      switch (targetData.targetType) {
        case WaypointTargetType.Position:
          if (targetData.target instanceof Vec3) {
            return targetData.target;
          }
          break;

        case WaypointTargetType.Entity:
          if (targetData.target instanceof Entity) {
            return targetData.target.position.get();
          }
          break;

        case WaypointTargetType.StationTag:
          if (typeof targetData.target === "string") {
            return this.findStationByTag(player, targetData.target);
          }
          break;

        case WaypointTargetType.PlotTag:
          if (typeof targetData.target === "string") {
            return this.findPlotEntityByTag(player, targetData.target);
          }
          break;

        case WaypointTargetType.PlotEntity:
          if (typeof targetData.target === "string") {
            return this.findPlotEntityByName(player, targetData.target);
          }
          break;
      }
    }

    return null;
  }

  private findStationByTag(player: Player, stationTag: string): Vec3 | null {
    const plotData = this.playerPlotDataMap.get(player);
    if (!plotData) {
      console.warn(`No plot data found for player ${player.name.get()}`);
      return null;
    }

    // Get entities by tag from the player's plot
    const stationEntities = plotData.playerPlotManager.getPlayerItemsByTag(player, stationTag);

    if (stationEntities.length === 0) {
      console.warn(`No ${stationTag} found for player ${player.name.get()}`);
      return null;
    }

    // Use preferred index if valid, otherwise use first available
    const targetIndex = 0;
    const targetEntity = stationEntities[targetIndex];

    console.log(`Found ${stationTag} for player ${player.name.get()} at index ${targetIndex}`);
    return targetEntity.position.get();
  }

  private findPlotEntityByTag(player: Player, plotTag: string): Vec3 | null {
    const plotData = this.playerPlotDataMap.get(player);
    if (!plotData) {
      console.warn(`No plot data found for player ${player.name.get()}`);
      return null;
    }

    // Get entities by tag from the player's plot
    const entities = plotData.playerPlotManager.getPlayerItemsByTag(player, plotTag);

    if (entities.length === 0) {
      console.warn(`No entities with tag ${plotTag} found for player ${player.name.get()}`);
      return null;
    }

    // Use preferred index if valid, otherwise use first available
    const targetIndex = 0;
    const targetEntity = entities[targetIndex];

    console.log(`Found plot entity with tag ${plotTag} for player ${player.name.get()} at index ${targetIndex}`);
    return targetEntity.position.get();
  }

  private findPlotEntityByName(player: Player, entityName: string): Vec3 | null {
    const plotData = this.playerPlotDataMap.get(player);
    if (!plotData) {
      console.warn(`No plot data found for player ${player.name.get()}`);
      return null;
    }

    // Access the PerPlotManager component from the plot base entity
    const plotBaseEntity = plotData.plotBaseEntity;

    try {
      // Try to access the specific entity based on the entity name
      if (entityName === "FruitTree") {
        // Access the FruitTree property from the PerPlotManager component
        const perPlotComponents = plotBaseEntity.getComponents();
        for (const component of perPlotComponents) {
          if (component.constructor.name === "PerPlotManager") {
            const perPlotManager = component as any; // Cast to access properties
            if (perPlotManager.props && perPlotManager.props.FruitTree) {
              const fruitTreeEntity = perPlotManager.props.FruitTree;
              console.log(`Found FruitTree for player ${player.name.get()}`);
              return fruitTreeEntity.position.get();
            }
          }
        }
      } else if (entityName === "MerchantStall") {
        // Access the MerchantStall property from the PerPlotManager component
        const perPlotComponents = plotBaseEntity.getComponents();
        for (const component of perPlotComponents) {
          if (component.constructor.name === "PerPlotManager") {
            const perPlotManager = component as any; // Cast to access properties
            if (perPlotManager.props && perPlotManager.props.MerchantStall) {
              const merchantStallEntity = perPlotManager.props.MerchantStall;
              console.log(`Found MerchantStall for player ${player.name.get()}`);
              return merchantStallEntity.position.get();
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error accessing ${entityName} for player ${player.name.get()}:`, error);
    }

    console.warn(`Could not find ${entityName} for player ${player.name.get()}`);
    return null;
  }

  private executeCompletionStep(player: Player, step: NUXStep) {
    if (step.message) {
      console.log(`NUX completion message for ${player.name.get()}: ${step.message}`);
    }

    NPCAgentPool.instance.allowClientsForPlayer(player);

    if (step.autoAdvance) {
      this.advanceToNextStep(player);
    }
  }

  private advanceToNextStep(player: Player) {
    const currentStep = this.playerCurrentStepMap.get(player);
    if (currentStep !== undefined) {
      this.playerCurrentStepMap.set(player, currentStep + 1);
      this.executeCurrentStep(player);
    }
  }

  private onTargetReached(player: Player) {
    console.log(`Player ${player.name.get()} reached the waypoint target.`);
    this.advanceToNextStep(player);
  }

  private popupRequest(player: Player, title: string, message: string, imageAssetId?: string) {
    this.sendNetworkEvent(this.oneHUD!, oneHudEvents.PopupRequest, {
      requester: this.entity,
      title,
      message,
      player,
      imageAssetId,
    });
  }

  private notificationRequest(player: Player, title: string, message: string, imageAssetId?: string, bkgColor?: string) {
    this.sendNetworkEvent(this.oneHUD!, oneHudEvents.NotificationEvent, {
      message: title ? `${title}: ${message}` : message,
      players: [player],
      imageAssetId: imageAssetId || null,
      bkgColor: bkgColor || undefined,
    });
  }

  private onPopupResponse(player: Player) {
    console.log(`Popup response received from player ${player.name.get()}`);
    this.advanceToNextStep(player);
  }

  private confirmationRequest(player: Player, msg: string) {
    this.sendNetworkEvent(this.oneHUD!, oneHudEvents.ConfirmationPanelRequest, {
      requester: this.entity,
      player,
      confirmationMessage: msg,
    });
  }

  private onConfirmationResponse(player: Player, accepted: boolean) {
    console.log(`Confirmation response from player ${player.name.get()}: ${accepted ? "accepted" : "declined"}`);

    if (accepted) {
      this.advanceToNextStep(player);
    } else {
      // Handle declined confirmation - could skip current step, restart, or end NUX
      const currentStepIndex = this.playerCurrentStepMap.get(player);
      const steps = this.playerStepDataMap.get(player);

      if (currentStepIndex !== undefined && steps) {
        const currentStep = steps[currentStepIndex];

        // If this is the initial confirmation, clean up and end NUX
        if (currentStepIndex === 0) {
          console.log(`Player ${player.name.get()} declined to start the NUX tutorial.`);
          this.cleanupPlayerData(player);
          NPCAgentPool.instance.allowClientsForPlayer(player);
        } else {
          // For other confirmations, you might want to skip to next step or handle differently
          this.advanceToNextStep(player);
        }
      }
    }
  }

  // Helper method to manually advance a player to a specific step (useful for debugging)
  public advancePlayerToStep(player: Player, stepIndex: number) {
    if (this.playerCurrentStepMap.has(player)) {
      this.playerCurrentStepMap.set(player, stepIndex);
      this.executeCurrentStep(player);
    }
  }

  // Helper method to get available station positions for debugging
  public getPlayerStationPositions(player: Player): { [key: string]: Vec3[] } {
    const plotData = this.playerPlotDataMap.get(player);
    if (!plotData) {
      return {};
    }

    const stationPositions: { [key: string]: Vec3[] } = {};

    // Get all station types
    Object.values(KitchenApplianceTag).forEach((stationTag) => {
      const stations = plotData.playerPlotManager.getPlayerItemsByTag(player, stationTag);
      stationPositions[stationTag] = stations.map((station) => station.position.get());
    });

    return stationPositions;
  }
}
Component.register(NUX_Manager);
