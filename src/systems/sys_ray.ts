import {Collide} from "../components/com_collide.js";
import {Get} from "../components/com_index.js";
import {RayTarget} from "../components/com_ray_target.js";
import {Entity, Game} from "../game.js";
import {Vec3} from "../math/index.js";

const RAY_CAST = (1 << Get.Transform) | (1 << Get.RayCast);
const RAY_INTERSECT = (1 << Get.Transform) | (1 << Get.Collide) | (1 << Get.RayTarget);

export function sys_ray(game: Game, delta: number) {
    // Collect all intersectable colliders.
    let targets: Array<RayTarget> = [];
    for (let i = 0; i < game.world.length; i++) {
        if ((game.world[i] & RAY_INTERSECT) === RAY_INTERSECT) {
            targets.push(game[Get.RayTarget][i]);
        }
    }

    for (let i = 0; i < game.world.length; i++) {
        if ((game.world[i] & RAY_CAST) === RAY_CAST) {
            update(game, i, targets);
        }
    }
}

function update(game: Game, entity: Entity, targets: Array<RayTarget>) {
    let ray = game[Get.RayCast][entity];
    let nearest_t = Infinity;
    let nearest_i = null;
    for (let i = 0; i < targets.length; i++) {
        let target = targets[i];
        if (target.entity !== entity) {
            let aabb = game[Get.Collide][target.entity];
            let t = distance(ray.origin, ray.direction, aabb);
            if (t < nearest_t) {
                nearest_t = t;
                nearest_i = i;
            }
        }
    }

    if (nearest_i !== null) {
        ray.hit = {
            other: targets[nearest_i],
            contact: [
                ray.origin[0] + ray.direction[0] * nearest_t,
                ray.origin[1] + ray.direction[1] * nearest_t,
                ray.origin[2] + ray.direction[2] * nearest_t,
            ],
        };
    } else {
        ray.hit = null;
    }
}

function distance(origin: Vec3, direction: Vec3, aabb: Collide) {
    let max_lo = -Infinity;
    let min_hi = +Infinity;

    for (let i = 0; i < 3; i++) {
        let lo = (aabb.min[i] - origin[i]) / direction[i];
        let hi = (aabb.max[i] - origin[i]) / direction[i];

        if (lo > hi) {
            [lo, hi] = [hi, lo];
        }

        if (hi < max_lo || lo > min_hi) {
            return Infinity;
        }

        if (lo > max_lo) max_lo = lo;
        if (hi < min_hi) min_hi = hi;
    }

    return max_lo > min_hi ? Infinity : max_lo;
}