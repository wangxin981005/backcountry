import {Action, effect, GameState, PlayerState} from "./actions.js";
import {Blueprint} from "./blueprints/blu_common.js";
import {Animate} from "./components/com_animate.js";
import {AudioSource} from "./components/com_audio_source.js";
import {Camera} from "./components/com_camera.js";
import {Collide} from "./components/com_collide.js";
import {PlayerControl} from "./components/com_control_player.js";
import {Cull} from "./components/com_cull.js";
import {EmitParticles} from "./components/com_emit_particles.js";
import {Health} from "./components/com_health.js";
import {ComponentData, Get} from "./components/com_index.js";
import {Light} from "./components/com_light.js";
import {Mimic} from "./components/com_mimic.js";
import {Move} from "./components/com_move.js";
import {Named} from "./components/com_named.js";
import {Navigable} from "./components/com_navigable.js";
import {NPC} from "./components/com_npc.js";
import {Projectile} from "./components/com_projectile.js";
import {Render} from "./components/com_render.js";
import {Select} from "./components/com_select.js";
import {Shake} from "./components/com_shake.js";
import {Shoot} from "./components/com_shoot.js";
import {Toggle} from "./components/com_toggle.js";
import {transform, Transform} from "./components/com_transform.js";
import {Trigger} from "./components/com_trigger.js";
import {UI} from "./components/com_ui.js";
import {Walking} from "./components/com_walking.js";
import {Material} from "./materials/mat_common.js";
import {Mat} from "./materials/mat_index.js";
import {mat_instanced} from "./materials/mat_instanced.js";
import {mat_particles} from "./materials/mat_particles.js";
import {Model} from "./model.js";
import {palette} from "./palette.js";
import {sys_ai} from "./systems/sys_ai.js";
import {sys_aim} from "./systems/sys_aim.js";
import {sys_animate} from "./systems/sys_animate.js";
import {sys_audio} from "./systems/sys_audio.js";
import {sys_camera} from "./systems/sys_camera.js";
import {sys_collide} from "./systems/sys_collide.js";
import {sys_control_projectile} from "./systems/sys_control_projectile.js";
import {sys_cull} from "./systems/sys_cull.js";
import {sys_health} from "./systems/sys_health.js";
import {sys_mimic} from "./systems/sys_mimic.js";
import {sys_move} from "./systems/sys_move.js";
import {sys_navigate} from "./systems/sys_navigate.js";
import {sys_particles} from "./systems/sys_particles.js";
import {sys_player_control} from "./systems/sys_player_control.js";
import {sys_render} from "./systems/sys_render.js";
import {sys_select} from "./systems/sys_select.js";
import {sys_shake} from "./systems/sys_shake.js";
import {sys_shoot} from "./systems/sys_shoot.js";
import {sys_toggle} from "./systems/sys_toggle.js";
import {sys_transform} from "./systems/sys_transform.js";
import {sys_trigger} from "./systems/sys_trigger.js";
import {sys_ui} from "./systems/sys_ui.js";
import {GL_CULL_FACE, GL_CW, GL_DEPTH_TEST} from "./webgl.js";
import {world_intro} from "./worlds/wor_intro.js";

const MAX_ENTITIES = 10000;

export type Entity = number;

export interface InputState {
    [k: string]: number;
    mx: number;
    my: number;
}

export interface EventState {
    [k: string]: number;
    mx: number;
    my: number;
}

export class Game implements ComponentData, GameState {
    public World: Array<number>;
    public Grid: Array<Array<number>> = [];
    public [Get.Transform]: Array<Transform> = [];
    public [Get.Render]: Array<Render> = [];
    public [Get.Camera]: Array<Camera> = [];
    public [Get.Light]: Array<Light> = [];
    public [Get.AudioSource]: Array<AudioSource> = [];
    public [Get.Animate]: Array<Animate> = [];
    public [Get.Named]: Array<Named> = [];
    public [Get.Move]: Array<Move> = [];
    public [Get.Collide]: Array<Collide> = [];
    public [Get.Trigger]: Array<Trigger> = [];
    public [Get.Navigable]: Array<Navigable> = [];
    public [Get.Select]: Array<Select> = [];
    public [Get.Shoot]: Array<Shoot> = [];
    public [Get.PlayerControl]: Array<PlayerControl> = [];
    public [Get.Health]: Array<Health> = [];
    public [Get.Mimic]: Array<Mimic> = [];
    public [Get.EmitParticles]: Array<EmitParticles> = [];
    public [Get.Cull]: Array<Cull> = [];
    public [Get.Walking]: Array<Walking> = [];
    public [Get.NPC]: Array<NPC> = [];
    public [Get.Projectile]: Array<Projectile> = [];
    public [Get.Shake]: Array<Shake> = [];
    public [Get.Toggle]: Array<Toggle> = [];
    public [Get.UI]: Array<UI> = [];

