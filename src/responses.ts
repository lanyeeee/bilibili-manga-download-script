export interface BiliResp<T> {
    code: number;
    msg: string;
    data: T;
}

export interface GetEpisodeResp {
    title: string;
    comic_id: number;
    short_title: string;
    comic_title: string;
}

export interface GetImageIndexResp {
    path: string;
    images: ImageInGetImageIndexResp[];
    last_modified: string;
    host: string;
    cpx: string;
}

export interface ImageInGetImageIndexResp {
    path: string;
    x: number;
    y: number;
    video_path: string;
    video_size: string;
}

export type GetImageTokenResp = ImageTokenResp[];

export interface ImageTokenResp {
    url: string;
    token: string;
    complete_url: string;
    hit_encrpyt: boolean;
}

export interface GetEpisodeBuyInfoResp {
    is_locked: boolean;
    allow_coupon: boolean;
    after_lock_ep_gold: number;
    after_lock_ep_num: number;
    first_image_path: string;
    first_image_url: string;
    first_image_token: string;
    last_image_path: string;
    last_image_url: string;
    last_image_token: string;
    discount_type: number;
    discount: number;
    original_gold: number;
    first_bonus_percent: number;
    has_first_bonus: boolean;
    ep_discount_type: number;
    ep_discount: number;
    ep_original_gold: number;
    batch_buy: BatchBuyResp[];
    recommend_item_id: number;
    allow_item: boolean;
    remain_item: number;
    allow_wait_free: boolean;
    wait_free_at: string;
    has_newbie_gift: boolean;
    recommend_discount_id: number;
    recommend_discount: number;
    remain_discount_card: number;
    discount_ep_gold: number;
    discount_remain_gold: number;
    remain_silver: number;
    ep_silver: number;
    pay_entry_txt: string;
    user_card_state: number;
    price_type: number;
    guide_rebate: GuideRebateResp;
    one_gold_comic_buy_info: OneGoldComicBuyInfoResp;
    recommend_coupon_ids: any[];
    ep_pay_coupons: number;
    next_ep_discount: any;
    discount_marketing: any;
    comic_ep_gold: number;
    comic_ep_silver: number;
}

export interface BatchBuyResp {
    batch_limit: number;
    amount: number;
    original_gold: number;
    pay_gold: number;
    discount_type: number;
    discount: number;
    discount_batch_gold: number;
    usable: boolean;
}

export interface GuideRebateResp {
    is_covered: boolean;
    percent: number;
    min_ep_num: number;
    corner_text: string;
}

export interface OneGoldComicBuyInfoResp {
    limit: number;
    chapter_id: number;
    start: string;
    end: string;
    pay_str: string;
    is_locked: boolean;
}
