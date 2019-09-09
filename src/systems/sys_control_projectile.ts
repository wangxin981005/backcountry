import {Get} from "../components/com_index.js";
import {Entity, Game} from "../game.js";
import {transform_direction} from "../math/vec3.js";

const QUERY = (1 << Get.Transform) | (1 << Get.Collide) | (1 << Get.Move) | (1 << Get.Projectile);

export function sys_control_projectile(game: Game, delta: number) {
    for (let i = 0; i < game.World.length; i++) {
        if ((game.World[i] & QUERY) === QUERY) {
            update(game, i);
        }
    }
}

function update(game: Game, entity: Entity) {
    let projectile = game[Get.Projectile][entity];
    let move = game[Get.Move][entity];
    let collide = game[Get.Collide][entity];

    if (collide.Collisions.length > 0) {
        game.Destroy(entity);
        for (let collider of collide.Collisions) {
            if (game.World[collider.EntityId] & (1 << Get.Health)) {
                game[Get.Health][collider.EntityId].Damages.push(
                    Math.random() * projectile.Damage + Math.random() * projectile.Damage
                );
            }
        }
    } else {
        // Always move in the projectile's front direction.
        move.Direction = transform_direction([], [0, 0, 1], game[Get.Transform][entity].World);
    }
}
