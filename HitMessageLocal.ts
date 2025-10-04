/**
 * Grow A World Resource Spawner by PigeonNo12 is marked CC0 1.0. To view a copy of this mark, visit https://creativecommons.org/publicdomain/zero/1.0/
 */

import { AudioGizmo, Component, EventSubscription, NetworkEvent, PhysicalEntity, PhysicsForceMode, Player, PlayerVisibilityMode, PropTypes, TextGizmo, Vec3, World } from "horizon/core";

export const NotifyHit = new NetworkEvent<{ message: string, position: Vec3 }>('NotifyHit');

/**
 * Player feedback is always a good thing. This component is used to display
 * a hit message when the player hits a resource with the harvester tool.
 */
class HitMessageLocal extends Component<typeof HitMessageLocal> {
  static propsDefinition = {
    display: { type: PropTypes.Entity },
    sfx: { type: PropTypes.Entity },
  };
  private localPlayer!: Player
  private serverPlayer!: Player
  private physicsEntity!: PhysicalEntity
  private display!: TextGizmo
  private onUpdateSubscription?: EventSubscription

  private static MESSAGE_DURATION = 1 // seconds
  private static IMPULSE_STRENGTH = 12 // Adjust the strength according to the gravity settings
  private static FONT = "<b><font=liberationsans sdf><material=liberationsans sdf - overlay>"

  preStart() {
    this.localPlayer = this.world.getLocalPlayer()
    this.serverPlayer = this.world.getServerPlayer()
    this.physicsEntity = this.entity.as(PhysicalEntity)

    if (this.props.display) {
      this.display = this.props.display.as(TextGizmo)
    } else {
      throw new Error("HitMessageLocal requires a display TextGizmo entity.");
    }

    this.entity.setVisibilityForPlayers([this.localPlayer], PlayerVisibilityMode.VisibleTo)

    if (this.localPlayer === this.serverPlayer) {
      return
    }

    this.connectNetworkEvent(this.localPlayer, NotifyHit, ({ message, position }) => {
      this.activateMessageAtPosition(message, position)
    })

  }

  start() {
    this.deactivate()
  }

  private deactivate() {
    this.physicsEntity.locked.set(true)
    this.display.text.set("")
  }

  private activateMessageAtPosition(message: string, position: Vec3) {
    if (this.onUpdateSubscription) {
      this.onUpdateSubscription.disconnect()
      this.deactivate()
    }

    let frames = 0
    let elapsedTime = 0
    const randomImpulse = new Vec3((-1 + Math.random() * 2), 1 + Math.random() * 2, (-1 + Math.random() * 2)).normalize()
      .mul(HitMessageLocal.IMPULSE_STRENGTH)
    this.onUpdateSubscription = this.connectLocalBroadcastEvent(World.onUpdate, ({ deltaTime }) => {
      elapsedTime += deltaTime
      if (elapsedTime >= HitMessageLocal.MESSAGE_DURATION) {
        this.onUpdateSubscription?.disconnect()
        this.deactivate()
        return
      }

      frames++

      switch (frames) {
        case 1:
          this.entity.position.set(position)
          break
        case 2:
          this.display.text.set(HitMessageLocal.FONT + message)
          break
        case 3:
          this.physicsEntity.locked.set(false)
          break
        case 4:
          this.physicsEntity.applyForce(randomImpulse, PhysicsForceMode.Impulse)
          this.props.sfx?.as(AudioGizmo).play({ players: [this.localPlayer], fade: 0 })
          break
        default:
          break
      }
    })
  }
}
Component.register(HitMessageLocal);