import { Component, Entity, NetworkEvent, Vec3 } from 'horizon/core';
import { Tween } from 'Tween';
import { TweenAnimation } from 'TweenAnimation';
import { TweenClock } from 'TweenClock';
import { EasingFunctionGroup, EasingName } from 'TweenEasing';
import { ITween, ITweenClock } from 'TweenInterfaces';

export const animateScaleEvent = new NetworkEvent<{targetEntity: Entity}>("animateScale");

class TweenHandler extends Component<typeof TweenHandler> {
  static propsDefinition = {};

  start() {
    this.connectNetworkEvent(this.entity, animateScaleEvent, (data) => {
      this.animateScale(data.targetEntity);
    });
  }

    tweenClock?: ITweenClock;
  animateScale(targetEntity: Entity) {
    // Stop previous tween if it exists
    if (this.tweenClock) {
      this.tweenClock.stop();
      this.tweenClock = undefined;
    }
    // ask the subclass to create the correct tween animations for this test
    const easingName: EasingName = "Elastic";
    const tweenMode: keyof EasingFunctionGroup = "Out";
    const tweens = this.createTween(targetEntity, easingName, tweenMode);
    this.tweenClock = new TweenClock(tweens[0], 1, 0, false);

    // Start the new tween
    console.log("Animating scale for", targetEntity.name.get());
    this.tweenClock.start();
  }

  createTween(testObject: Entity, name: EasingName, mode: keyof EasingFunctionGroup): ITween[] {
    const tween = TweenAnimation.EntityProperty(
      testObject,
      "scale",
      new Vec3(0.5, 0.5, 0.5),
      // new Vec3(1.5, 1.5, 1.5),
      new Vec3(1, 1, 1),
      0.5,
      Tween.Easing[name][mode]
    );
    return [tween];
  }
}
Component.register(TweenHandler);