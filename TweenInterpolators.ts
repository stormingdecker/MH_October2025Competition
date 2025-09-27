import { Color, Quaternion, Vec3 } from "horizon/core";
import type { OnlyOne } from "Utils";

/**
 * An unbounded interpolator function.
 * @param start starting value
 * @param end ending value
 * @param percentComplete Decimal percentage complete. @see {@link TweenEasing.RepeatingEasingFunctionReturn}
 */
export type InterpolatorFunction<T> = (start: T, end: T, percentComplete: number) => T

/**
 * A bounded interpolator function.
 * @param percentComplete Decimal percentage complete. @see {@link TweenEasing.RepeatingEasingFunctionReturn}
 * @returns the interpolated value of the tweened type at the given percent complete
 */
export type BoundedInterpolatorFunction<T> = (percentComplete: number) => T

/**
 * Interpolable types. These types have built in interpolation functions.
 */
export type InterpolableType = number | Vec3 | Color | Quaternion
type InterpolableType2 = Number | Exclude<InterpolableType, number>

interface constructor<T> {
    new(...args: any[]): T
}

type InterpolatorBuildStatus = {
    bounds: boolean
}

/**
 * Builder for creating {@link BoundedInterpolatorFunction}s.
 */
export class InterpolatorBuilder<T = never, IBS extends Partial<InterpolatorBuildStatus> = {}> {

    /**
     * @param interpolatorFunction interpolator function to use
     * @returns an InterpolatorBuilder
     */
    static New<T>(interpolatorFunction: InterpolatorFunction<T>): InterpolatorBuilder<T> {
        return new InterpolatorBuilder<T>(interpolatorFunction)
    }

    static New2<T extends OnlyOne<InterpolableType2, T>>(typeConstructor: constructor<T>): InterpolatorBuilder<T> {
        return InterpolatorBuilder.New(Interpolator[typeConstructor.name as InterpolatorFunctionName] as unknown as InterpolatorFunction<T>)
    }

    static NewNumber(): InterpolatorBuilder<number> {
        return new InterpolatorBuilder<number>(NumberInterpolator)
    }

    static NewVec3(): InterpolatorBuilder<Vec3> {
        return new InterpolatorBuilder<Vec3>(Vec3Interpolator)
    }

    static NewColor(): InterpolatorBuilder<Color> { 
        return new InterpolatorBuilder<Color>(ColorInterpolator)
    }

    static NewQuaternion(): InterpolatorBuilder <Quaternion> {
        return new InterpolatorBuilder<Quaternion>(QuaternionInterpolator)
    }

    start?: T
    end?: T
    
    /**
     * DO NOT USE. Use {@link InterpolatorBuilder.New} instead.
     */
    private constructor(private interpolatorFunction: InterpolatorFunction<T>) { }

    /**
     * Sets the bounds of the interpolator.  Required exactly once.
     * @param start starting value
     * @param end ending value
     * @returns this
     */
    bounds(
        this: 'bounds' extends keyof IBS ? never : InterpolatorBuilder<T, IBS>,
        start: T,
        end: T,
    ): InterpolatorBuilder<T, IBS & { bounds: true }> {
        this.start = start
        this.end = end
        return this as InterpolatorBuilder<T, IBS & { bounds: true }>
    }

    /**
     * Note: bounds() must have been called before this function is called
     * @returns a {@link BoundedInterpolatorFunction} that can be used in a {@link Tween}
     */
    create(
        this: 'bounds' extends keyof IBS ? InterpolatorBuilder<T, IBS> : never,
    ): BoundedInterpolatorFunction<T> {
         return this.interpolatorFunction.bind(undefined, this.start!, this.end!)
    }
}

// note, we can't use the horizon api provided lerp and slerp functions because they don't allow overshoot
// beyond [0, 1], which is necessary for some of the easing functions to work correctly.

/**
 * A numeric interpolator
 * @see {@link InterpolatorFunction}
 */
export function NumberInterpolator(start: number, end: number, percentComplete: number): number {
    return start + (end - start) * percentComplete
}

/**
 * A Vec3 interpolator
 * @see {@link InterpolatorFunction}
 */
export function Vec3Interpolator(start: Vec3, end: Vec3, percentComplete: number): Vec3 {
    return start.add(end.sub(start).mul(percentComplete))
}

/**
 * A Color interpolator
 * @see {@link InterpolatorFunction}
 */
export function ColorInterpolator(start: Color, end: Color, percentComplete: number): Color {
    return start.add(end.sub(start).mul(percentComplete))
}

/**
 * A Quaternion interpolator 
 * @see {@link InterpolatorFunction}
 */
export function QuaternionInterpolator(start: Quaternion, end: Quaternion, percentComplete: number): Quaternion {
    function dot(a: Quaternion, b: Quaternion): number {
        return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
    }
    function negate(a: Quaternion) { 
        return new Quaternion(-a.x, -a.y, -a.z, -a.w);
    }
    const l2 = dot(start, end);
    if (l2 < 0) {
        // negate second quaternion if dot product is negative
        end = negate(end);
    }
    // use nlerp, since it's faster than slerp (which requires trig functions)
    const result = Quaternion.zero;
    result.x = start.x - percentComplete * (start.x - end.x);
    result.y = start.y - percentComplete * (start.y - end.y);
    result.z = start.z - percentComplete * (start.z - end.z);
    result.w = start.w - percentComplete * (start.w - end.w);
    return result.normalizeInPlace();
}

export type InterpolatorFunctionName = keyof typeof Interpolator

/**
 * A map of interpolator functions for each {@link InterpolableType}
 */
export const Interpolator = {
    Number: NumberInterpolator,
    Vec3: Vec3Interpolator,
    Color: ColorInterpolator,
    Quaternion: QuaternionInterpolator,
}

/**
 * @param type an object of some {@link InterpolableType} for which we want an interpolator
 * @returns an interpolator function for the type
 */
export function interpolatorForType<T extends OnlyOne<InterpolableType, T>>(start: T, end: T): InterpolatorFunction<T> {
    // we carefully maintain Interpolator to have a key for each InterpolableType
    return Interpolator[start.constructor.name as InterpolatorFunctionName] as unknown as InterpolatorFunction<T>
}