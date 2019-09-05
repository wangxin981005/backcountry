import {Entity, Game} from "../game.js";
import {Get} from "./com_index.js";

export interface Mimic {
    /** Entity whose transform to mimic. */
    Target: Entity;
    /** How laggy vs. precise is the mimicking [0-1]. */
    Stiffness: number;
}

export function mimic(Target: Entity, Stiffness: number = 0.1) {
    return (game: Game, entity: Entity) => {
        game.World[entity] |= 1 << Get.Mimic;
        game[Get.Mimic][entity] = <Mimic>{Target, Stiffness};
    };
}
