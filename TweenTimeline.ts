import { Tween } from "Tween";
import { Easing, EasingFunction } from "TweenEasing";
import { ITween, ITweenTimeline, ITweenTimeSource } from "TweenInterfaces";

type TimedPeriod = { startTime: number, endTime: number }
type TimedTween = TimedPeriod & { tween: ITween }

function intersects(a: TimedPeriod, b: TimedPeriod): boolean {
    return a.startTime < b.endTime && b.startTime < a.endTime
}

export class TweenTimeline extends Tween implements ITweenTimeline {

    static Build(
        easing: EasingFunction = Easing.Linear.None,
        beginLoop?: () => void,
        endLoop?: () => void,
        id?: unknown,
    ) {
        return new TweenTimeline.Builder(
            easing,
            beginLoop,
            endLoop,
            id)
    }
    static Builder = class Builder {
        tweens: TimedTween[] = []

        constructor(
            public easing = Easing.Linear.None,
            public beginLoop?: () => void,
            public endLoop?: () => void,
            public id?: unknown,
        ) {
        }

        /**
         * Add a tween to the timeline
         * @param startTime The start time of the tween relative to the start of the timeline.
         * @param tween The tween to add
         */
        addTween(startTime: number, tween: ITween): Builder {
            this.tweens.push({ startTime, endTime: startTime + tween.duration, tween })
            return this
        }

        addTweensInParallel(tweens: ITween[], startTime: number = 0): Builder {
            tweens.forEach((tween) => this.addTween(startTime, tween))
            return this           
        }

        addTweensInSeries(tweens: ITween[], startTime: number = 0, delay: number = 0): Builder {
            let time = startTime
            tweens.forEach((tween) => {
                this.addTween(time, tween)
                time += tween.duration + delay
            })
            return this
        }

        create(): ITweenTimeline {
            return new TweenTimeline(
                this.tweens,
                this.easing,
                this.beginLoop,
                this.endLoop,
                this.id,
            )
        }

    }

    private previousTimeCode?: number

    private constructor(
        private tweens: TimedTween[],
        easing: EasingFunction,
        beginLoop?: () => void,
        endLoop?: () => void,
        id?: unknown,
    ) {
        super(
            tweens.reduce((max, { endTime }) => Math.max(max, endTime), 0),
            easing,
            (percentComplete: number) => {
                const timeCode = percentComplete * this.duration
                const previousTimeCode = this.previousTimeCode
                const forward = previousTimeCode === undefined || previousTimeCode < timeCode
                let tweensToUpdate: TimedTween[]
                if (previousTimeCode !== undefined) {
                    // figure out which tweens need to be updated based on what intersects with the 
                    // period between the last time code and current time code
                    const period = previousTimeCode <= timeCode
                        ? { startTime: previousTimeCode, endTime: timeCode }
                        : { startTime: timeCode, endTime: previousTimeCode }
                    tweensToUpdate = tweens.filter((tween) => intersects(period, tween))
                } else {
                    // first update, so all tweens need updating
                    tweensToUpdate = tweens.slice()
                }

                // sort active tweens by reverse first effect in direction
                if (forward) {
                    // put earlier start times last
                    tweensToUpdate.sort((a, b) => b.startTime - a.startTime)
                } else {
                    // put later end times last
                    tweensToUpdate.sort((a, b) => a.endTime - b.endTime)
                }

                // update active tweens in reverse first effect order (so that last effect is processed last if duplicate attributes are being affected)
                tweensToUpdate.forEach(({ startTime, tween }) => tween.update(timeCode - startTime))

                // remember for next update
                this.previousTimeCode = timeCode
            },
            beginLoop,
            endLoop,
            id
        )
    }

    override setTimeSource(timeSource: ITweenTimeSource): void {
        super.setTimeSource(timeSource)
        this.tweens.forEach(({ tween }) => tween.setTimeSource(timeSource))
    }

    override timeSourceStart(): void {
        super.timeSourceStart()
        this.tweens.forEach(({ tween }) => tween.timeSourceStart())
    }

    override timeSourceStop(): void {
        super.timeSourceStop()
        this.tweens.forEach(({ tween }) => tween.timeSourceStop())
    }

    timeSourceLoopBegin(): void {
        super.timeSourceLoopBegin()
        this.tweens.forEach(({ tween }) => tween.timeSourceLoopBegin())
        this.previousTimeCode = undefined
    }

    timeSourceLoopEnd(): void {
        super.timeSourceLoopEnd()
        this.tweens.forEach(({ tween }) => tween.timeSourceLoopEnd())
    }
}
