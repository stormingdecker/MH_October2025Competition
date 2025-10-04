import { Entity, Vec3, TriggerGizmo, Asset, PropTypes, Component, CodeBlockEvents, Player, CodeBlockEvent } from 'horizon/core';

const ExtraTriggerCodeBlockEvents = {
  PlayerOccupied: new CodeBlockEvent<[Player]>(
    'occupied',
    [PropTypes.Player]
  ),
  PlayerEmpty: new CodeBlockEvent<[Player]>(
    'empty',
    [PropTypes.Player]
  ),

  EntityOccupied: new CodeBlockEvent<[Entity]>(
    'occupied',
    [PropTypes.Entity]
  ),
  EntityEmpty: new CodeBlockEvent<[Entity]>(
    'empty',
    [PropTypes.Entity]
  )
}

class RandomObjectPlacer extends Component<typeof RandomObjectPlacer> {
  static propsDefinition = {
    trigger: { type: PropTypes.Entity },
    objectToSpawn: { type: PropTypes.Asset },
    numObjects: { type: PropTypes.Number, default: 5 },
  };

  private spawnedEntities: Entity[] = [];
  private isOktoSpawn = true;
  private resetCooldown: number = 0;

  start() {
    this.connectCodeBlockEvent(this.entity, ExtraTriggerCodeBlockEvents.PlayerOccupied, async (player) => {
      if (this.isOktoSpawn) {

        this.isOktoSpawn = false;
        this.async.clearTimeout(this.resetCooldown);
        const triggerProp = this.props.trigger!;
        const triggerGizmo = triggerProp.as(TriggerGizmo)!;
        const objectToSpawn = this.props.objectToSpawn!;
        const numObjects = Math.max(0, this.props.numObjects!);

        // Clear previous spawns
        // this.clearSpawnedEntities();

        for (let i = 0; i < numObjects; i++) {
          const randomPosition = this.getRandomPositionInsideTrigger(triggerGizmo);
          const spawned = await this.world.spawnAsset(objectToSpawn, randomPosition);
          for (const ent of spawned) {
            this.spawnedEntities.push(ent);
          }
        }
      } else {
        this.async.clearTimeout(this.resetCooldown);
      }

    });

    this.connectCodeBlockEvent(this.entity, ExtraTriggerCodeBlockEvents.PlayerEmpty, (player) => {
      this.async.clearTimeout(this.resetCooldown);
      this.resetCooldown = this.async.setTimeout(() => {
        this.isOktoSpawn = true;
        this.clearSpawnedEntities();
      }, 3000);

    });
  }

  getRandomPositionInsideTrigger(trigger: TriggerGizmo): Vec3 {
    const bounds = trigger.getPhysicsBounds();
    const min = bounds.min();
    const max = bounds.max();

    // Define padding from each edge
    const paddingX = (max.x - min.x) * 0.1; // 10% padding from left/right
    const paddingY = (max.y - min.y) * 0.05; // Small vertical padding
    const paddingZFront = (max.z - min.z) * 0.2; // More padding front
    const paddingZBack = (max.z - min.z) * 0.2;  // More padding back

    const randomX = Math.random() * ((max.x - paddingX) - (min.x + paddingX)) + (min.x + paddingX);
    const randomY = Math.random() * ((max.y - paddingY) - (min.y + paddingY)) + (min.y + paddingY);
    const randomZ = Math.random() * ((max.z - paddingZBack) - (min.z + paddingZFront)) + (min.z + paddingZFront);

    return new Vec3(randomX, randomY, randomZ);
  }


  async clearSpawnedEntities() {
    const toDelete = [...this.spawnedEntities];
    this.spawnedEntities = [];

    for (const entity of toDelete) {
      if (entity) {
        try {
          await this.world.deleteAsset(entity);
        } catch (err) {
          console.warn(`Could not delete entity:`, err);
        }
      }
    }
  }


}

Component.register(RandomObjectPlacer);

// import { Entity, Vec3, TriggerGizmo, Asset, PropTypes, Component, CodeBlockEvents, Player } from 'horizon/core';

// class RandomObjectPlacer extends Component<typeof RandomObjectPlacer> {
//   static propsDefinition = {
//     trigger: { type: PropTypes.Entity },
//     objectToSpawn: { type: PropTypes.Asset },
//     numObjects: { type: PropTypes.Number, default: 5 },
//   };

//   private spawnedEntities: Entity[] = [];

//   start() {
//     this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, async () => {
//       const triggerProp = this.props.trigger!;
//       const triggerGizmo = triggerProp.as(TriggerGizmo)!;
//       const objectToSpawn = this.props.objectToSpawn!;
//       const numObjects = this.props.numObjects!;

//       // Clear previous spawns
//       this.clearSpawnedEntities();

//       const qtyToSpawn = Math.max(0, this.spawnedEntities.length - numObjects); // Ensure at least one object is spawned
//       for (let i = 0; i < qtyToSpawn; i++) {
//         const randomPosition = this.getRandomPositionInsideTrigger(triggerGizmo);

//         const spawnedEntities = await this.world.spawnAsset(objectToSpawn, randomPosition);

//         // Support both single and multiple entities (depending on asset complexity)
//         for (const ent of spawnedEntities) {
//           this.spawnedEntities.push(ent);
//         }
//       }
//     });

//     this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerExitTrigger, () => {
//       this.clearSpawnedEntities();
//     });
//   }

//   getRandomPositionInsideTrigger(trigger: TriggerGizmo): Vec3 {
//     const bounds = trigger.getPhysicsBounds();
//     const min = bounds.min();
//     const max = bounds.max();

//     const randomX = Math.random() * (max.x - min.x) + min.x;
//     const randomY = Math.random() * (max.y - min.y) + min.y;
//     const randomZ = Math.random() * (max.z - min.z) + min.z;

//     return new Vec3(randomX, randomY, randomZ);
//   }

//   clearSpawnedEntities() {
//     for (const entity of this.spawnedEntities) {
//       if (entity) {
//         this.world.deleteAsset(entity)
//       }
//     }
//     this.spawnedEntities = [];
//   }

// }

// Component.register(RandomObjectPlacer);
