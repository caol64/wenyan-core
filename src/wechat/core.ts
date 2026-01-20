import type { HttpAdapter } from "./http.js";

const tokenUrl = "https://api.weixin.qq.com/cgi-bin/token";
const publishUrl = "https://api.weixin.qq.com/cgi-bin/draft/add";
const uploadUrl = "https://api.weixin.qq.com/cgi-bin/material/add_material";

export function createWechatClient(adapter: HttpAdapter) {
    return {
        async fetchAccessToken(appId: string, appSecret: string) {
            const res = await adapter.fetch(
                `${tokenUrl}?grant_type=client_credential&appid=${appId}&secret=${appSecret}`,
            );
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },

        async uploadMaterial(type: string, file: Blob, filename: string, accessToken: string) {
            const multipart = adapter.createMultipart("media", file, filename);

            const res = await adapter.fetch(`${uploadUrl}?access_token=${accessToken}&type=${type}`, {
                ...multipart,
                method: "POST",
            });

            const data = await res.json();
            if (data.errcode && data.errcode !== 0) {
                throw new Error(`${data.errcode}: ${data.errmsg}`);
            }

            if (data.url?.startsWith("http://")) {
                data.url = data.url.replace(/^http:\/\//i, "https://");
            }

            return data;
        },

        async publishArticle(title: string, content: string, thumbMediaId: string, accessToken: string) {
            const res = await adapter.fetch(`${publishUrl}?access_token=${accessToken}`, {
                method: "POST",
                body: JSON.stringify({
                    articles: [{ title, content, thumb_media_id: thumbMediaId }],
                }),
            });

            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
    };
}
