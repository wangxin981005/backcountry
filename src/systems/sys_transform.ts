import {Get} from "../components/com_index.js";
import {Transform} from "../components/com_transform.js";
import {Game} from "../game.js";
import {from_rotation_translation_scale} from "../math/mat4.js";

const QUERY = 1 << Get.Transform;

export function sys_transform(game: Game, delta: number) {
    for (let i = 0; i < game.World.length; i++) {
        if ((game.World[i] & QUERY) === QUERY) {
            update(game[Get.Transform][i]);
        }
    }
}

function update(transform: Transform) {
    if (transform.Dirty) {
        transform.Dirty = false;
        set_children_as_dirty(transform);

        from_rotation_translation_scale(
            transform.World,
            transform.Rotation,
            transform.Translation,
            transform.Scale
        );

        if (transform.Parent) {
            transform.World.preMultiplySelf(transform.Parent.World);
        }

        transform.Self = transform.World.inverse();

        // Cache the Float32Arrays created from DOMMatrices.
        transform.WorldArray = transform.World.toFloat32Array();
        transform.SelfArray = transform.Self.toFloat32Array();
    }
}

function set_children_as_dirty(transform: Transform) {
    for (let child of transform.Children) {
        child.Dirty = true;
        set_children_as_dirty(child);
    }
}
