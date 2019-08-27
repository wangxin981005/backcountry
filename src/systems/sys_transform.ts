import {Get} from "../components/com_index.js";
import {Transform} from "../components/com_transform.js";
import {Game} from "../game.js";
import {from_rotation_translation_scale} from "../math/mat4.js";

const QUERY = 1 << Get.Transform;

export function sys_transform(game: Game, delta: number) {
    for (let i = 0; i < game.world.length; i++) {
        if ((game.world[i] & QUERY) === QUERY) {
            update(game[Get.Transform][i]);
        }
    }
}

function update(transform: Transform) {
    if (transform.dirty) {
        transform.dirty = false;
        set_children_as_dirty(transform);

        from_rotation_translation_scale(
            transform.world,
            transform.rotation,
            transform.translation,
            transform.scale
        );

        if (transform.parent) {
            transform.world.preMultiplySelf(transform.parent.world);
        }

        transform.self = transform.world.inverse();

        // Cache the Float32Arrays created from DOMMatrices.
        transform.world32 = transform.world.toFloat32Array();
        transform.self32 = transform.self.toFloat32Array();
    }
}

function set_children_as_dirty(transform: Transform) {
    for (let child of transform.children) {
        child.dirty = true;
        set_children_as_dirty(child);
    }
}
