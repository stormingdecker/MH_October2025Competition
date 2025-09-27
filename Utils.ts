import { Entity } from "horizon/core"

/**
 * Ensures that type is only one of a type union
 */
export type OnlyOne<Options, T> = Options extends infer OneOption
    ? [T] extends [OneOption] ? OneOption : never
    : never

/**
 * Get a suitable unique id for an entity tween
 * @param entity the entity of the tween
 * @param object the entity sub object on the tween that has the tweened property
 * @param property the name of the tweened property
 * @returns a name unique to the entity/sub object/property combination
 */
export function makeEntityTweenId(entity: Entity, object: object, property: string) {
    const name = entity.name.get()
    return `Entity-${entity.id}${name ? `(${name})` : ""}-${object.constructor.name}.${property}`
}
