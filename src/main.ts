// @ts-ignore isolatedModules

import {store} from "./store";
import JSZip from "jszip";
import "./hack";

// 自动缓存当前章节
async function cacheCurrentEpisode() {
    const process_bar = document.querySelector(".range-input") as HTMLInputElement | null;
    if (process_bar === null) {
        return;
    }

    process_bar.value = "0";
    process_bar.dispatchEvent(new Event("input"));

    while (true) {
        await new Promise<void>((resolve) => setTimeout(resolve, 10)); // 延迟 10ms
        if (parseInt(process_bar.value) !== parseInt(process_bar.max)) {
            toNextPage();
        }

        const allImagesLoaded = Object.values(store.episodes[store.get_current_ep_id()].images).every(item => item.img !== null);

        if (allImagesLoaded) {
            break;
        }
    }
}

// 下一页
function toNextPage() {
    const process_bar = document.querySelector(".range-input") as HTMLInputElement | null;
    if (process_bar === null) {
        return;
    }

    process_bar.value = `${parseInt(process_bar.value) + 1}`;
    process_bar.dispatchEvent(new Event("input"));
}

// 下一章节
function toNextEpisode(): boolean {
    const nextEpisodeButton = document.querySelector(".btn-right") as HTMLButtonElement | null;
    if (nextEpisodeButton === null) {
        return false;
    }

    // 如果nextEpisodeButton包含disabled的attribute，则不再点击
    if (nextEpisodeButton.hasAttribute("disabled")) {
        return false;
    }

    nextEpisodeButton.click();
    return true;
}

// 回到第一章节
function toFirstEpisode() {
    const episodeListDiv = document.querySelector(".episode-list") as HTMLDivElement | null;
    if (episodeListDiv === null) {
        console.log("未找到章节列表(.episode-list)");
        return;
    }

    const catalogDiv = episodeListDiv.querySelector(".data-list.p-relative.ps") as HTMLDivElement | null;
    if (catalogDiv === null) {
        console.log("未找到章节列表(.data-list.p-relative.ps)");
        return;
    }

    const firstEpisode = catalogDiv.querySelector("button") as HTMLButtonElement | null;
    if (firstEpisode === null) {
        console.log("未找到第一章节按钮");
        return;
    }

    firstEpisode.click();
}

// 下载当前章节
async function downloadEpisode() {
    const ep_id = store.get_current_ep_id();
    if (store.episodes[ep_id].is_locked) {
        return;
    }
    await cacheCurrentEpisode();

    const images = store.episodes[ep_id].images;
    const short_title = store.episodes[ep_id].short_title;
    const ep_title = store.episodes[ep_id].title;

    const zip = new JSZip();
    // 添加图片到 ZIP
    for (const img of images) {
        const blob = img.img;
        const imgName = `${img.index + 1}.jpg`;
        zip.file(imgName, blob);
    }

    const content = await zip.generateAsync({type: "blob"});
    const fileName = `${short_title} ${ep_title}`.trim() + ".zip";
    // 将 ZIP 文件下载到本地
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
}

// 下载所有章节
async function downloadAllEpisodes() {
    toFirstEpisode();
    await new Promise<void>((resolve) => setTimeout(resolve, 1000)); // 延迟 1s
    while (true) {
        await downloadEpisode();
        const success = toNextEpisode();
        if (!success) {
            console.log("下载完成");
            break;
        }
        await new Promise<void>((resolve) => setTimeout(resolve, 1000)); // 延迟 1s
    }
}


