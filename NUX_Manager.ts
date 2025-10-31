import { Component, Entity, Player, Vec3 } from "horizon/core";
import { KitchenApplianceTag } from "KitchenManager";
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
  Completion,
}

enum WaypointTargetType {
  Position, // Use a specific Vec3 position
  Entity, // Target a specific entity
  StationTag, // Target entities by kitchen station tag
  PlotTag, // Target entities by plot tag (chairs, tables, etc.)
  NUXTrigger, // Target specific NUX trigger by name
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
  //kitchenManagerEntity: Entity;
  //kitchenManager: KitchenManager;
}

/**
 * Enhanced NUX Manager with flexible waypoint targeting system
 *
 * Supports multiple waypoint target types:
 * - Position: Target specific Vec3 coordinates
 * - Entity: Target a specific entity directly
 * - StationTag: Target kitchen stations (orderStation, prepStation, cookingStation, pickupStation)
 * - PlotTag: Target plot entities (chair, table, etc.)
 * - NUXTrigger: Target specific NUX trigger entities by name
 * - PlotEntity: Target plot-specific entities (FruitTree, MerchantStall)
 *
 * Usage examples:
 * - Default NUX: Automatically started when player joins
 * - Custom sequences: nuxManager.startCustomNUXForPlayer(player, plot, "kitchenTour")
 * - Individual steps: NUX_Manager.createStationWaypointStep("Title", "Message", KitchenApplianceTag.OrderStation)
 * - Plot entities: NUX_Manager.createPlotEntityWaypointStep("Visit Tree", "Go to fruit tree", "FruitTree")
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
      message: "Head inside to start serving customers!",
      imageAssetId: undefined,
    },
    {
      type: NUXStepType.Waypoint,
      title: "Go to the Order Station",
      message: "Follow the waypoint arrow to your order station!",
      waypointTargetData: {
        targetType: WaypointTargetType.StationTag,
        target: KitchenApplianceTag.OrderStation,
      },
    },
    {
      type: NUXStepType.Popup,
      title: "Order Station Tutorial",
      message: "This is where customers place their orders. Great job finding it!",
    },
    {
      type: NUXStepType.Waypoint,
      title: "Go to the Prep Station",
      message: "Now let's find where you prepare food!",
      waypointTargetData: {
        targetType: WaypointTargetType.StationTag,
        target: KitchenApplianceTag.PrepStation,
      },
    },
    {
      type: NUXStepType.Popup,
      title: "Prep Station Tutorial",
      message: "This is where you prepare ingredients for cooking. Well done!",
    },
    {
      type: NUXStepType.Waypoint,
      title: "Find the Pickup Station",
      message: "Finally, let's locate where finished orders are picked up!",
      waypointTargetData: {
        targetType: WaypointTargetType.StationTag,
        target: KitchenApplianceTag.PickUpStation,
      },
    },
    {
      type: NUXStepType.Popup,
      title: "Pickup Station Tutorial",
      message: "Perfect! This is where customers collect their finished orders.",
    },
    {
      type: NUXStepType.Waypoint,
      title: "Visit the Fruit Tree",
      message: "Let's explore outside! Go to the fruit tree to gather fresh ingredients.",
      waypointTargetData: {
        targetType: WaypointTargetType.PlotEntity,
        target: "FruitTree",
      },
    },
    {
      type: NUXStepType.Popup,
      title: "Fruit Tree Tutorial",
      message: "This is your fruit tree! You can harvest fresh fruits here for your recipes.",
    },
    {
      type: NUXStepType.Waypoint,
      title: "Visit the Merchant Stall",
      message: "Now let's check out the merchant stall for supplies and upgrades!",
      waypointTargetData: {
        targetType: WaypointTargetType.PlotEntity,
        target: "MerchantStall",
      },
    },
    {
      type: NUXStepType.Popup,
      title: "Merchant Stall Tutorial",
      message: "Great! Here you can buy ingredients, sell items, and get upgrades for your restaurant.",
    },
    {
      type: NUXStepType.Confirmation,
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
    //const kitchenManagerEntity = plotManager!.getPlayerKitchen(player);
    //const kitchenManager = kitchenManagerEntity!.getComponents(KitchenManager)[0];

    this.playerPlotDataMap.set(player, {
      playerPlotManager: plotManager!,
      plotBaseEntity: playerPlot,
      //kitchenManagerEntity: kitchenManagerEntity!,
      //kitchenManager: kitchenManager!,
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
      case NUXStepType.Waypoint:
        this.executeWaypointStep(player, step);
        break;
      case NUXStepType.Completion:
        this.executeCompletionStep(player, step);
        break;
    }
  }

  private executePopupStep(player: Player, step: NUXStep) {
    this.popupRequest(player, step.title || "Tutorial", step.message || "");
  }

  private executeConfirmationStep(player: Player, step: NUXStep) {
    this.confirmationRequest(player, step.message || "Continue?");
  }

  private executeWaypointStep(player: Player, step: NUXStep) {
    const targetPosition = this.resolveWaypointTarget(player, step);
    if (targetPosition) {
      this.sendNetworkEvent(player, WaypointEvents.updateTargetPosition, {
        newPosition: targetPosition,
      });

      console.log(`Setting waypoint for ${player.name.get()} to position: ${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z}`);
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
      if (typeof step.waypointTarget === "string") {
        // Try to find entity by name/tag
        return this.findEntityPositionByName(player, step.waypointTarget);
      } else if (step.waypointTarget instanceof Vec3) {
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

        case WaypointTargetType.NUXTrigger:
          if (typeof targetData.target === "string") {
            return this.findEntityPositionByName(player, targetData.target);
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

  private findEntityPositionByName(player: Player, entityName: string): Vec3 | null {
    // This is a more complex search - you might need to implement based on your specific setup
    // For now, return a default position
    console.warn(`Entity name search not fully implemented: ${entityName}`);
    return new Vec3(0, 0, 0);
  }

  private executeCompletionStep(player: Player, step: NUXStep) {
    if (step.message) {
      console.log(`NUX completion message for ${player.name.get()}: ${step.message}`);
    }

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

  // Static helper method to create plot entity waypoint steps
  public static createPlotEntityWaypointStep(title: string, message: string, entityName: "FruitTree" | "MerchantStall"): NUXStep {
    return {
      type: NUXStepType.Waypoint,
      title,
      message,
      waypointTargetData: {
        targetType: WaypointTargetType.PlotEntity,
        target: entityName,
      },
    };
  }

  // Static helper method to create station waypoint steps
  public static createStationWaypointStep(title: string, message: string, stationTag: string): NUXStep {
    return {
      type: NUXStepType.Waypoint,
      title,
      message,
      waypointTargetData: {
        targetType: WaypointTargetType.StationTag,
        target: stationTag,
      },
    };
  }
}
Component.register(NUX_Manager);
