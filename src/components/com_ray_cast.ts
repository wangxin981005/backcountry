import {Entity, Game} from "../game.js";
import {Vec3} from "../math/index.js";
import {Get} from "./com_index.js";
import {RayTarget} from "./com_ray_target.js";

export interface RayCast {
    origin: Vec3;
    direction: Vec3;
    hit: null | {
        other: RayTarget;
        contact: Vec3;
    };
}

export function ray_cast() {
    return (game: Game) => (entity: Entity) => {
        game.world[entity] |= 1 << Get.RayCast;
        game[Get.RayCast][entity] = <RayCast>{
            origin: [0, 0, 0],
            direction: [0, 0, 0],
            hit: null,
        };
    };
}
