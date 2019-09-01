import {EmitParticles} from "../components/com_emit_particles.js";
import {Get} from "../components/com_index.js";
import {RenderKind} from "../components/com_render.js";
import {RenderBasic} from "../components/com_render_basic.js";
import {RenderParticles} from "../components/com_render_particles.js";
import {RenderShaded} from "../components/com_render_shaded.js";
import {RenderInstanced} from "../components/com_render_vox.js";
import {Transform} from "../components/com_transform.js";
import {Game} from "../game.js";
import {ParticleAttribute} from "../materials/mat_particles.js";
import {get_translation} from "../math/mat4.js";

const QUERY = (1 << Get.Transform) | (1 << Get.Render);

export function sys_render(game: Game, delta: number) {
    game.gl.clear(game.gl.COLOR_BUFFER_BIT | game.gl.DEPTH_BUFFER_BIT);

    let light_positions: Array<number> = [];
    let light_details: Array<number> = [];

    for (let i = 0; i < game.lights.length; i++) {
        let light = game.lights[i];
        let transform = game[Get.Transform][light.Entity];
        let position = get_translation([], transform.World);
        light_positions.push(...position);
        light_details.push(...light.Color, light.Intensity);
    }

    // Keep track of the current material to minimize switching.
    let current_material = null;

    for (let i = 0; i < game.world.length; i++) {
        if ((game.world[i] & QUERY) === QUERY) {
            let transform = game[Get.Transform][i];
            let render = game[Get.Render][i];

            // TODO Sort by material.
            if (render.Material !== current_material) {
                current_material = render.Material;

                let {gl, program, uniforms} = current_material;
                gl.useProgram(program);
                // TODO Support more than one camera.
                gl.uniformMatrix4fv(uniforms.Upv, false, game.cameras[0].PV);

                switch (render.Kind) {
                    case RenderKind.Shaded:
                    case RenderKind.Instanced:
                        gl.uniform1i(uniforms.Ulight_count, game.lights.length);
                        gl.uniform3fv(uniforms.Ulight_positions, light_positions);
                        gl.uniform4fv(uniforms.Ulight_details, light_details);
                        break;
                }
            }

            switch (render.Kind) {
                case RenderKind.Basic:
                    draw_basic(transform, render);
                    break;
                case RenderKind.Shaded:
                    draw_shaded(transform, render);
                    break;
                case RenderKind.Instanced:
                    draw_instanced(game, transform, render);
                    break;
                case RenderKind.Particles: {
                    let emitter = game[Get.EmitParticles][i];
                    if (emitter.Instances.length) {
                        draw_particles(render, emitter);
                    }
                    break;
                }
            }
        }
    }
}

function draw_basic(transform: Transform, render: RenderBasic) {
    let {gl, mode, uniforms} = render.Material;
    gl.uniformMatrix4fv(uniforms.Uworld, false, transform.World);
    gl.uniform4fv(uniforms.Ucolor, render.Color);
    gl.bindVertexArray(render.VAO);
    gl.drawElements(mode, render.Count, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
}

function draw_shaded(transform: Transform, render: RenderShaded) {
    let {gl, mode, uniforms} = render.Material;
    gl.uniformMatrix4fv(uniforms.Uworld, false, transform.World);
    gl.uniformMatrix4fv(uniforms.Uself, false, transform.Self);
    gl.uniform4fv(uniforms.Ucolor, render.Color);
    gl.bindVertexArray(render.VAO);
    gl.drawElements(mode, render.Count, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
}

function draw_instanced(game: Game, transform: Transform, render: RenderInstanced) {
    let {gl, mode, uniforms} = render.Material;
    gl.uniformMatrix4fv(uniforms.Uworld, false, transform.World);
    gl.uniformMatrix4fv(uniforms.Uself, false, transform.Self);
    gl.uniform3fv(uniforms.Upalette, render.Palette || game.palette);
    gl.bindVertexArray(render.VAO);
    gl.drawElementsInstanced(mode, render.IndexCount, gl.UNSIGNED_SHORT, 0, render.InstanceCount);
    gl.bindVertexArray(null);
}

function draw_particles(render: RenderParticles, emitter: EmitParticles) {
    let {gl, mode, uniforms} = render.Material;
    gl.uniform1f(uniforms.Usize, emitter.Size);
    gl.uniform1f(uniforms.Uvertical, emitter.Vertical);
    gl.uniform3fv(uniforms.Ustart_color, render.ColorStart);
    gl.uniform3fv(uniforms.Uend_color, render.ColorEnd);

    gl.bindBuffer(gl.ARRAY_BUFFER, render.Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(emitter.Instances), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(ParticleAttribute.id);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 5 * 4, 0);
    gl.enableVertexAttribArray(ParticleAttribute.origin);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 5 * 4, 1 * 4);
    gl.enableVertexAttribArray(ParticleAttribute.age);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 5 * 4, 4 * 4);
    gl.drawArrays(mode, 0, emitter.Particles.length);
}
