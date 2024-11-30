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