import { Entity, CodeBlockEvents } from "horizon/core";
import {
  Component,
  PropTypes,
  Quaternion,
  Vec3,
  World,
  AudioGizmo,
  ParticleGizmo,
  EventSubscription,
} from "horizon/core";

import { CodeBlockEvent, Player } from "horizon/core";
import { InventoryManager } from "InventoryManager";
import { sysEvents } from "sysEvents";
import { getEntityListByTag, ManagerType } from "sysHelper";
import { InventoryType } from "sysTypes";
import { oneHudEvents } from "UI_OneHUDEvents";

const ExtraTriggerCodeBlockEvents = {
  PlayerOccupied: new CodeBlockEvent<[Player]>("occupied", [PropTypes.Player]),
  PlayerEmpty: new CodeBlockEvent<[Player]>("empty", [PropTypes.Player]),

  EntityOccupied: new CodeBlockEvent<[Entity]>("occupied", [PropTypes.Entity]),
  EntityEmpty: new CodeBlockEvent<[Entity]>("empty", [PropTypes.Entity]),
};

class TreasureOnTrigger extends Component<typeof TreasureOnTrigger> {
  static propsDefinition = {
    trigger: { type: PropTypes.Entity },
    treasureChest: { type: PropTypes.Entity },
    scaleFactor: { type: PropTypes.Number, default: 2 },
    scaleTime: { type: PropTypes.Number, default: 1 },
    objectToRotate: { type: PropTypes.Entity },
    rotationAngle: { type: PropTypes.Vec3, default: new Vec3(0, 90, 0) },
    apperVfx: { type: PropTypes.Entity },
    treasureVFX: { type: PropTypes.Entity },
    OpenSfx: { type: PropTypes.Entity },
    popUpSfx: { type: PropTypes.Entity },
    closeSfx: { type: PropTypes.Entity },
    treasure: { type: PropTypes.Entity },
  };

  private originalScale!: Vec3;
  private scaleFactor!: number;
  private scaleTime!: number;
  private updateLoop: EventSubscription | null = null;
  private isRotated = false;
  private originalRotation!: Quaternion;
  private treasure?: Entity;
  private treasureChest?: Entity;
  private isCoolDown = false;
  private isTriggerOccupied = false;

  preStart(): void {
    // this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, () => {
    //   this.scaleObject();
    // });
    this.originalRotation = this.props.objectToRotate!.rotation.get();
    if (this.props.treasure) {
      this.treasure = this.props.treasure.as(Entity);
      this.treasure.visible.set(false);
    }

    this.originalScale = this.props.treasureChest!.scale.get();
    this.scaleFactor = this.props.scaleFactor!;
    this.scaleTime = this.props.scaleTime!;
    this.connectCodeBlockEvent(
      this.props.trigger!,
      ExtraTriggerCodeBlockEvents.PlayerOccupied,
      (player) => {
        this.isTriggerOccupied = true;

        this.open(player);
      }
    );
    this.connectCodeBlockEvent(
      this.props.trigger!,
      ExtraTriggerCodeBlockEvents.PlayerEmpty,
      (player) => {
        this.isTriggerOccupied = false;
        this.close(player);
      }
    );
  }

  override start() {}

  open(player: Player) {
    if (this.isCoolDown) {
      return; // Prevent triggering again during cooldown
    }
    this.isCoolDown = true; // Start cooldown`
    if (this.props.apperVfx) {
      const apperVfx = this.props.apperVfx.as(ParticleGizmo);
      apperVfx.play();
    }
    this.props.treasureChest?.visible.set(true);
    this.props.OpenSfx?.as(AudioGizmo).play();
    this.scaleObject();
    this.async.setTimeout(() => {
      this.rotateObject();
    }, 400);
    this.async.setTimeout(() => {
      this.isCoolDown = false; // Reset cooldown after hiding the chest

      if (!this.isTriggerOccupied) {
        this.close(player);
      }

      //Future note: this is hack
      // const oneHud = getEntityListByTag(ManagerType.UI_OneHUD, this.world)[0];
      // this.sendNetworkEvent(oneHud, oneHudEvents.UpdateInventoryUI, {
      //   player: player,
      //   inventoryType: InventoryType.currency,
      //   newValue: 500,
      // });
      this.sendNetworkBroadcastEvent(sysEvents.UpdatePlayerInventory, {
        player: player,
        item: InventoryType.currency,
        quantity: 500,
        sender: this.entity,
      });
    }, 2000);
  }

