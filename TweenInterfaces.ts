
/**
 * A tween animation
 */
export interface ITween {
  /**
   * Unique(-ish) id of the tween. Tweens that are running with the same id will be canceled
   * when a new tween with the same id is started. Thus, tweens with the same id on a timeline
   * cannot be configured to run concurrently without unpredictable results. Likewise, tweens
   * on different timelines with the same id may cause unpredictable cancellation of one of
   * the tweens on one of the timelines if they end up running concurrently.
   */
  getId(): unknown;

  /**
   * Get the duration of the tween
   */
  readonly duration: number;

  /**
   * Whether the tween was canceled before completion when it was last run
   */
  readonly canceled: boolean;

  /**
   * Cancel the tween.
   */
  cancel(): void;

  /**
   * Attach a tween to a time source. If already attached to a time source, will throw an error.
   * @param clock The time source to which this tween is attached
   */
  setTimeSource(timeSource: ITweenTimeSource): void;

  /**
   * The time source has started. This will mark this tween as 'running', and will cancel any other
   * tweens with the same id that are currently running on other time sources.
   */
  timeSourceStart(): void;

  /**
   * The time source has stopped. This will mark this tween as not 'running'.
   */
  timeSourceStop(): void;

  /**
   * The time source has begun an iteration
   */
  timeSourceLoopBegin(): void;

  /**
   * The time source has ended an iteration
   */
  timeSourceLoopEnd(): void;

  /**
   * Update the tween to the new time code
   * @param timeCode The time code for the tween, relative to its start time
   */
  update(timeCode: number): void;
}

/**
 * A timeline of tweens
 */
export interface ITweenTimeline extends ITween {}

/**
 * The direction of a timeline clock
 */
export type TweenDirection = "forward" | "backward";

export interface ITweenClock {
  /**
   * The current playback direction of the timeline clock
   */
  direction: TweenDirection;

  /**
   * Reverse the direction of the timeline clock
   * @returns The new direction of the timeline clock
   */
  reverse(): TweenDirection;

  /**
   * Whether the timeline is currently playing (possibly paused)
   */
  readonly running: boolean;

  /**
   * Whether the timeline is currently paused (while playing)
   */
  readonly paused: boolean;

  /**
   * Start the start the timeline from the beginning position
   * @returns A promise that resolves when the clock stops
   */
  start(): Promise<void>;

  /**
   * Pause the timeline
   */
  pause(): void;

  /**
   * Resume a a paused timeline
   */
  resume(): void;

  /**
   * Stop the timeline at its current position. Notifies Promises that timeline is complete.
   */
  stop(): void;

  /**
   * Update the clock by a given amount of time
   */
  tick(deltaTime: number): void;
}

/**
 * A runner of tween clocks (one per client)
 */
export interface ITweenTicker {
  /**
   * @param tween the tween to add to the runner
   */
  addClock(clock: ITweenClock): void;
  /**
   * @param tween the tween to remove from the runner
   */
  removeClock(clock: ITweenClock): void;
  /**
   * Run some code in the next frame
   */
  nextFrame(callback: () => void): void;
}

export interface ITweenTimeSource {}