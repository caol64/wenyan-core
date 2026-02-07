import { FormDataEncoder } from "form-data-encoder";
import { FormData } from "formdata-node";
import { Readable } from "node:stream";
import { HttpAdapter } from "../http.js";

export const nodeHttpAdapter: HttpAdapter = {
    fetch,

    createMultipart(field, file, filename) {
        const form = new FormData();
        form.append(field, file, filename);
        const encoder = new FormDataEncoder(form);

        return {
            body: Readable.from(encoder) as any,
            headers: encoder.headers,
            duplex: "half",
        };
    },
};
