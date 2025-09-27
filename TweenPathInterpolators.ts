import { Vec3, Color, Quaternion } from "horizon/core"
import { BoundedInterpolatorFunction, InterpolableType } from "TweenInterpolators"
import { OnlyOne } from "Utils"

export type PathInterpolatorFunction<T> = (interpolationFunction: PathInterpolationFunction, v: T[], k: number) => T

type InterpolableType2 = Number | Exclude<InterpolableType, number>

interface constructor<T> {
    new(...args: any[]): T
}

type PathInterpolatorBuildStatus = {
    path: boolean,
}

/**
 * Builder for creating {@link BoundedInterpolatorFunction}s.
 */
export class PathInterpolatorBuilder<T = never, IBS extends Partial<PathInterpolatorBuildStatus> = {}> {

    /**
     * @param pathInterpolatorFunction interpolator function to use
     * @returns an InterpolatorBuilder
     */
    static New<T>(pathInterpolatorFunction: PathInterpolatorFunction<T>): PathInterpolatorBuilder<T> {
        return new PathInterpolatorBuilder<T>(pathInterpolatorFunction)
    }

    static New2<T extends OnlyOne<InterpolableType2, T>>(typeConstructor: constructor<T>): PathInterpolatorBuilder<T> {
        return PathInterpolatorBuilder.New(PathInterpolator[typeConstructor.name as PathInterpolatorName] as unknown as PathInterpolatorFunction<T>)
    }

    static NewNumber(): PathInterpolatorBuilder<number> {
        return new PathInterpolatorBuilder<number>(NumberPathInterpolator)
    }

    static NewVec3(): PathInterpolatorBuilder<Vec3> {
        return new PathInterpolatorBuilder<Vec3>(Vec3PathInterpolator)
    }

    static NewColor(): PathInterpolatorBuilder<Color> {
        return new PathInterpolatorBuilder<Color>(ColorPathInterpolator)
    }

    static NewQuaternion(): PathInterpolatorBuilder<Quaternion> {
        return new PathInterpolatorBuilder<Quaternion>(QuaternionPathInterpolator)
    }

    pathInterpolationFunction: PathInterpolationFunction = PathInterpolation.Linear
    points: T[] = []

    /**
     * DO NOT USE. Use {@link PathInterpolatorBuilder.New} instead.
     */
    private constructor(private pathInterpolatorFunction: PathInterpolatorFunction<T>) { }

    path(
        this: 'path' extends keyof IBS ? never : PathInterpolatorBuilder<T, IBS>,
        interpolationFunction: PathInterpolationFunction,
        point1: T,
        point2: T,
        ...remainingPoints: T[]
    ): PathInterpolatorBuilder<T, IBS & { path: true }> {
        this.pathInterpolationFunction = interpolationFunction
        this.points = [point1, point2, ...remainingPoints]
        return this as PathInterpolatorBuilder<T, IBS & { path: true }>
    }

    /**
     * Note: bounds() must have been called before this function is called
     * @returns a {@link BoundedInterpolatorFunction} that can be used in a {@link Tween}
     */
    create(
        this: 'path' extends keyof IBS ? PathInterpolatorBuilder<T, IBS> : never,
    ): BoundedInterpolatorFunction<T> {
        return this.pathInterpolatorFunction.bind(undefined, this.pathInterpolationFunction, this.points)
    }
}

export function NumberPathInterpolator(interpolationFunction: PathInterpolationFunction, v: number[], k: number): number {
    return interpolationFunction(v, k)
}

export function Vec3PathInterpolator(interpolationFunction: PathInterpolationFunction, v: Vec3[], k: number): Vec3 {
    return new Vec3(
        interpolationFunction(v.map((v) => v.x), k),
        interpolationFunction(v.map((v) => v.y), k),
        interpolationFunction(v.map((v) => v.z), k),
    )
}

export function ColorPathInterpolator(interpolationFunction: PathInterpolationFunction, v: Color[], k: number): Color {
    return new Color(
        interpolationFunction(v.map((v) => v.r), k),
        interpolationFunction(v.map((v) => v.g), k),
        interpolationFunction(v.map((v) => v.b), k),
    )
}

