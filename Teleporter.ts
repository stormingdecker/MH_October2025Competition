
import * as hz from 'horizon/core'

/**
 * Base Teleporter class;
 * 
 * Teleports a player to a destination (SpawnPointGizmo).
 * 
 * Note: MUST BE attached to a trigger as it uses onTriggerEvent for teleporter logic.
 * 
 * Props:
 * @param destination - SpawnPointGizmo teleporter destination.
 * 
 */

export class Teleporter<T> extends hz.Component<typeof Teleporter & T> {
  static propsDefinition = {
    destination: { type: hz.PropTypes.Entity },     // Spawnpoint Gizmo
  }

  /**
   * Sets up onTriggerEvent that goes through the teleportation logic.
   */
  start() {
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, (player: hz.Player) => {
        if (this.canTeleport(player)) {
          // Teleport
          this.teleport(player)
        } else {
          console.log(`${player.name} teleport denied`)
        }
    })
  }

  /**
   * Returns true if the player can teleport, false othewise.
   * @param player - Player.
   */
  protected canTeleport(player: hz.Player): boolean {
    if (this.props.destination == undefined) {
      console.error("Cannot teleport to a location that is undefined")
      return false
    }
    return true
  }

  /**
   * Teleports a given player to the set destination.
   * @param player - Player.
   */
  protected teleport(player: hz.Player) {
    this.props.destination?.as(hz.SpawnPointGizmo).teleportPlayer(player)
  }
}
hz.Component.register(Teleporter)