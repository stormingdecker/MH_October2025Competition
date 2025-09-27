/**
 * @param percentComplete Decimal percentage complete. If undefined, the easing 
 * function is 'idle' at the current time (e.g. in a start delay), but still 
 * running. When numeric, it is _NOT_ bound to [0, 1]. It can go outside that 
 * range if the easing function overshoots. 
 * @isDone true if the easing function is done, false otherwise
 */
export type RepeatingEasingFunctionReturn = { percentComplete?: number, isDone: boolean }

/**
 * @param time Time since the tween was started (excluding paused periods), in seconds
 * @returns @see {@link RepeatingEasingFunctionReturn} */
export type RepeatingEasingFunction = (time: number) => RepeatingEasingFunctionReturn

type EasingBuildStatus = {
    duration: boolean
}

/**
 * Builder for {@link RepeatingEasingFunction}s
 */
export class EasingBuilder<EBS extends Partial<EasingBuildStatus> = {}> {

    /**
     * @param easingFunction the easing function to use, or the name of a built in easing function
     * @returns an EasingBuilder
     */
    static New(easingFunction: EasingFunction | EasingFunctionName): EasingBuilder {
        if (typeof easingFunction === 'function') {
            return new EasingBuilder(easingFunction)
        } else {
            return new EasingBuilder(easingFunctionFromName(easingFunction))
        }
    }

    static readonly easingNames: EasingName[] = ['Linear', 'Quadratic', 'Cubic', 'Quartic', 'Quintic', 'Sinusoidal', 'Exponential', 'Circular', 'Elastic', 'Back', 'Bounce']
    static readonly easingModes: EasingMode[] = ['In', 'Out', 'InOut']

    _duration = 0
    _delay = 0
    _repeat = 0
    _repeatDelay?: number
    _yoyo = false
    _onInitialStart?: () => void
    _onEveryStart?: () => void
    _onRepeat?: () => void

    /**
     * DO NOT USE. Use {@link EasingBuilder.New} instead.
     */
    private constructor(private easingFunction: EasingFunction) { }

    /**
     * Required exactly once
     * @param duration The duration of the easing function, in seconds
     * @returns this
     */
    duration(
        this: 'duration' extends keyof EBS ? never : EasingBuilder<EBS>,
        duration: number,
    ): EasingBuilder<EBS & { duration: true }> {
        this._duration = duration
        return this as unknown as EasingBuilder<EBS & { duration: true }>
    }

    /**
     * @param delay The delay before the easing function starts, in seconds
     * @returns this
     */
    delay(delay: number): EasingBuilder<EBS> {
        this._delay = delay
        return this
    }

    /**
     * @param repeat The number of times to repeat the easing function. Infinity is allowed.
     * @returns this
     */
    repeat(repeat: number): EasingBuilder<EBS> {
        this._repeat = repeat
        return this
    }

    /**
     * @param repeatDelay The delay between repeats of the easing function, in seconds
     * @returns this
     */
    repeatDelay(repeatDelay: number): EasingBuilder<EBS> {
        this._repeatDelay = repeatDelay
        return this
    }

    /**
     * @param yoyo If true, the easing function will reverse direction after each repeat
     * @returns this
     */
    yoyo(yoyo: boolean = true): EasingBuilder<EBS> {
        this._yoyo = yoyo
        return this
    }

    /**
     * @param callback Called when the easing function starts for the first time
     * @returns 
     */
    onInitialStart(callback: () => void): EasingBuilder<EBS> {
        this._onInitialStart = callback
        return this
    }

    /**
     * @param callback Called every time the easing function starts or restarts
     * @returns 
     */
    onEveryStart(callback: () => void): EasingBuilder<EBS> {
        this._onEveryStart = callback
        return this
    }

    /**
     * @param callback Called every time the easing function repeats (before the repeat delay)
     * @returns 
     */
    onRepeat(callback: () => void): EasingBuilder<EBS> {
        this._onRepeat = callback
        return this
    }

