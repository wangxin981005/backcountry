import {GameState, PlayerState} from "../actions.js";
import {world_map} from "../worlds/wor_map.js";
import {world_shop} from "../worlds/wor_shop.js";
import {world_wanted} from "../worlds/wor_wanted.js";
import {Defeat} from "./Defeat.js";
import {Intro} from "./Intro.js";
import {Playing} from "./Playing.js";
import {Store} from "./Store.js";
import {Victory} from "./Victory.js";
import {Wanted} from "./Wanted.js";

export function App(state: GameState) {
    if (state.WorldFunc === world_map) {
        return Intro();
    }
    if (state.WorldFunc === world_shop) {
        return Store();
    }
    if (state.WorldFunc === world_wanted) {
        return Wanted(state);
    }
    if (state.PlayerState === PlayerState.Victory) {
        return Victory();
    }
    if (state.PlayerState === PlayerState.Defeat) {
        return Defeat(state);
    }
    return Playing(state);
}
