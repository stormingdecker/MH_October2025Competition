import { clamp } from "horizon/core";
import type { EasingFunction } from "TweenEasing";
import { Easing } from "TweenEasing";
import { ITween, ITweenTimeSource } from "TweenInterfaces";

/**
 * A generic tweened animation using an easing function, interpolator function, and apply function.
 * DO NOT CONSTRUCT directly. Use static factory methods on TweenAnimation instead.
 */
export class Tween implements ITween {
  /**
   * Useful easing functions
   */
  static Easing = Easing;

  // keep track of active tweens by id
  private static activeTweens = new Map<unknown, { tweens: ITween[]; timeSource: ITweenTimeSource }>();

  // next id for bad id generator
  private static nextId = 0;

  // a bad tween id generator
  private static getNextId(): string {
    return `tween${Tween.nextId++}`;
  }

  private isCanceled = false;
  private timeSource?: ITweenTimeSource;

  /**
   * DO NOT CALL DIRECTLY. Use static factory methods on TweenAnimation instead.
   */
  protected constructor(
    readonly duration: number,
    private easing: EasingFunction,
    private applyPercentComplete: (percentComplete: number) => void,
    private beginLoop?: () => void,
    private endLoop?: () => void,
    private id: unknown = Tween.getNextId()
  ) {
    if (!isFinite(duration)) {
      throw new Error("Duration must be finite");
    }
  }

  // ITween implementation

  /**
   * @returns the tween id
   */
  getId(): unknown {
    return this.id;
  }

  /**
   * @returns whether or not the tween is canceled
   */
  get canceled() {
    return this.isCanceled;
  }

  /**
   * Cancels the tween (if running)
   */
  cancel() {
    this.isCanceled = true;
  }

  setTimeSource(timeSource: ITweenTimeSource): void {
    if (this.timeSource) {
      throw new Error("Tween already attached to timeSource");
    }
    this.timeSource = timeSource;
  }

  timeSourceStart(): void {
    if (!this.timeSource) {
      throw new Error("Tween not attached to timeSource");
    }
    let existingTween = Tween.activeTweens.get(this.getId);
    if (existingTween && existingTween.timeSource !== this.timeSource) {
      console.warn(`Tween(s) with id '${this.getId()}' already running with different timeSource. Canceling other tween(s).`);
      existingTween.tweens.forEach((tween) => tween.cancel());
    } else {
      existingTween = { tweens: [], timeSource: this.timeSource };
      Tween.activeTweens.set(this.getId(), existingTween);
    }
    existingTween.tweens.push(this);
  }

  timeSourceStop(): void {
    const existingTween = Tween.activeTweens.get(this.getId());
    if (existingTween && existingTween.tweens.includes(this)) {
      existingTween.tweens.splice(existingTween.tweens.indexOf(this), 1);
      if (existingTween.tweens.length === 0) {
        Tween.activeTweens.delete(this.getId());
      }
    }
  }

  timeSourceLoopBegin(): void {
    this.beginLoop?.();
  }

  timeSourceLoopEnd(): void {
    this.endLoop?.();
  }

  /**
   * DO NOT CALL DIRECTLY. Called by the tween runner.
   */
  update(timeCode: number) {
    if (this.isCanceled) {
      return true;
    }
    const clampedTimeCode = clamp(timeCode, 0, this.duration);

    const percentComplete = this.easing(clampedTimeCode / this.duration);
    this.applyPercentComplete(percentComplete);
  }
}
