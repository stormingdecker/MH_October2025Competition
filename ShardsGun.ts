// Copyright (c) Richard Lee (Shards632). Released under the MIT License.

import {
  AttachableEntity,
  AttachablePlayerAnchor,
  AudioGizmo,
  AvatarGripPoseAnimationNames,
  CodeBlockEvents,
  Color,
  Component,
  Entity,
  GrabbableEntity,
  Handedness,
  ParticleGizmo,
  Player,
  ProjectileLauncherGizmo,
  PropTypes,
  Vec3,
} from "horizon/core";
import { AnimatedBinding, Animation, Binding, Easing, Text, UIComponent, View } from "horizon/ui";
import { StatsManager } from "StatsManager";
import { sysEvents } from "sysEvents";
import { getEntityListByTag, ManagerType } from "sysHelper";
import { StatType } from "sysTypes";
import { DefaultBlankImgAssetID, numberUp } from "sysUIStyleGuide";
import { stringToColor } from "sysUtils";
// import { oneHudEvents } from "UI_OneHUD";

/**
 * The state transferred between owners of the gun
 */
type GunState = {
  currentAmmo: number;
};

// binding shared between Gun and the AmmoUI
const ammoAmountBinding = new Binding(0);
const ammoCapacityBinding = new Binding(0);

/**
 * A gun that tracks remaining ammo as it is transfered between players.
 * Ammo can be replenished by picking up a matching ammo box.
 * Gun can be customized with various props for max capacity, damage,
 * VFX, SFX. Gun mesh is a separate child entity and can be replaced
 * at will.
 *
 * Shares bindings with the AmmoUI component in this module.
 */
class Gun extends Component<typeof Gun, GunState> {
  static propsDefinition = {
    autoFire: { type: PropTypes.Boolean, default: false },
    // the type of ammo box that fits this gun
    ammoType: { type: PropTypes.String, default: "bullet" },
    // amount of health damage done by being hit by ammo
    ammoDamage: { type: PropTypes.Number, default: 1 },
    // max capacity of the gun.
    ammoCapacity: { type: PropTypes.Number, default: 10 },
    // muzzle velocity of the projectile
    muzzleVelocity: { type: PropTypes.Number, default: 100 }, // meters per second
    // max effective range of the gun
    range: { type: PropTypes.Number, default: 30 }, // meters
    // visual effect for firing the gun (optional)
    muzzleVfx: { type: PropTypes.Entity },
    // sound effect for firing the gun (optional)
    fireSfx: { type: PropTypes.Entity },
    // sound effect for firing when empty (optional)
    emptySfx: { type: PropTypes.Entity },
    // sound effect for reloading the gun (optional)
    reloadSfx: { type: PropTypes.Entity },
    // visual effect for hitting a target (optional)
    hitVfx: { type: PropTypes.Entity },
    // sound effect for hitting a target (optional)
    hitSfx: { type: PropTypes.Entity },
    // sound effect for missing target (optional)
    missSfx: { type: PropTypes.Entity },

    /* internal configuration */
    // the projectile launcher
    launcher: { type: PropTypes.Entity },
    // the ammo UI
    ammoUI: { type: PropTypes.Entity },
  };

  // remaining ammo in gun
  private currentAmmo = 0;
  private localPlayer: Player | undefined;

  private AmmoUI: AmmoUI | undefined;
  private statsMgrEntity: Entity | undefined;