  close(player: Player) {
    if (this.isCoolDown) {
      return; // Prevent triggering again during cooldown
    }
    this.isCoolDown = true; // Start cooldown
    if (this.isRotated) {
      this.props.objectToRotate!.rotation.set(this.originalRotation);
      this.isRotated = false;
      this.treasure?.visible.set(false); // Hide treasure when closing
      this.props.closeSfx?.as(AudioGizmo).play();
      this.async.setTimeout(() => {
        this.scaleDownObject();
      }, 1000);
      this.async.setTimeout(() => {
        this.props.treasureChest?.visible.set(false);
      }, 1500);
    }

    this.async.setTimeout(() => {
      this.isCoolDown = false; // Reset cooldown after hiding the chest
      if (this.isTriggerOccupied) {
        this.open(player);
      }
    }, 2000);
  }

  scaleObject() {
    const startScale = this.originalScale;
    const endScale = startScale.mul(this.scaleFactor);
    const startTime = Date.now();

    this.updateLoop = this.connectLocalBroadcastEvent(World.onUpdate, (data) => {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000;
      const scale = Vec3.lerp(startScale, endScale, elapsedTime / this.scaleTime);

      this.props.treasureChest!.scale.set(scale);

      if (elapsedTime >= this.scaleTime) {
        if (this.updateLoop) {
          this.updateLoop.disconnect();
          this.updateLoop = null;
        }
      }
    });
  }

  scaleDownObject() {
    const startScale = this.props.treasureChest!.scale.get();
    const endScale = this.originalScale;
    const startTime = Date.now();

    this.updateLoop = this.connectLocalBroadcastEvent(World.onUpdate, (data) => {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000;
      const scale = Vec3.lerp(startScale, endScale, elapsedTime / this.scaleTime);

      this.props.treasureChest!.scale.set(scale);

      if (elapsedTime >= this.scaleTime) {
        if (this.updateLoop) {
          this.updateLoop.disconnect();
          this.updateLoop = null;
        }
      }
    });
  }

  rotateObject() {
    const object = this.props.objectToRotate!;
    const rotation = object.rotation.get();
    const angle = this.isRotated
      ? negateVec3(this.props.rotationAngle!)
      : this.props.rotationAngle!;
    const newRotation = Quaternion.mul(rotation, Quaternion.fromEuler(angle));
    object.rotation.set(newRotation);

    this.isRotated = !this.isRotated;
    if (this.isRotated) {
      // Play sound and particle effects
      this.async.setTimeout(() => {
        this.props.popUpSfx?.as(AudioGizmo).play();
      }, 600);
      this.props.treasureVFX?.as(ParticleGizmo).play();

      // Show or hide treasure depending on the rotation
      // show treasure with delay
      this.async.setTimeout(() => {
        this.treasure?.visible.set(this.isRotated);
      }, 1000);
    } else {
      this.props.popUpSfx?.as(AudioGizmo).stop();
      this.props.treasureVFX?.as(ParticleGizmo).stop();
      this.treasure?.visible.set(false);
      this.props.closeSfx?.as(AudioGizmo).play();
    }
  }
}

function negateVec3(vec: Vec3): Vec3 {
  return new Vec3(-vec.x, -vec.y, -vec.z);
}

Component.register(TreasureOnTrigger);