export function QuaternionPathInterpolator(interpolationFunction: PathInterpolationFunction, v: Quaternion[], k: number): Quaternion {
    function dot(a: Quaternion, b: Quaternion): number {
        return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
    }
    function negate(a: Quaternion) {
        return new Quaternion(-a.x, -a.y, -a.z, -a.w);
    }
    let start: Quaternion | undefined = undefined
    const fixedV = v.map(end => {
        if (start) {
            const l2 = dot(start, end)
            if (l2 < 0) {
                end = negate(end)
            }
        }
        start = end
        return end
    })
    // use nlerp, since it's faster than slerp (which requires trig functions)
    const result = Quaternion.zero
    result.x = interpolationFunction(fixedV.map((v) => v.x), k)
    result.y = interpolationFunction(fixedV.map((v) => v.y), k)
    result.z = interpolationFunction(fixedV.map((v) => v.z), k)
    result.w = interpolationFunction(fixedV.map((v) => v.w), k)
    return result.normalizeInPlace();
}

export type PathInterpolatorName = keyof typeof PathInterpolator

/**
 * A map of interpolator functions for each {@link InterpolableType}
 */
export const PathInterpolator = {
    Number: NumberPathInterpolator,
    Vec3: Vec3PathInterpolator,
    Color: ColorPathInterpolator,
    Quaternion: QuaternionPathInterpolator,
}

/**
 * @param type an object of some {@link InterpolableType} for which we want an interpolator
 * @returns an interpolator function for the type
 */
export function pathInterpolatorForType<T extends OnlyOne<InterpolableType, T>>(start: T): PathInterpolatorFunction<T> {
    // we carefully maintain Interpolator to have a key for each InterpolableType
    return PathInterpolator[start.constructor.name as PathInterpolatorName] as unknown as PathInterpolatorFunction<T>
}

export type PathInterpolationFunctionName = Exclude<keyof typeof PathInterpolation, 'Utils'>
export const PathInterpolationFunctionNames: PathInterpolationFunctionName[] = ['Linear', 'Bezier', 'CatmullRom']

// remainder of file lifted (mostly) verbatim from https://github.com/tweenjs/tween.js/blob/main/src/Interpolation.ts
// Interpolation renamed PathInterpolation to avoid confusion
// License: MIT
//
// Note: some of the code is rather 'leet' looking, and I would not recommend writing with that style

export type PathInterpolationFunction = (v: number[], k: number) => number

const PathInterpolation = {
    Linear: function (v: number[], k: number): number {
        const m = v.length - 1
        const f = m * k
        const i = Math.floor(f)
        const fn = PathInterpolation.Utils.Linear

        if (k < 0) {
            return fn(v[0], v[1], f)
        }

        if (k > 1) {
            return fn(v[m], v[m - 1], m - f)
        }

        return fn(v[i], v[i + 1 > m ? m : i + 1], f - i)
    },

    Bezier: function (v: number[], k: number): number {
        let b = 0
        const n = v.length - 1
        const pw = Math.pow
        const bn = PathInterpolation.Utils.Bernstein

        for (let i = 0; i <= n; i++) {
            b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i)
        }

        return b
    },

    CatmullRom: function (v: number[], k: number): number {
        const m = v.length - 1
        let f = m * k
        let i = Math.floor(f)
        const fn = PathInterpolation.Utils.CatmullRom

        if (v[0] === v[m]) {
            if (k < 0) {
                i = Math.floor((f = m * (1 + k)))
            }

            return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i)
        } else {
            if (k < 0) {
                return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0])
            }

            if (k > 1) {
                return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m])
            }

            return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i)
        }
    },

    Utils: {
        Linear: function (p0: number, p1: number, t: number): number {
            return (p1 - p0) * t + p0
        },
        Bernstein: function (n: number, i: number): number {
            const fc = PathInterpolation.Utils.Factorial

            return fc(n) / fc(i) / fc(n - i)
        },
        Factorial: (function () {
            const a = [1]

            return function (n: number): number {
                let s = 1

                if (a[n]) {
                    return a[n]
                }

                for (let i = n; i > 1; i--) {
                    s *= i
                }

                a[n] = s
                return s
            }
        })(),

        CatmullRom: function (p0: number, p1: number, p2: number, p3: number, t: number): number {
            const v0 = (p2 - p0) * 0.5
            const v1 = (p3 - p1) * 0.5
            const t2 = t * t
            const t3 = t * t2

            return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1
        },
    },
}

export default PathInterpolation