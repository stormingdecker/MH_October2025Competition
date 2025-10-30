import { CodeBlockEvents, Component, Entity, Player, SpawnPointGizmo } from 'horizon/core';
import { getEntityListByTag } from 'sysHelper';

class T_RespawnByProximity extends Component<typeof T_RespawnByProximity>{
  static propsDefinition = {};

  private spawnPoints: SpawnPointGizmo[] = [];

  preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, this.OnPlayerEnterTrigger.bind(this));
  }

  start() {
    const spawnPointEntities = getEntityListByTag("SpawnPoint", this.world);
    this.spawnPoints = spawnPointEntities.map(entity => entity.as(SpawnPointGizmo)).filter((gizmo): gizmo is SpawnPointGizmo => gizmo !== null);
  }

  OnPlayerEnterTrigger(player: Player) {
    //find the closest spawn point
    let closestSpawnPoint: SpawnPointGizmo | null = null;
    let closestDistance = Number.MAX_VALUE;

    for (const spawnPoint of this.spawnPoints) {
      const distance = player.position.get().distance(spawnPoint.position.get());
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSpawnPoint = spawnPoint;
      }
    }

    if (closestSpawnPoint) {
      closestSpawnPoint.teleportPlayer(player);
    }
  }

}
Component.register(T_RespawnByProximity);