import {Episode} from "./types";

const episodes: Record<number, Episode> = {};

export const store = {
    episodes: episodes,
    get_current_ep_id(): number {
        const [, , ep_id] = window.location.href.match(/\/mc(\d+)\/(\d+)/) || [];
        return parseInt(ep_id);
    }
};