  //region preStart()
  override preStart() {
    if (!this.props.launcher || !this.props.ammoUI) {
      console.error("Gun requires launcher and ammo UI to function");
      return;
    }
    const player = this.world.getLocalPlayer();
    if (player !== this.world.getServerPlayer()) {
      // listen for ammo pickup events by the player
      this.connectNetworkEvent(player, sysEvents.pickupAmmo, ({ ammoType, amount }) =>
        this.onAmmoPickup(ammoType, amount)
      );
    }
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnGrabEnd, () => this.onRelease());
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnIndexTriggerDown, (player) => this.onFire(player));
    this.connectCodeBlockEvent(this.props.launcher, CodeBlockEvents.OnProjectileHitPlayer, (playerHit, position) =>
      this.onHit(playerHit, position)
    );
    this.connectCodeBlockEvent(this.props.launcher, CodeBlockEvents.OnProjectileHitEntity, (entityHit, position) =>
      this.onHit(entityHit, position)
    );
    this.connectCodeBlockEvent(this.props.launcher, CodeBlockEvents.OnProjectileExpired, (position) =>
      this.onMiss(position)
    );
  }

  //region start()
  override start() {
    if (this.props.autoFire) {
      this.async.setInterval(() => {
        this.autoFire();
      }, 2000);
    }

    if (this.entity.owner.get().id === this.world.getServerPlayer().id) {
      console.log("gun owned by server at start");
      return;
    }

    console.log("gun owned by player client ");
    this.localPlayer = this.entity.owner.get();
    this.entity.as(GrabbableEntity).setWhoCanGrab([this.localPlayer]);
    this.async.setTimeout(() => {
      const grabbable = this.entity.as(GrabbableEntity);
      if (grabbable) {
        const hand = Handedness.Right;
        grabbable.forceHold(this.localPlayer!, hand, true);
      }
    }, 500);

    this.getEntityProps().forEach((entity) => {
      entity.owner.set(this.localPlayer!);
    });

    const raceConditionDelay = 500;
    this.async.setTimeout(() => {
      this.AmmoUI = this.props.ammoUI!.getComponents<AmmoUI>(AmmoUI)[0];
      this.onAmmoPickup(this.props.ammoType, this.props.ammoCapacity);
    }, raceConditionDelay);

    this.statsMgrEntity = getEntityListByTag(ManagerType.StatsManager, this.world)[0];

    // by default, reload gun to max capacity
  }

  //region transferOwnership()
  override transferOwnership(oldPlayer: Player, newPlayer: Player): GunState {
    this.getEntityProps().forEach((entity) => {
      entity.owner.set(newPlayer);
    });
    // get all the sub-parts on their way transferring to the new player
    // send the current ammo count to the new owner
    // const grabbable = this.entity.as(GrabbableEntity);
    // if (grabbable){
    //   const hand = Handedness.Right;
    //   grabbable.forceHold(newPlayer, hand, true);
    // }
    return {
      currentAmmo: this.currentAmmo,
    };
  }

  //region receiveOwnership()
  override receiveOwnership(state: GunState | null) {
    if (state) {
      // receive the current ammo count from the old owner
      // this.currentAmmo = state.currentAmmo;
      // ammoAmountBinding.set(this.currentAmmo);
    }
  }

  //region onAmmoPickup
  private onAmmoPickup(ammoType: string, amount: number) {
    console.log(`Picked up ${amount} of ${ammoType}`);
    if (ammoType === this.props.ammoType) {
      this.currentAmmo = Math.min(this.currentAmmo + amount, this.props.ammoCapacity);

      this.AmmoUI?.setAmmo(this.localPlayer!, ` ${this.currentAmmo} / ${this.props.ammoCapacity} `);
      this.props.reloadSfx?.as(AudioGizmo).play();
    } else {
      console.warn(`Wrong ammo type: ${ammoType} for gun type ${this.props.ammoType}`);
    }
  }

  //region onRelease()
  private onRelease() {
    // revert ownership to the server
    // this.entity.owner.set(this.world.getServerPlayer());
    let attachableEntity = this.entity.as(AttachableEntity);
    attachableEntity?.attachToPlayer(this.localPlayer!, AttachablePlayerAnchor.Torso);
  }

  //region onFire()
  private onFire(player: Player) {
    if (this.currentAmmo <= 0) {
      // no more ammo
      this.props.emptySfx?.as(AudioGizmo).play();
      return;
    }
    player.playAvatarGripPoseAnimationByName(AvatarGripPoseAnimationNames.Fire);
    this.currentAmmo--;

    this.AmmoUI?.setAmmo(this.localPlayer!, ` ${this.currentAmmo} / ${this.props.ammoCapacity} `);
    this.props.launcher!.as(ProjectileLauncherGizmo).launch({
      speed: this.props.muzzleVelocity,
      duration: this.props.range / this.props.muzzleVelocity,
    });
    this.props.muzzleVfx?.as(ParticleGizmo).play();
    this.props.fireSfx?.as(AudioGizmo).play();
  }

  //region autoFire()
  private autoFire() {
    this.props.launcher!.as(ProjectileLauncherGizmo).launch({
      speed: this.props.muzzleVelocity,
      duration: this.props.range / this.props.muzzleVelocity,
    });
    this.props.muzzleVfx?.as(ParticleGizmo).play();
    this.props.fireSfx?.as(AudioGizmo).play();
  }

  //region onHit()
  // we do the same thing whether hitting a player or entity.
  private onHit(target: Player | Entity, position: Vec3) {
    if (target instanceof Player) {
      console.log(`Damaging player ${target.name.get()} for ${this.props.ammoDamage}`);
      this.sendNetworkEvent(this.statsMgrEntity!, sysEvents.UpdatePlayerStat, {
        player: target,
        statType: StatType.health,
        value: -this.props.ammoDamage,
      });
    } else {
      if(this.localPlayer){
        this.sendNetworkEvent(target, sysEvents.ammoHit, { player: this.localPlayer, damage: this.props.ammoDamage });
      }
  
    }
    // play hit sound at target
    const hitSfx = this.props.hitSfx;
    if (hitSfx) {
      hitSfx.position.set(position);
      hitSfx.as(AudioGizmo).play();
    }
    // play hit animation at target
    const hitVfx = this.props.hitVfx;
    if (hitVfx) {
      hitVfx.position.set(position);
      hitVfx.as(ParticleGizmo).play();
    }
  }

  private onMiss(position: Vec3) {
    const missSfx = this.props.missSfx;
    if (missSfx) {
      missSfx.position.set(position);
      missSfx.as(AudioGizmo).play();
    }
  }

  private getEntityProps() {
    // find all PropTypes.Entity values that are set on this component
    return Object.values(this.props).filter((value): value is Entity => value instanceof Entity);
  }
}
Component.register(Gun);

