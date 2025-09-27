import { Component, EventSubscription, World } from "horizon/core";
import { ITweenTicker, ITweenClock } from "TweenInterfaces";
import { setServerTicker } from "TweenManager";

/**
 * The TweenClock and TweenAnimation rendezvous with the local execution
 * environment's TweenTicker to get ticked.
 */
export let localTweenTicker: ITweenTicker | undefined;

/**
 * TweenTicker is a component that ticks ITweenClocks in a single player's execution environment.
 * (including server player)
 * 
 * Note:
 * The 'TweenTracker client pool' AssetPoolGizmo is using the same script/object as the 
 * 'TweenTicker server' object, just in asset form so that it can automatically spawn 
 * enough for the destination world's configured player count.
 */
class TweenTicker extends Component<typeof TweenTicker> implements ITweenTicker {
  static propsDefinition = {
  };
  clocks: ITweenClock[] = [];
  compactClocks = false;
  updateSubscription?: EventSubscription;
  nextFrameCallbacks: (() => void)[] = [];

  override preStart() {
    this.connectLocalEvent(this.entity, setServerTicker, () => {
      // special event sent by TweenManager to the special serverTicker entity
      if (this.world.getLocalPlayer() === this.world.getServerPlayer()) {
        console.log("tween ticker assigned to server");
        localTweenTicker = this;
      }
    });
  }
        
  start() {
    if (this.world.getLocalPlayer() !== this.world.getServerPlayer()) {
      // we started up in a local execution env, so we are the local player's tween ticker
      console.log(`tween ticker assigned to local player ${this.playerName()}`);
      localTweenTicker = this;
    }
  }

  addClock(clock: ITweenClock) {
    console.log(`adding clock to ticker for ${this.playerName()}`);
    this.clocks.push(clock);
    this.startTicking();
  }

  removeClock(clock: ITweenClock): void {
    console.log(`removing clock from ticker for ${this.playerName()}`);
    const index = this.clocks.indexOf(clock);
    if (index >= 0) {
      delete this.clocks[index];
      this.compactClocks = true;
    }
  }

  nextFrame(callback: () => void): void {
    this.async.setTimeout(() => {
      this.nextFrameCallbacks.push(callback);
      this.startTicking();
    }, 10);
  }

  onUpdate(deltaTime: number) {
    this.nextFrameCallbacks.forEach((callback) => {
      callback();
    });
    this.nextFrameCallbacks = [];
    this.clocks.forEach((clock) => {
      clock.tick(deltaTime);
    });
    if (this.compactClocks) {
      // compact holes in array
      this.clocks = this.clocks.filter(() => true);
    }
    if (this.clocks.length === 0) {
      this.stopTicking();
    }
  }

  private startTicking() {
    if (!this.updateSubscription) {
      console.log("starting onUpdate");
      this.updateSubscription = this.connectLocalBroadcastEvent(World.onUpdate, ({ deltaTime }) => this.onUpdate(deltaTime));
    }
  }

  private stopTicking() {
    console.log("ending onUpdate");
    this.updateSubscription?.disconnect();
    this.updateSubscription = undefined;
  }

  private playerName() {
    const player = this.world.getLocalPlayer();
    return player === this.world.getServerPlayer() ? "(server)" : player.name.get();
  }
}
Component.register(TweenTicker);
