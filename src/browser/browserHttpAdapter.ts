import { HttpAdapter } from "../http.js";

export const browserHttpAdapter: HttpAdapter = {
    fetch: window.fetch.bind(window),

    createMultipart(field, file, filename) {
        const form = new FormData();
        form.append(field, file, filename);

        return {
            body: form,
        };
    },
};