    /**
     * Note: duration() must have been called before this function is called
     * @returns A {@link RepeatingEasingFunction} that can be used with {@link Tween.New}
     */
    create(
        this: 'duration' extends keyof EBS ? EasingBuilder<EBS> : never,
    ): RepeatingEasingFunction {
        if (this._repeat === 0) {
            const oneShotState: OneShotState = {
                delay: this._delay,
                onInitialStart: this._onInitialStart,
            }
            return OneShotEasing.bind(oneShotState, this.easingFunction, this._duration)
        } else if (!this._yoyo) {
            const repeatState: RepeatState = {
                delay: this._delay,
                onInitialStart: this._onInitialStart,
                initialDelay: this._delay,
                cycleDelay: this._repeatDelay,
                cyclesRemaining: this._repeat,
                cycleStartTime: 0,
                onEveryStart: this._onEveryStart,
                onRepeat: this._onRepeat,
            }
            return RepeatEasing.bind(repeatState, this.easingFunction, this._duration)
        } else {
            const yoyoState: YoyoState = {
                delay: this._delay,
                onInitialStart: this._onInitialStart,
                initialDelay: this._delay,
                cycleDelay: this._repeatDelay,
                cyclesRemaining: this._repeat,
                cycleStartTime: 0,
                onEveryStart: this._onEveryStart,
                onRepeat: this._onRepeat,
                yoyo: false,
            }
            return YoyoEasing.bind(yoyoState, this.easingFunction, this._duration)
        }
        throw new Error("Not implemented")
    }
}

// Internal utility functions for implementing repeated easing functions

type OneShotState = {
    delay: number
    onInitialStart?: (() => void)
    onInitialStartCalled?: boolean
}

function OneShotEasing(this: OneShotState, easing: EasingFunction, duration: number, time: number): RepeatingEasingFunctionReturn {
    const clampedTime = Math.min(time - this.delay, duration)
    if (clampedTime < 0) {
        return { isDone: false }
    } else {
        if (this.onInitialStart && !this.onInitialStartCalled) {
            this.onInitialStart()
            this.onInitialStartCalled = true
        }
        const alpha = clampedTime / duration
        const percentComplete = clampedTime >= 0 ? easing(alpha) : 0
        return { percentComplete, isDone: clampedTime >= duration }
    }
}

type RepeatState = OneShotState & {
    initialDelay: number
    cycleDelay?: number
    cyclesRemaining: number
    cycleStartTime: number
    onEveryStart?: (() => void)
    onEveryStartCalled?: boolean
    onRepeat?: (() => void)
}

function RepeatEasing(this: RepeatState, easing: EasingFunction, duration: number, time: number): RepeatingEasingFunctionReturn {
    const cycleTime = time - this.cycleStartTime
    const easingResult = OneShotEasing.apply(this, [easing, duration, cycleTime])
    if (easingResult.percentComplete === undefined) {
        return easingResult
    } else {
        if (this.onEveryStart && !this.onEveryStartCalled) {
            this.onEveryStart()
            this.onEveryStartCalled = true
        }
        const { percentComplete, isDone } = easingResult
        if (isDone) {
            if (isFinite(this.cyclesRemaining)) {
                this.cyclesRemaining--
            }
            this.delay = this.cycleDelay ?? this.initialDelay
            this.cycleStartTime = time
            this.onInitialStartCalled = false
            this.onEveryStartCalled = false
            if (this.cyclesRemaining > 0 && this.onRepeat) {
                this.onRepeat()
            }
        }
        return { percentComplete, isDone: isDone && this.cyclesRemaining <= 0 }
    }
}

type YoyoState = RepeatState & {
    yoyo: boolean
}

function YoyoEasing(this: YoyoState, easing: EasingFunction, duration: number, time: number): RepeatingEasingFunctionReturn {
    // capture old values in case repeat starts a new cycle
    const { cyclesRemaining, yoyo } = this
    const easingResult = RepeatEasing.apply(this, [easing, duration, time])
    if (easingResult.percentComplete === undefined) {
        return easingResult
    } else {
        const { percentComplete, isDone } = easingResult
        if (cyclesRemaining !== this.cyclesRemaining) {
            // we just started a new cycle
            this.yoyo = !yoyo
        }
        return { percentComplete: yoyo ? 1 - percentComplete : percentComplete, isDone }
    }
}

