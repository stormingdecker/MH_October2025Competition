import * as hz from 'horizon/core';
import { WaypointEvents } from 'WaypointManager';

/**
 * WaypointArrows.ts
 *
 * Summary:
 * Manage the arrows movement and visibility
 *
 * Works with:
 * - WaypointTrigger Detect the player entering a waypoint trigger.
 * - WaypointManager Manage waypoint arrows and their interactions.
 */


class WaypointArrows extends hz.Component<typeof WaypointArrows> {
  static propsDefinition = {
    targetArrow: { type: hz.PropTypes.Entity }, // Entity representing the target arrow
    waypointArrow: { type: hz.PropTypes.Entity }, // Entity representing the waypoint arrow
  };

  private owner = hz.Player.prototype;
  private targetArrow: hz.Entity = hz.Entity.prototype;
  private waypointArrow: hz.Entity = hz.Entity.prototype;
  private targetArrowVFX: hz.ParticleGizmo = hz.ParticleGizmo.prototype;
  private waypointArrowVFX: hz.ParticleGizmo = hz.ParticleGizmo.prototype;
  private updateIntervalId: number | null = null;
  private targetPosition: hz.Vec3 = hz.Vec3.prototype;
  private isVisible: boolean = false;

  /**
   * Lifecycle method called when the WaypointArrows component is initialized.
   */
  start() {
    this.owner = this.entity.owner.get();
    if (this.owner !== this.world.getServerPlayer()) {
      this.initializeProps();
      this.subscribeEvents();
      this.attachToPlayer();
    }
  }

  /**
   * Initialize the arrow and the VFX components.
   */
  private initializeProps() {
    if (this.props.targetArrow) {
      this.targetArrow = this.props.targetArrow;
      this.targetArrowVFX = this.targetArrow.children.get()[0].as(hz.ParticleGizmo);
    }

    if (this.props.waypointArrow) {
      this.waypointArrow = this.props.waypointArrow;
      this.waypointArrowVFX = this.waypointArrow.children.get()[0].as(hz.ParticleGizmo);
    }
  }

/**
 * Subscribe to relevant events for the waypoint arrows. Update the target position and
 * stop the arrow update when necessary.
 */
  private subscribeEvents() {
    this.connectNetworkEvent(this.owner, WaypointEvents.updateTargetPosition, (data) => {
      this.onUpdateTarget(data.newPosition);
    });

    this.connectNetworkEvent(this.owner, WaypointEvents.stopwaypointArrow, () => {
      this.toggleVisibility(false);
      this.isVisible = false;
      this.stopWaypointArrowUpdate();
    });
  }

  /**
   * Toggle the visibility of the waypoint arrows.
   * @param isVisible Whether the arrows should be visible or not.
   */
  private toggleVisibility(isVisible: boolean) {
    if (isVisible) {
      this.targetArrowVFX.play({ players: [this.owner] });
      this.waypointArrowVFX.play({ players: [this.owner] });
    } else {
      this.targetArrowVFX.stop({ players: [this.owner] });
      this.waypointArrowVFX.stop({ players: [this.owner] });
    }
  }

  /**
   * Start the update loop for the waypoint arrow.
   */
  private startWaypointArrowUpdate() {
    this.updateIntervalId = this.async.setInterval(() => {
      this.arrowUpdate();
    }, 10); // Update every 0.1 seconds  
  }

  /**
   * Stop the update loop for the waypoint arrow.
   */
  private stopWaypointArrowUpdate() {
    if (this.updateIntervalId !== null) {
      this.async.clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  }

  /**
   * Update the position and rotation of the waypoint arrow.
   */
  private arrowUpdate() {
    const playerPos = this.owner.position.get();
    const targetPos = this.targetPosition;

    const direction = targetPos.sub(playerPos).normalize();
    const horizontalDir = new hz.Vec3(direction.x, 0, direction.z);

    const rotation = hz.Quaternion.lookRotation(horizontalDir, hz.Vec3.up);
    this.waypointArrow.rotation.set(rotation);
  }

  /**
   * Update the target position and the arrow's position.
   * @param newPosition The new target position.
   */
  private onUpdateTarget(newPosition: hz.Vec3) {
    this.targetPosition = newPosition;
    this.targetArrow.position.set(newPosition);
    if (!this.isVisible) {
      this.toggleVisibility(true);
      this.isVisible = true;
      this.startWaypointArrowUpdate();
    }
  }

  /**
   * Attach the waypoint arrow to the player's torso.
   */
  private attachToPlayer() {
    this.waypointArrow.as(hz.AttachableEntity).attachToPlayer(this.owner, hz.AttachablePlayerAnchor.Torso);
  }
}

// Register the component.
hz.Component.register(WaypointArrows);