import { DailyRewardManager } from 'DailyRewardManager';
import { CodeBlockEvents, Component, Entity, EulerOrder, Player, PropTypes, Quaternion, TriggerGizmo, Vec3 } from 'horizon/core';
import { StatsManager } from 'StatsManager';
import { sysEvents } from 'sysEvents';
import { getEntityListByTag, ManagerType } from 'sysHelper';
import { InventoryType } from 'sysTypes';
import { getMgrClass } from 'sysUtils';
import { animateScaleEvent } from 'TweenHandler';
import { playVFX, PlayVFXAtPosition, VFXLabel } from 'VFXManager';

class T_DailyReward extends Component<typeof T_DailyReward> {
  static propsDefinition = {
    prizeGFX: { type: PropTypes.Entity },
  };

  dailyRewardManager: DailyRewardManager | undefined = undefined;
  activePlayer!: Player;

  preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, this.OnPlayerEnterTrigger.bind(this));
    this.connectNetworkEvent(this.entity, sysEvents.setWhoCanTriggerEvent, (data) => {
      this.entity.as(TriggerGizmo).setWhoCanTrigger(data.whoCanTrigger);
    });
  }

  start(){
    this.dailyRewardManager = getMgrClass<DailyRewardManager>(this, ManagerType.DailyRewardManager, DailyRewardManager);
    // Initially disable trigger to prevent triggering
    // this.entity.as(TriggerGizmo).setWhoCanTrigger([]);
    this.entity.as(TriggerGizmo).setWhoCanTrigger('anyone');
  }

  OnPlayerEnterTrigger(player: Player) {
    this.activePlayer = player;

    if (this.tryClaimDailyReward() === false) return;

    this.shakePrizeRotationForOneSecond();
    this.slowGrowPrizeOverOneSecond();

    this.entity.as(TriggerGizmo).setWhoCanTrigger([]);
    this.async.setTimeout(() => {
      this.entity.as(TriggerGizmo).setWhoCanTrigger('anyone');
    }, 2 * 1000);
  }

  async shakePrizeRotationForOneSecond() {
    const prize = this.props.prizeGFX!;
    if (!prize) return;

    const originalRot = prize.rotation.get();
    const duration = 1.0; // total seconds to shake
    const intensity = 10; // degrees to shake each time
    const interval = 0.06; // how often to shake
    const totalShakes = Math.floor(duration / interval);

    for (let i = 0; i < totalShakes; i++) {
      // Random offset in X, Y, Z rotation (in degrees)
      const offsetEuler = new Vec3(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      );
      // Assuming a Quaternion class exists with fromEuler method
      const offsetQuat = Quaternion.fromEuler(offsetEuler, EulerOrder.XYZ);

      prize.rotation.set(originalRot.mul(offsetQuat));
      await new Promise(resolve => this.async.setTimeout(resolve, interval * 1000));
    }
    
    // Reset to original rotation
    prize.rotation.set(originalRot);

    const tweenHandler = getEntityListByTag("TweenHandler", this.world)[0];
    this.sendNetworkEvent(tweenHandler!, animateScaleEvent, { targetEntity: this.props.prizeGFX! });
    this.showAward();
  }

  async slowGrowPrizeOverOneSecond() {
    const prize = this.props.prizeGFX!;
    if (!prize) return;

    const originalScale = prize.scale.get();
    const targetScale = originalScale.mul(1.5); // grow to 150%
    const duration = 1.0; // total seconds to grow
    const steps = 20; // number of steps to interpolate
    const interval = duration / steps;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const newScale = Vec3.lerp(originalScale, targetScale, t);
      prize.scale.set(newScale);
      if (i === steps) {
        this.cleanupPrize();
      }
      await new Promise(resolve => this.async.setTimeout(resolve, interval * 1000));
    }

    // Ensure final scale is set
    prize.scale.set(targetScale);   
  }

  tryClaimDailyReward(): boolean {
    //get daily
    const utcNow = Date.now();
    if (this.dailyRewardManager?.tryClaimDailyReward(this.activePlayer, utcNow)) {
      console.log("Player claiming daily reward");
      return true;
    }
    else{
      console.log("Player already claimed daily reward today");
      return false;
    }
  }

  showAward() {
    // const statsManager = getEntityListByTag(ManagerType.StatsManager, this.world)[0];
    // this.sendNetworkEvent(statsManager!, sysEvents.dailyRewardClaimed, { player: this.activePlayer, utc: Date.now() });

    playVFX(this, VFXLabel.sparkles, [this.activePlayer], this.entity.position.get(), this.entity.rotation.get());
    console.log("Award the player!");
    // Implement award logic here, e.g., give points, items, etc.
    const inventoryManager = getEntityListByTag(ManagerType.InventoryManager, this.world)[0];
    this.sendNetworkEvent(inventoryManager!, sysEvents.UpdatePlayerInventory, {
      player: this.activePlayer,
      item: InventoryType.currency,
      quantity: 10,
      sender: this.entity
    });

  }

  cleanupPrize() {
    // this.entity.position.set(new Vec3(0, -1000, 0));
  }
}

Component.register(T_DailyReward);
