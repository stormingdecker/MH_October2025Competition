import { DailyRewardManager } from "DailyRewardManager";
import {
  CodeBlockEvents,
  Component,
  Entity,
  EulerOrder,
  Player,
  PropTypes,
  Quaternion,
  TriggerGizmo,
  Vec3,
} from "horizon/core";
import { sysEvents } from "sysEvents";
import { getEntityListByTag, ManagerType, playVFXatPosition } from "sysHelper";
import { InventoryType } from "sysTypes";
import { getMgrClass } from "sysUtils";
import { animateScaleEvent } from "TweenHandler";
import { playVFX, PlayVFXAtPosition, VFXLabel } from "VFXManager";

class T_DailyReward extends Component<typeof T_DailyReward> {
  static propsDefinition = {
    prizeGFX: { type: PropTypes.Entity },
    day1Reward: { type: PropTypes.Number, default: 10 },
    day2Reward: { type: PropTypes.Number, default: 15 },
    day3Reward: { type: PropTypes.Number, default: 20 },
    day4Reward: { type: PropTypes.Number, default: 25 },
    day5Reward: { type: PropTypes.Number, default: 30 },
  };

  dailyRewardManager: DailyRewardManager | undefined = undefined;
  activePlayer!: Player;

  private startPos: Vec3 = new Vec3(0, 0, 0);

  //region preStart()
  preStart() {
    this.startPos = this.entity.position.get();

    this.connectCodeBlockEvent(
      this.entity,
      CodeBlockEvents.OnPlayerEnterTrigger,
      this.OnPlayerEnterTrigger.bind(this)
    );
    this.connectNetworkEvent(this.entity, sysEvents.setWhoCanTriggerEvent, (data) => {
      this.entity.as(TriggerGizmo).setWhoCanTrigger(data.whoCanTrigger);
    });
    this.connectNetworkEvent(this.entity, sysEvents.showDailyRewardToPlayer, (data) => {
      if (data.show) {
        this.entity.position.set(this.startPos);
        this.entity.as(TriggerGizmo).setWhoCanTrigger([data.player]);
      } else {
        this.entity.as(TriggerGizmo).setWhoCanTrigger([]);
        this.hidePrize();
      }
    });

    this.connectNetworkEvent(this.entity, sysEvents.openDailyRewardGiftBox, (data) => {
      this.playOpeningVFX();
    });
  }

  //region start()
  start() {
    this.dailyRewardManager = getMgrClass<DailyRewardManager>(
      this,
      ManagerType.DailyRewardManager,
      DailyRewardManager
    );
    // Initially disable trigger to prevent triggering
    this.entity.as(TriggerGizmo).setWhoCanTrigger([]);
    this.hidePrize();
    // this.entity.as(TriggerGizmo).setWhoCanTrigger('anyone');
  }

  OnPlayerEnterTrigger(player: Player) {
    this.activePlayer = player;
    const utcNow = Date.now();
    if (this.dailyRewardManager?.hasClaimedDailyReward(this.activePlayer, utcNow)) {
      return;
    }

    this.entity.as(TriggerGizmo).setWhoCanTrigger([]);

    //open daily reward on OneHUD
    const oneHUD = getEntityListByTag(ManagerType.UI_OneHUD, this.world)[0];
    this.sendNetworkEvent(oneHUD!, sysEvents.showDailyRewardUI, {
      player: this.activePlayer,
      show: true,
      giftBox: this.entity,
    });
  }

  //this will be triggered from OneHUD when the player clicks to open the reward
  private playOpeningVFX() {
    this.shakePrizeRotationForOneSecond();
    this.slowGrowPrizeOverOneSecond();
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
      await new Promise((resolve) => this.async.setTimeout(resolve, interval * 1000));
    }

    // Reset to original rotation
    prize.rotation.set(originalRot);

    const tweenHandler = getEntityListByTag("TweenHandler", this.world)[0];
    this.sendNetworkEvent(tweenHandler!, animateScaleEvent, { targetEntity: this.props.prizeGFX! });
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
        this.showAward();
        this.async.setTimeout(() => {
          this.hidePrize();
        }, 200);

        this.entity.as(TriggerGizmo).setWhoCanTrigger([this.activePlayer]);
      }
      await new Promise((resolve) => this.async.setTimeout(resolve, interval * 1000));
    }

    // Ensure final scale is set
    prize.scale.set(targetScale);
  }

  showAward() {
    playVFX(
      this,
      VFXLabel.sparkles,
      [this.activePlayer],
      this.entity.position.get(),
      this.entity.rotation.get()
    );
  }

  hidePrize() {
    this.entity.position.set(new Vec3(0, -1000, 0));
  }
}

Component.register(T_DailyReward);