    public Canvas: HTMLCanvasElement;
    public GL: WebGL2RenderingContext;
    public Audio: AudioContext = new AudioContext();
    public UI3D: HTMLElement = document.querySelector("main")!;
    public UI2D: HTMLElement = document.querySelector("nav")!;

    public Input: InputState = {
        mx: 0,
        my: 0,
    };
    public Event: EventState = {
        mx: 0,
        my: 0,
    };

    public Dispatch = (action: Action, ...args: Array<unknown>) => effect(this, action, args);
    public WorldFunc = world_intro;
    public SeedPlayer = 0;
    public SeedBounty = 0;
    public Trophies: Array<number> = [];
    public PlayerState = PlayerState.Playing;

    public Materials: Array<Material> = [];
    public Camera?: Camera;
    public Player?: Entity;
    public Models: Array<Model> = [];
    public Palette: Array<number> = palette;
    public Targets: Array<Collide> = [];
    private RAF: number = 0;

    constructor() {
        this.World = [];

        document.addEventListener("visibilitychange", () =>
            document.hidden ? this.Stop() : this.Start()
        );

        this.Canvas = document.querySelector("canvas")!;
        this.Canvas.width = window.innerWidth;
        this.Canvas.height = window.innerHeight;

        window.addEventListener("keydown", evt => (this.Input[evt.code] = 1));
        window.addEventListener("keyup", evt => (this.Input[evt.code] = 0));
        this.UI2D.addEventListener("contextmenu", evt => evt.preventDefault());
        this.UI2D.addEventListener("mousedown", evt => {
            this.Input[`m${evt.button}`] = 1;
            this.Event[`m${evt.button}d`] = 1;
        });
        this.UI2D.addEventListener("mouseup", evt => {
            this.Input[`m${evt.button}`] = 0;
            this.Event[`m${evt.button}u`] = 1;
        });
        this.UI2D.addEventListener("mousemove", evt => {
            this.Input.mx = evt.offsetX;
            this.Input.my = evt.offsetY;
        });

        this.GL = this.Canvas.getContext("webgl2")!;
        this.GL.enable(GL_DEPTH_TEST);
        this.GL.enable(GL_CULL_FACE);
        this.GL.frontFace(GL_CW);

        this.Materials[Mat.Instanced] = mat_instanced(this.GL);
        this.Materials[Mat.Particles] = mat_particles(this.GL);

        this.Dispatch(Action.InitGame);
    }

    CreateEntity(mask = 0) {
        for (let i = 0; i < MAX_ENTITIES; i++) {
            if (!this.World[i]) {
                this.World[i] = mask;
                return i;
            }
        }
        throw new Error("No more entities available.");
    }

    FixedUpdate(delta: number) {
        // Player input and AI.
        sys_select(this, delta);
        sys_player_control(this, delta);
        sys_ai(this, delta);
        sys_control_projectile(this, delta);
        // Game logic.
        sys_navigate(this, delta);
        sys_aim(this, delta);
        sys_particles(this, delta);
        sys_shake(this, delta);
        // Animation and movement.
        sys_animate(this, delta);
        sys_move(this, delta);
        sys_transform(this, delta);
        // Post-transform logic.
        sys_collide(this, delta);
        sys_trigger(this, delta);
        sys_shoot(this, delta);
        sys_health(this, delta);
        sys_mimic(this, delta);
        sys_cull(this, delta);
        sys_toggle(this, delta);

        for (let name in this.Event) {
            this.Event[name] = 0;
        }
    }

    FrameUpdate(delta: number) {
        sys_audio(this, delta);
        sys_camera(this, delta);
        sys_render(this, delta);
        sys_ui(this, delta);
    }

    Start() {
        let step = 1 / 60;
        let accumulator = 0;
        let last = performance.now();

        let tick = (now: number) => {
            let delta = (now - last) / 1000;
            accumulator += delta;
            while (accumulator > step) {
                accumulator -= step;
                this.FixedUpdate(step);
            }
            this.FrameUpdate(delta);

            last = now;
            this.RAF = requestAnimationFrame(tick);
        };

        this.Stop();
        this.Audio.resume();
        tick(last);
    }

    Stop() {
        this.Audio.suspend();
        cancelAnimationFrame(this.RAF);
    }

    Add({Translation, Rotation, Scale, Using = [], Children = []}: Blueprint) {
        let entity = this.CreateEntity(Get.Transform);
        transform(Translation, Rotation, Scale)(this, entity);
        for (let mixin of Using) {
            mixin(this, entity);
        }
        let entity_transform = this[Get.Transform][entity];
        for (let subtree of Children) {
            let child = this.Add(subtree);
            let child_transform = this[Get.Transform][child];
            child_transform.Parent = entity_transform;
            entity_transform.Children.push(child_transform);
        }
        return entity;
    }

    Destroy(entity: Entity) {
        let mask = this.World[entity];
        if (mask & (1 << Get.Transform)) {
            for (let child of this[Get.Transform][entity].Children) {
                this.Destroy(child.Entity);
            }
        }
        this.World[entity] = 0;
    }
}