let try_count = 0;
const interval = setInterval(() => {
    try_count++;
    if (try_count >= 10) {
        // 尝试10次后停止
        clearInterval(interval);
    }
    // 如果.download-episode-button存在，则不再添加
    if (document.querySelector(".download-episode-button") !== null && document.querySelector(".download-all-episodes-button") !== null) {
        return;
    }

    const actionSettings = document.querySelector(".action-settings") as HTMLDivElement;
    if (actionSettings === null) {
        return;
    }

    // 创建下载按钮
    const downloadEpisodeButton = document.createElement("button");
    downloadEpisodeButton.innerHTML = `
                <img src="data:image/svg+xml;base64,PHN2ZyB0PSIxNzMyNDQxMDQ4MjEzIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjU3MjEiIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48cGF0aCBkPSJNOTE4LjMgNDY4LjZjLTE4LjggMC0zNCAxNS4yLTM0IDM0djMwOS42YzAgNi42LTE0LjQgMTguNy0zOCAxOC43SDE5MC4yYy0yMy41IDAtMzgtMTIuMS0zOC0xOC43VjQ4NmMwLTE4LjgtMTUuMi0zNC0zNC0zNHMtMzQgMTUuMi0zNCAzNHYzMjYuM2MwIDI0LjggMTIuOCA0OC40IDM1IDY0LjcgMTkuNCAxNC4yIDQ0LjYgMjIgNzEgMjJoNjU2LjFjMjYuNCAwIDUxLjYtNy44IDcxLTIyIDIyLjItMTYuMyAzNS0zOS45IDM1LTY0LjdWNTAyLjZjMC0xOC43LTE1LjMtMzQtMzQtMzR6IiBmaWxsPSIjOTc5Nzk3IiBwLWlkPSI1NzIyIj48L3BhdGg+PHBhdGggZD0iTTQ1MC40IDY3OS40YzE3LjggMTggNDEuNSAyOCA2Ni44IDI4LjFoMC41YzI1LjEgMCA0OC44LTkuNyA2Ni42LTI3LjRsMTU0LjQtMTUyLjhjMTMuMy0xMy4yIDEzLjUtMzQuNyAwLjItNDguMS0xMy4yLTEzLjMtMzQuNy0xMy41LTQ4LjEtMC4yTDU1MS4zIDYxNy4xYzAuNi0yLjYgMS01LjMgMS04LjFWMTQ5LjFjMC0xOC44LTE1LjItMzQtMzQtMzRzLTM0IDE1LjItMzQgMzRWNjA5YzAgMy4yIDAuNSA2LjMgMS4zIDkuM0wzNDUuOSA0NzcuMWMtMTMuMi0xMy4zLTM0LjctMTMuNS00OC4xLTAuMi0xMy4zIDEzLjItMTMuNSAzNC43LTAuMiA0OC4xbDE1Mi44IDE1NC40eiIgZmlsbD0iIzk3OTc5NyIgcC1pZD0iNTcyMyI+PC9wYXRoPjwvc3ZnPg==" width="24" style="width: 24px; height: 24px;">
                <br><span style="font-size: 12px;color: #ffffffe6">下载<span style="font-size: 12px;color: red; font-weight: bold">当前</span>章节</span>
                `;
    downloadEpisodeButton.className = "action-button app-button t-center p-relative download-episode-button";
    downloadEpisodeButton.onclick = downloadEpisode;

    // 创建下载所有章节按钮
    const downloadAllEpisodesButton = document.createElement("button");
    downloadAllEpisodesButton.innerHTML = `
                <img src="data:image/svg+xml;base64,PHN2ZyB0PSIxNzMyNDQxMDQ4MjEzIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjU3MjEiIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48cGF0aCBkPSJNOTE4LjMgNDY4LjZjLTE4LjggMC0zNCAxNS4yLTM0IDM0djMwOS42YzAgNi42LTE0LjQgMTguNy0zOCAxOC43SDE5MC4yYy0yMy41IDAtMzgtMTIuMS0zOC0xOC43VjQ4NmMwLTE4LjgtMTUuMi0zNC0zNC0zNHMtMzQgMTUuMi0zNCAzNHYzMjYuM2MwIDI0LjggMTIuOCA0OC40IDM1IDY0LjcgMTkuNCAxNC4yIDQ0LjYgMjIgNzEgMjJoNjU2LjFjMjYuNCAwIDUxLjYtNy44IDcxLTIyIDIyLjItMTYuMyAzNS0zOS45IDM1LTY0LjdWNTAyLjZjMC0xOC43LTE1LjMtMzQtMzQtMzR6IiBmaWxsPSIjOTc5Nzk3IiBwLWlkPSI1NzIyIj48L3BhdGg+PHBhdGggZD0iTTQ1MC40IDY3OS40YzE3LjggMTggNDEuNSAyOCA2Ni44IDI4LjFoMC41YzI1LjEgMCA0OC44LTkuNyA2Ni42LTI3LjRsMTU0LjQtMTUyLjhjMTMuMy0xMy4yIDEzLjUtMzQuNyAwLjItNDguMS0xMy4yLTEzLjMtMzQuNy0xMy41LTQ4LjEtMC4yTDU1MS4zIDYxNy4xYzAuNi0yLjYgMS01LjMgMS04LjFWMTQ5LjFjMC0xOC44LTE1LjItMzQtMzQtMzRzLTM0IDE1LjItMzQgMzRWNjA5YzAgMy4yIDAuNSA2LjMgMS4zIDkuM0wzNDUuOSA0NzcuMWMtMTMuMi0xMy4zLTM0LjctMTMuNS00OC4xLTAuMi0xMy4zIDEzLjItMTMuNSAzNC43LTAuMiA0OC4xbDE1Mi44IDE1NC40eiIgZmlsbD0iIzk3OTc5NyIgcC1pZD0iNTcyMyI+PC9wYXRoPjwvc3ZnPg==" width="24" style="width: 24px; height: 24px;">
                <br><span style="font-size: 12px;color: #ffffffe6">下载<span style="font-size: 12px;color: red; font-weight: bold">所有</span>章节</span>
                `;
    downloadAllEpisodesButton.className = "action-button app-button t-center p-relative download-all-episodes-button";
    downloadAllEpisodesButton.onclick = downloadAllEpisodes;

    actionSettings.insertBefore(downloadEpisodeButton, actionSettings.firstChild);
    actionSettings.appendChild(downloadAllEpisodesButton);

    actionSettings.style.width = "603px";
    actionSettings.style.left = "0px";

}, 500);