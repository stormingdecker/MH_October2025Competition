import * as hz from 'horizon/core';

/**
 * WaypointManager.ts
 *
 * Summary:
 * Manage waypoint triggers and their interactions.
 * Check the children of the waypointTargets entity for active triggers.
 *
 * Works with:
 * - WaypointTrigger Detect the player entering a waypoint trigger.
 * - WaypointArrows Manage the arrows movement and visibility
 * 
 * Setup:
 * - For more or less objectives, duplicate the Target entity inside WaypointTargets
 */

export const WaypointEvents = {
  startWaypointArrow: new hz.LocalEvent<{ player: hz.Player }>("startWaypointArrow"),
  updateTargetPosition: new hz.NetworkEvent<{ newPosition: hz.Vec3 }>("updateTargetPosition"),
  stopwaypointArrow: new hz.NetworkEvent<{}>("stopWaypointArrow"),
}

class WaypointManager extends hz.Component<typeof WaypointManager> {
  static propsDefinition = {
    waypointTargets: { type: hz.PropTypes.Entity }, // Parent entity containing waypoint target triggers
  };

  private waypointTargets: hz.Entity = hz.Entity.prototype;
  private targetPositions: hz.Vec3[] = [];
  private playerToCurrentTargetIndex: Map<hz.Player, number> = new Map();

	/**
	 * Lifecycle method called when the WaypointManager component is initialized.
	 */
  start() {
    this.initializeTargets();
    this.subscribeEvents();
  }

  /**
   * Initialize the waypoint targets and their positions.
   */
  private initializeTargets() {
    if (this.props.waypointTargets) {
      this.waypointTargets = this.props.waypointTargets;
      this.targetPositions = this.waypointTargets.children.get().map(child => child.position.get());

      // Subscribe to player enter trigger events for each waypoint target
      this.waypointTargets.children.get().forEach((target, index) => {
        this.connectCodeBlockEvent(target.children.get()[0], hz.CodeBlockEvents.OnPlayerEnterTrigger, (player: hz.Player) => {
          this.handlePlayerEnterTarget(player, index);
        });
      });
    }
  }

/**
 * Handle player entering a waypoint trigger.
 * @param player - The player entering the trigger.
 * @param triggerIndex - The index of the trigger.
 */
  private handlePlayerEnterTarget(player: hz.Player, triggerIndex: number) {
    if (this.playerToCurrentTargetIndex.get(player)! !== triggerIndex) {
      return; // Ignore if the player is not at the expected target
    }
    let currentIndex = this.playerToCurrentTargetIndex.get(player)!;
    const newIndex = currentIndex + 1;
    this.playerToCurrentTargetIndex.set(player, newIndex);
    if (newIndex >= this.targetPositions.length) {
      this.playerToCurrentTargetIndex.set(player, 0);; // Loop back to the first target
      this.sendNetworkEvent(player, WaypointEvents.stopwaypointArrow, { player });
      return;
    }
    this.sendNetworkEvent(player, WaypointEvents.updateTargetPosition, { newPosition: this.targetPositions[this.playerToCurrentTargetIndex.get(player)!] });
  }

  /**
   * Subscribe to relevant events for the waypoint manager.
   */
  private subscribeEvents() {
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld, (player: hz.Player) => {
      this.playerToCurrentTargetIndex.set(player, 0);
    });

    this.connectLocalEvent(this.entity, WaypointEvents.startWaypointArrow, (data) => {
      this.playerToCurrentTargetIndex.set(data.player, 0);
      this.sendNetworkEvent(data.player, WaypointEvents.updateTargetPosition, { newPosition: this.targetPositions[this.playerToCurrentTargetIndex.get(data.player)!] });
    });
  }
}

// Register the WaypointManager component
hz.Component.register(WaypointManager);