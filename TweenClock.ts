import { ITweenClock, ITweenTimeSource, TweenDirection, ITween } from "TweenInterfaces";
import { localTweenTicker } from "TweenTicker";

/**
 * A clock that drives a single tween, with support for iterations, delays, and yoyo.
 */
export class TweenClock implements ITweenClock, ITweenTimeSource {
  private itersRemaining: number = 0;
  private dir: TweenDirection = "forward";
  private clockTime: number = 0;
  private delayTime: number = 0;
  private isPaused = false;
  private isRunning = false;
  private completePromise?: Promise<void>;
  private resolveComplete?: () => void;
  private rejectComplete?: (reason?: any) => void;
  private timeSourceLoopBegin = false;

  constructor(private tween: ITween, private iterations: number = 1, readonly iterationDelay: number = 0, readonly yoyo: boolean = false) {
    tween.setTimeSource(this);
  }

  get iterationsRemaining() {
    return this.itersRemaining;
  }

  get direction() {
    return this.dir;
  }

  set direction(direction: TweenDirection) {
    this.dir = direction;
  }

  reverse(): TweenDirection {
    return (this.direction = this.direction === "forward" ? "backward" : "forward");
  }

  get running() {
    return this.isRunning;
  }

  get paused() {
    return this.isPaused;
  }

  start(): Promise<void> {
    if (localTweenTicker) {
      localTweenTicker.addClock(this);
    } else {
      return Promise.reject("No local tween ticker found");
    }
    this.clockTime = 0;
    this.delayTime = 0;
    this.itersRemaining = this.iterations;
    this.isRunning = true;
    this.isPaused = false;
    this.completePromise = new Promise((resolve, reject) => {
      this.resolveComplete = resolve;
      this.rejectComplete = reject;
    });
    this.tween.timeSourceStart();
    return this.completePromise;
  }

  pause(): void {
    if (this.running && !this.paused) {
      this.isPaused = true;
    }
  }

  resume(): void {
    if (this.running && this.paused) {
      this.isPaused = false;
    }
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
  }

  tick(deltaTime: number): void {
    if (this.isPaused) {
      // paused, but clock still running
      return;
    }
    let active = this.isRunning;
    this.delayTime -= deltaTime;
    if (active && this.delayTime <= 0) {
      this.clockTime += this.dir === "forward" ? deltaTime : -deltaTime;
      if (!this.timeSourceLoopBegin) {
        this.timeSourceLoopBegin = true;
        this.tween.timeSourceLoopBegin();
      }
      this.tween.update(this.clockTime);
      if ((this.dir === "forward" && this.clockTime >= this.tween.duration) || (this.dir === "backward" && this.clockTime <= 0)) {
        this.tween.timeSourceLoopEnd();
        this.timeSourceLoopBegin = false;
        this.itersRemaining--;
        if (this.itersRemaining > 0) {
          if (this.yoyo) {
            this.reverse();
          }
          this.clockTime = this.direction === "forward" ? 0 : this.tween.duration;
          this.delayTime = this.iterationDelay;
        } else {
          active = false;
        }
      }
    }
    if (!active) {
      this.isRunning = false;
      this.isPaused = false;
      this.tween.timeSourceStop();
      this.resolveComplete?.();
      this.completePromise = undefined;
      if (localTweenTicker) {
        localTweenTicker.removeClock(this);
      }
    }
  }
}
