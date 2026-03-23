import { HttpAdapter } from "../http.js";

export const browserHttpAdapter: HttpAdapter = {
    fetch,

    createMultipart(field, file, filename) {
        const form = new FormData();
        form.append(field, file, filename);

        return {
            body: form,
        };
    },
};