// XXX should these be exported? They are in the API, but I don't think people _really_ need them?
export type EasingName = Exclude<keyof typeof Easing, 'generatePow'> 
export type EasingMode = keyof EasingFunctionGroup
export type EasingFunctionName = 'Linear' | `${EasingName}${EasingMode}`

function easingFunctionFromName(easingFunction: string) {
    if (easingFunction === 'Linear') {
        return Easing.Linear.None
    }
    const breakIndex = easingFunction.search(/In|Out/)
    const name = easingFunction.substring(0, breakIndex) as EasingName
    const mode = easingFunction.substring(breakIndex) as EasingMode
    return Easing[name][mode]
}

// remainder of file lifted verbatim from https://github.com/tweenjs/tween.js/blob/main/src/Easing.ts
// License: MIT
// 
// Note: some of the code is rather 'leet' looking, and I would not recommend writing with that style

export type EasingFunction = (amount: number) => number

export type EasingFunctionGroup = {
    In: EasingFunction
    Out: EasingFunction
    InOut: EasingFunction
}

export const Easing = Object.freeze({
    Linear: Object.freeze<EasingFunctionGroup & { None: EasingFunction }>({
        None(amount: number): number {
            return amount
        },
        In(amount: number): number {
            return amount
        },
        Out(amount: number): number {
            return amount
        },
        InOut(amount: number): number {
            return amount
        },
    }),

    Quadratic: Object.freeze(<EasingFunctionGroup>{
        In(amount: number): number {
            return amount * amount
        },
        Out(amount: number): number {
            return amount * (2 - amount)
        },
        InOut(amount: number): number {
            if ((amount *= 2) < 1) {
                return 0.5 * amount * amount
            }

            return -0.5 * (--amount * (amount - 2) - 1)
        },
    }),

    Cubic: Object.freeze(<EasingFunctionGroup>{
        In(amount: number): number {
            return amount * amount * amount
        },
        Out(amount: number): number {
            return --amount * amount * amount + 1
        },
        InOut(amount: number): number {
            if ((amount *= 2) < 1) {
                return 0.5 * amount * amount * amount
            }
            return 0.5 * ((amount -= 2) * amount * amount + 2)
        },
    }),

    Quartic: Object.freeze(<EasingFunctionGroup>{
        In(amount: number): number {
            return amount * amount * amount * amount
        },
        Out(amount: number): number {
            return 1 - --amount * amount * amount * amount
        },
        InOut(amount: number): number {
            if ((amount *= 2) < 1) {
                return 0.5 * amount * amount * amount * amount
            }

            return -0.5 * ((amount -= 2) * amount * amount * amount - 2)
        },
    }),

    Quintic: Object.freeze(<EasingFunctionGroup>{
        In(amount: number): number {
            return amount * amount * amount * amount * amount
        },
        Out(amount: number): number {
            return --amount * amount * amount * amount * amount + 1
        },
        InOut(amount: number): number {
            if ((amount *= 2) < 1) {
                return 0.5 * amount * amount * amount * amount * amount
            }

            return 0.5 * ((amount -= 2) * amount * amount * amount * amount + 2)
        },
    }),

    Sinusoidal: Object.freeze(<EasingFunctionGroup>{
        In(amount: number): number {
            return 1 - Math.sin(((1.0 - amount) * Math.PI) / 2)
        },
        Out(amount: number): number {
            return Math.sin((amount * Math.PI) / 2)
        },
        InOut(amount: number): number {
            return 0.5 * (1 - Math.sin(Math.PI * (0.5 - amount)))
        },
    }),

    Exponential: Object.freeze(<EasingFunctionGroup>{
        In(amount: number): number {
            return amount === 0 ? 0 : Math.pow(1024, amount - 1)
        },
        Out(amount: number): number {
            return amount === 1 ? 1 : 1 - Math.pow(2, -10 * amount)
        },
        InOut(amount: number): number {
            if (amount === 0) {
                return 0
            }

            if (amount === 1) {
                return 1
            }

            if ((amount *= 2) < 1) {
                return 0.5 * Math.pow(1024, amount - 1)
            }

            return 0.5 * (-Math.pow(2, -10 * (amount - 1)) + 2)
        },
    }),

    Circular: Object.freeze(<EasingFunctionGroup>{
        In(amount: number): number {
            return 1 - Math.sqrt(1 - amount * amount)
        },
        Out(amount: number): number {
            return Math.sqrt(1 - --amount * amount)
        },
        InOut(amount: number): number {
            if ((amount *= 2) < 1) {
                return -0.5 * (Math.sqrt(1 - amount * amount) - 1)
            }
            return 0.5 * (Math.sqrt(1 - (amount -= 2) * amount) + 1)
        },
    }),

    Elastic: Object.freeze(<EasingFunctionGroup>{
        In(amount: number): number {
            if (amount === 0) {
                return 0
            }

            if (amount === 1) {
                return 1
            }

            return -Math.pow(2, 10 * (amount - 1)) * Math.sin((amount - 1.1) * 5 * Math.PI)
        },
        Out(amount: number): number {
            if (amount === 0) {
                return 0
            }

            if (amount === 1) {
                return 1
            }
            return Math.pow(2, -10 * amount) * Math.sin((amount - 0.1) * 5 * Math.PI) + 1
        },
        InOut(amount: number): number {
            if (amount === 0) {
                return 0
            }

            if (amount === 1) {
                return 1
            }

            amount *= 2

            if (amount < 1) {
                return -0.5 * Math.pow(2, 10 * (amount - 1)) * Math.sin((amount - 1.1) * 5 * Math.PI)
            }

            return 0.5 * Math.pow(2, -10 * (amount - 1)) * Math.sin((amount - 1.1) * 5 * Math.PI) + 1
        },
    }),

    Back: Object.freeze(<EasingFunctionGroup>{
        In(amount: number): number {
            const s = 1.70158
            return amount === 1 ? 1 : amount * amount * ((s + 1) * amount - s)
        },
        Out(amount: number): number {
            const s = 1.70158
            return amount === 0 ? 0 : --amount * amount * ((s + 1) * amount + s) + 1
        },
        InOut(amount: number): number {
            const s = 1.70158 * 1.525
            if ((amount *= 2) < 1) {
                return 0.5 * (amount * amount * ((s + 1) * amount - s))
            }
            return 0.5 * ((amount -= 2) * amount * ((s + 1) * amount + s) + 2)
        },
    }),

    Bounce: Object.freeze(<EasingFunctionGroup>{
        In(amount: number): number {
            return 1 - Easing.Bounce.Out(1 - amount)
        },
        Out(amount: number): number {
            if (amount < 1 / 2.75) {
                return 7.5625 * amount * amount
            } else if (amount < 2 / 2.75) {
                return 7.5625 * (amount -= 1.5 / 2.75) * amount + 0.75
            } else if (amount < 2.5 / 2.75) {
                return 7.5625 * (amount -= 2.25 / 2.75) * amount + 0.9375
            } else {
                return 7.5625 * (amount -= 2.625 / 2.75) * amount + 0.984375
            }
        },
        InOut(amount: number): number {
            if (amount < 0.5) {
                return Easing.Bounce.In(amount * 2) * 0.5
            }
            return Easing.Bounce.Out(amount * 2 - 1) * 0.5 + 0.5
        },
    }),

    generatePow(power = 4): EasingFunctionGroup {
        power = power < Number.EPSILON ? Number.EPSILON : power
        power = power > 10000 ? 10000 : power
        return {
            In(amount: number): number {
                return amount ** power
            },
            Out(amount: number): number {
                return 1 - (1 - amount) ** power
            },
            InOut(amount: number): number {
                if (amount < 0.5) {
                    return (amount * 2) ** power / 2
                }
                return (1 - (2 - amount * 2) ** power) / 2 + 0.5
            },
        }
    },
})
