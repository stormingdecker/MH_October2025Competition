/**
 * Grow A World Resource Spawner by PigeonNo12 is marked CC0 1.0. To view a copy of this mark, visit https://creativecommons.org/publicdomain/zero/1.0/
 */

import { AudioGizmo, CodeBlockEvents, Component, PhysicalEntity, Player, PropTypes, Quaternion, Vec3 } from "horizon/core";
import { SpawnManager } from "ResourceManager";

/**
 * This is a very basic class for a tool that can be used to harvest resources.
 * It can be grabbed and thrown around. When it collides with a resource,
 * it will notify the SpawnManager to apply damage to the resource based
 * on the strength property.
 * 
 * IMPORTANT: In order for the harvester to work properly, it needs to have
 * physics enabled, and configured to detect collision with Entities Tagged with
 * the tag defined in ResourceManager.GENERIC_TAG (default: "SpawnedEntity").
 * This is done to avoid detecting collisions with other objects in the world
 * that are not resources.
 * 
 * The harvester will return to its original position and rotation after
 * being dropped for a certain amount of time (defined by RETURN_DELAY).
 * This is to prevent the harvester from being lost or stuck in unreachable places.
 */
class Harvester extends Component<typeof Harvester> {
  static propsDefinition = {
    strength: { type: PropTypes.Number, default: 10 },
    sfxHit: { type: PropTypes.Entity },
  };
  private originalPosition!: Vec3
  private originalRotation!: Quaternion
  private returnTimeoutId?: number
  private currentPlayer?: Player
  private okToHitAfter = 0

  private static RETURN_DELAY = 5 * 1000 // 5 seconds
  private static COLLISION_COOLDOWN = 500 // milliseconds
  private static MIN_HIT_SPEED = 2 // minimum speed to register a hit

  override preStart() {
    this.originalPosition = this.entity.position.get()
    this.originalRotation = this.entity.rotation.get()

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabStart, (rightHand, player) => {
      this.currentPlayer = player
      this.entity.as(PhysicalEntity).locked.set(false)
      if (this.returnTimeoutId) {
        this.async.clearTimeout(this.returnTimeoutId)
      }
    })

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabEnd, (player) => {
      // Alternatively, this could be moved inside the timeout function, to make it possible
      // to throw the harvester to the resource and collect it from a distance.
      this.currentPlayer = undefined

      if (this.returnTimeoutId) {
        this.async.clearTimeout(this.returnTimeoutId)
      }

      this.returnTimeoutId = this.async.setTimeout(() => {
        this.deactivate()
      }, Harvester.RETURN_DELAY)
    })

    // If you create new harvest tools, these is the subscription that makes them work with static objects
    // Reiterating, make sure that the tool has physics enabled, and that it's configured to detect collision
    // with Entities Tagged with the tag defined in ResourceManager.GENERIC_TAG
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnEntityCollision, (collidedWith, collisionAt, normal, relativeVelocity, localColliderName, OtherColliderName) => {
      const now = Date.now()
      if (now < this.okToHitAfter) {
        return
      }
      this.okToHitAfter = now + Harvester.COLLISION_COOLDOWN

      this.props.sfxHit?.as(AudioGizmo).play({ players: [this.currentPlayer!], fade: 0 })

      // Further optimization could be done here by checking the relativeVelocity
      // It does require a lot of testing to make sure that it works for your experience

      if (this.currentPlayer) {
        SpawnManager.instance.hitResource(collidedWith, this.props.strength, this.currentPlayer, collisionAt)
      }
    })

    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnIndexTriggerDown, (player) => {
      player.playAvatarGripPoseAnimationByName("Fire")
    })
  }

  override start() {
    this.deactivate()
  }

  private deactivate() {
    this.entity.as(PhysicalEntity).locked.set(true)
    this.entity.position.set(this.originalPosition)
    this.entity.rotation.set(this.originalRotation)
  }
}
Component.register(Harvester);