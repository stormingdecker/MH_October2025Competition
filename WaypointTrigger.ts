import * as hz from 'horizon/core';
import { WaypointEvents } from 'WaypointManager';
/**
 * WaypointTrigger.ts
 *
 * Summary:
 * Detect the player entering a waypoint trigger.
 *
 * Works with:
 * - WaypointArrows Manage the arrows movement and visibility
 * - WaypointManager Manage waypoint triggers and their interactions.
 */

class WaypointTrigger extends hz.Component<typeof WaypointTrigger> {
  static propsDefinition = {
    waypointManager: { type: hz.PropTypes.Entity }
  };

	/**
	 * Lifecycle method called when the WaypointTrigger component is initialized.
	 */
  start() {
    this.subscribeEvents();
  }

/**
 * Detect when a player enters the waypoint trigger.
 */
  private subscribeEvents() {
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, (player: hz.Player) => {
      this.sendLocalEvent(this.props.waypointManager!, WaypointEvents.startWaypointArrow, { player: player });
    });
  }
}

// Register the component
hz.Component.register(WaypointTrigger);