//region AmmoUI
/**
 * A very simple HUD that displays current ammo and capacity.
 *
 * Shares bindings with the Gun component in this module.
 */
export class AmmoUI extends UIComponent<typeof AmmoUI> {
  static propsDefinition = {
    //player level vars
    LEVEL_HEADER: { type: PropTypes.String, default: "Level" },
    ammoEnabled: { type: PropTypes.Boolean, default: true },
    ammoImgAsset: { type: PropTypes.Asset },
    ammoScreenPosition: { type: PropTypes.Vec3, default: new Vec3(80, 90, 11) },
    ammoScale: { type: PropTypes.Number, default: 1.0 },
    ammoNumColor: { type: PropTypes.Color, default: new Color(1, 1, 1) },
    ammoBackgroundOn: { type: PropTypes.Boolean, default: true },
    ammoBackgroundColor: { type: PropTypes.Color, default: new Color(0.1, 0.1, 0.1) },
  };

  //lvlUp Variables
  bnd_ammoNumber = new Binding<string>("0 / 50");
  animBnd_ammoScale = new AnimatedBinding(1);
  bnd_display = new Binding<string>("none");

  localPlayer: Player | undefined;

  override initializeUI() {
    const ammoImgAssetId = this.props.ammoImgAsset?.id?.toString() ?? DefaultBlankImgAssetID;
    // const backgroundColor = stringToColor("rgba(255, 0, 0, 1)");

    return View({
      children: [
        ...numberUp(
          this.bnd_ammoNumber,
          this.props.ammoEnabled,
          this.props.ammoScreenPosition,
          this.props.ammoScale,
          this.props.ammoBackgroundOn,
          // backgroundColor,
          this.props.ammoBackgroundColor,
          this.props.ammoNumColor,
          this.animBnd_ammoScale,
          ammoImgAssetId
        ),
      ],
      style: {
        // backgroundColor: "rgba(0, 0, 0, 0.5)",
        width: "100%",
        height: "100%",
        position: "absolute",
        // display: this.bnd_display,
      },
    });
  }

  //region preStart()
  preStart() {
    // level subscriptions
    // this.connectNetworkEvent(this.entity, oneHudEvents.SetPlayerLevelEvent, (data) => {
    //   this.setAmmo(data.player, data.level);
    // });
  }

  //region start()
  start() {
    if (this.entity.owner.get().id === this.world.getServerPlayer().id) {
      return;
    }

    console.log("AmmoUI owned by player client ");

    this.localPlayer = this.entity.owner.get();

    this.bnd_display.set("flex", [this.localPlayer]);
  }

  //region lvlUp()
  public setAmmo(player: Player, newValue: string): void {
    if (player.id !== this.localPlayer?.id) return;
    this.animBnd_ammoScale.set(2, undefined, [player]);
    this.bnd_ammoNumber.set(newValue, [player]);
    this.animBnd_ammoScale.set(
      Animation.timing(1, {
        duration: 100,
        easing: Easing.inOut(Easing.elastic(1)),
      }),
      undefined,
      [player]
    );
  }
}

Component.register(AmmoUI);
