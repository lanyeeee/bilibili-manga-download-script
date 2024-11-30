export interface Episode {
    is_locked: boolean | null,
    comic_id: number | null,
    comic_title: string | null,
    short_title: string | null,
    title: string | null,
    images: Image[],
}

export interface Image {
    index: number,
    size: number | null,
    width: number,
    height: number,
    img: Blob | null,
    img_url: string | null,
    path: string,
    url: string | null,
}