import { Entity, HorizonProperty, WritableHorizonProperty } from "horizon/core";
import { Tween } from "Tween";
import { TweenClock } from "TweenClock";
import type { EasingFunction } from "TweenEasing";
import { Easing } from "TweenEasing";
import { ITween } from "TweenInterfaces";
import type { BoundedInterpolatorFunction, InterpolableType, InterpolatorFunction } from "TweenInterpolators";
import { Interpolator, InterpolatorBuilder, interpolatorForType } from "TweenInterpolators";
import { localTweenTicker } from "TweenTicker";
import type { OnlyOne } from "Utils";
import { makeEntityTweenId } from "Utils";

/**
 * @param value the interpolated value of the tweened type to apply
 */
export type ApplyFunction<T> = (value: T) => void;

/**
 * @param percentComplete Decimal percentage complete. @see {@link TweenEasing.RepeatingEasingFunctionReturn}
 */
type AppliedInterpolatorFunction = (percentComplete: number) => void;

/**
 * A generic tweened animation using an easing function, interpolator function, and apply function.
 */
export class TweenAnimation extends Tween {
  /**
   * Creates a fully general purpose tween
   * @param interpolator The value interpolator function
   * @param apply The apply function
   * @param duration duration of the tween animation in seconds (default 1 second)
   * @param easing The easing function (default Easing.Linear.None)
   * @param id The id of the tween. If none provided, a bad unique id will be generated
   * @returns a new tween
   */
  static New<T>(
    interpolator: BoundedInterpolatorFunction<T>,
    apply: ApplyFunction<T>,
    duration: number = 1,
    easing: EasingFunction = Easing.Linear.None,
    beginLoop?: () => void,
    endLoop?: () => void,
    id?: unknown
  ): ITween {
    return new TweenAnimation(duration, easing, (percentComplete: number) => apply(interpolator(percentComplete)), beginLoop, endLoop, id);
  }

  /**
   * Creates a general purpose Entity property tween
   * @param entity The entity on which the property lives
   * @param object The sub object on the entity that contains the property (may be the entity itself)
   * @param property The name of the WriteableHorizonWorld property field on the sub object
   * @param interpolator The property interpolator function
   * @param duration duration of the tween animation in seconds (default 1 second)
   * @param easing the easing function (default Easing.Linear.None)
   * @param id The id of the tween. If none provided, the entity id, name, sub object name, and property name will be used.
   * @returns
   */
  static EntityObjectProperty<T extends OnlyOne<InterpolableType, T>, O extends Object, K extends keyof O>(
    entity: Entity,
    object: O,
    property: O[K] extends WritableHorizonProperty<T> ? K : never,
    interpolator: BoundedInterpolatorFunction<T>,
    duration: number = 1,
    easing: EasingFunction = Easing.Linear.None,
    beginLoop?: () => void,
    endLoop?: () => void,
    id?: unknown
  ): ITween {
    return TweenAnimation.New(
      interpolator,
      // xxx not sure why compiler can't figure out object[property] is a WriteableHorizonProperty<T> on its own
      (value) => (object[property] as any as WritableHorizonProperty<T>).set(value),
      duration,
      easing,
      beginLoop,
      endLoop,
      id ? id : makeEntityTweenId(entity, object, String(property))
    );
  }

  /**
   * Creates a Entity property tween animation with a general purpose easing function and auto selected interpolator function
   * @param entity The entity on which the property lives
   * @param property The name of the WriteableHorizonWorld property field on the Entity
   * @param start starting value
   * @param end ending value
   * @param duration duration of the tween animation in seconds (default 1 second)
   * @param easing the easing function (default Easing.Linear.None)
   * @param id The id of the tween. If none provided, the entity id, name, sub object name, and property name will be used.
   * @returns
   */
  static EntityProperty<T extends OnlyOne<InterpolableType, T>, K extends keyof Entity>(
    entity: Entity,
    property: Entity[K] extends WritableHorizonProperty<T> ? K : never,
    start: T,
    end: T,
    duration: number = 1,
    easing: EasingFunction = Easing.Linear.None,
    beginLoop?: () => void,
    endLoop?: () => void,
    id?: unknown
  ): ITween {
    const interpolator: InterpolatorFunction<T> = interpolatorForType(start, end);
    return TweenAnimation.EntityObjectProperty(
      entity,
      entity,
      property,
      InterpolatorBuilder.New(interpolator).bounds(start, end).create(),
      duration,
      easing,
      beginLoop,
      endLoop,
      id
    );
  }

  /**
   * Useful property interpolators
   */
  static Interpolator = Interpolator;
  
  /**
   * Builder for property interpolators
   */
  static InterpolatorBuilder = InterpolatorBuilder;

  /**
   * DO NOT CALL DIRECTLY. Use static factory methods instead.
   */
  private constructor(
    duration: number,
    easing: EasingFunction,
    appliedInterpolator: AppliedInterpolatorFunction,
    beginLoop?: () => void,
    endLoop?: () => void,
    id?: unknown
  ) {
    super(duration, easing, appliedInterpolator, beginLoop, endLoop, id);
  }
}

export function tweenTo<T extends OnlyOne<InterpolableType, T>>(
  prop: HorizonProperty<T>,
  end: T,
  duration: number,
  easing: EasingFunction = Easing.Linear.None
) {
  localTweenTicker?.nextFrame(() => {
    const start = prop.get();
    const interpolator = interpolatorForType(start, end);
    const boundedInterpolator = InterpolatorBuilder.New(interpolator).bounds(start, end).create();
    const tween = TweenAnimation.New(boundedInterpolator, (value: T) => prop.set(value), duration, easing, undefined, undefined, prop);
    const clock = new TweenClock(tween);
    clock.start();
  });
}
