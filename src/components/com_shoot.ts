import {Entity, Game} from "../game.js";
import {Vec3} from "../math/index.js";
import {Get} from "./com_index.js";

export interface Shoot {
    /** Target position to shoot at. */
    target: Vec3 | null;
}

export function shoot() {
    return (game: Game) => (entity: Entity) => {
        game.world[entity] |= 1 << Get.Shoot;
        game[Get.Shoot][entity] = <Shoot>{
            target: null,
        };
    };
}