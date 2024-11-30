import {Episode, Image} from "./types";
import {BiliResp, GetEpisodeResp, GetImageIndexResp, GetImageTokenResp} from "./responses";
import {store} from "./store";

interface GetImageTokenPayload {
    urls: string;
}

interface GetEpisodePayload {
    id: number;
}

interface GetImageIndexPayload {
    ep_id: number;
}

// 记录请求信息
const requestMap = new WeakMap<XMLHttpRequest, { method: string, url: string }>();

// 修改获取ImageToken的payload，请求原图
function modifyImageTokenPayload(payload: string) {
    const getImageTokenPayload = JSON.parse(payload) as GetImageTokenPayload;

    const parsedUrls = JSON.parse(getImageTokenPayload.urls) as string[];
    const [originUrl, _fmt] = parsedUrls[0].split("@");
    parsedUrls[0] = originUrl;
    getImageTokenPayload.urls = JSON.stringify(parsedUrls);

    return JSON.stringify(getImageTokenPayload);
}

// 从blob获取图片数据长度
function getImageDataLength(blob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (ev) {
            if (ev.target === null || ev.target.result === null) {
                return;
            }
            const arrayBuffer = ev.target.result as ArrayBuffer;
            const dataView = new DataView(arrayBuffer);
            const imageDataLength = dataView.getUint32(1);
            resolve(imageDataLength);
        };
        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsArrayBuffer(blob);
    });
}

// 劫持 XMLHttpRequest.open 方法
const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method: string, url: string) {
    if (["ImageToken?", "GetEpisode?", "GetImageIndex?"].some(s => url.includes(s))) {
        requestMap.set(this, {method, url});
    }
    return originalOpen.apply(this, arguments as any);
};

// 劫持 XMLHttpRequest.send 方法
const originalSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function (payload) {
    if (typeof payload !== "string") {
        return originalSend.call(this, payload);
    }

    if (payload.includes("urls")) {
        payload = modifyImageTokenPayload(payload);
    }

    const xhr = this;
    const request_info = requestMap.get(xhr);
    if (request_info === undefined) {
        return originalSend.call(this, payload);
    }

    if (request_info.url.includes("GetEpisode?")) {
        const getEpisodePayload = JSON.parse(payload) as GetEpisodePayload;
        const ep_id = getEpisodePayload.id;
        // 劫持 onload 事件
        const originalOnLoad = xhr.onload;
        xhr.onload = function () {
            const biliResp = JSON.parse(xhr.responseText) as BiliResp<GetEpisodeResp>;
            const getEpisodeResp = biliResp.data;
            if (!store.episodes[ep_id]) {
                store.episodes[ep_id] = {
                    comic_id: getEpisodeResp.comic_id,
                    comic_title: getEpisodeResp.comic_title,
                    short_title: getEpisodeResp.short_title,
                    title: getEpisodeResp.title,
                    images: [],
                } as Episode;
            } else {
                store.episodes[ep_id].comic_id = getEpisodeResp.comic_id;
                store.episodes[ep_id].comic_title = getEpisodeResp.comic_title;
                store.episodes[ep_id].short_title = getEpisodeResp.short_title;
                store.episodes[ep_id].title = getEpisodeResp.title;
            }
            if (originalOnLoad) {
                originalOnLoad.call(xhr, arguments as any);
            }
        };
    }

    if (request_info.url.includes("GetImageIndex?")) {
        const getImageIndexPayload = JSON.parse(payload) as GetImageIndexPayload;
        const ep_id = getImageIndexPayload.ep_id;

        // 劫持 onload 事件
        const originalOnLoad = xhr.onload;
        xhr.onload = function () {
            const biliResp = JSON.parse(xhr.responseText) as BiliResp<GetImageIndexResp>;
            const data = biliResp.data;

            if (!store.episodes[ep_id]) {
                store.episodes[ep_id] = {
                    comic_id: null,
                    comic_title: null,
                    short_title: null,
                    title: null,
                    images: [],
                } as Episode;
            }

            for (const [i, img] of data.images.entries()) {
                const img_url = img.path;
                const path = img_url.substring(img_url.lastIndexOf("/") + 1);
                store.episodes[ep_id].images.push({
                    index: i,
                    size: null,
                    width: img.x,
                    height: img.y,
                    img: null,
                    img_url: null,
                    path,
                    url: null,
                    hash: null,
                } as Image);
            }
            if (originalOnLoad) {
                originalOnLoad.call(xhr, arguments as any);
            }


        };
    }

    if (request_info.url.includes("ImageToken?")) {
        const getImageTokenPayload = JSON.parse(payload) as GetImageTokenPayload;
        const path = getImageTokenPayload.urls[0];
        // 劫持 onload 事件
        const originalOnLoad = xhr.onload;
        xhr.onload = function () {
            const biliResp = JSON.parse(xhr.responseText) as BiliResp<GetImageTokenResp>;
            const complete_url = biliResp.data[0].complete_url;
            const images = store.episodes[store.get_current_ep_id()].images;
            for (const [i, _] of images.entries()) {
                if (images[i].path !== path) {
                    continue;
                }
                images[i].url = complete_url;
            }
            if (originalOnLoad) {
                originalOnLoad.call(xhr, arguments as any);
            }
        };
    }

    // 调用原始 send 方法
    return originalSend.call(xhr, payload);
};

// 劫持 createObjectURL 方法
const originalCreateObjectURL = URL.createObjectURL;
URL.createObjectURL = function (blob: Blob) {
    const url = originalCreateObjectURL.call(URL, blob);
    const images = store.episodes[store.get_current_ep_id()].images;

    const interval = setInterval(() => {
        for (const i in images) {
            if (images[i].size === null) {
                continue;
            }

            let file_format = images[i].path.split(".")[3];

            if (file_format == "jpg") {
                file_format = "jpeg";
            }

            if (blob.type == "") {
                blob = new Blob([blob], {type: "image/" + file_format});
            }

            if (images[i].size === blob.size && images[i].img === null) {
                images[i].size = blob.size;
                images[i].img = blob;
                images[i].img_url = url;
                clearInterval(interval);
                break;
            } else if (blob.size <= 20480 && blob.size > images[i].size && blob.size < images[i].size + 16 && images[i].img == null) {
                images[i].size = blob.size;
                images[i].img = blob;
                images[i].img_url = url;
                clearInterval(interval);
                break;
            }
        }
    }, 100);

    return url;
};

// 劫持 fetch 方法
const originalFetch = window.fetch;
window.unsafeWindow.fetch = async function (url, options?) {
    const urlStr = url.toString();
    const response = await originalFetch(url, options);
    const cloneResponse = response.clone();
    const blob = await cloneResponse.blob();
    if (blob.size < 1024) {
        return response;
    }

    const images = store.episodes[store.get_current_ep_id()].images;

    for (const i in images) {
        if (urlStr.includes(images[i].path) && images[i].size == null) {
            if (blob.type.includes("image")) {
                images[i].size = blob.size;
            } else {
                images[i].size = await getImageDataLength(blob) - 16;
            }
            break;
        }
    }

    return response;
};

