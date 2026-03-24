export interface MultipartBody {
    body: BodyInit;
    headers?: Record<string, string>;
}

export interface HttpAdapter {
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
    createMultipart(field: string, file: Blob, filename: string): MultipartBody;
}

export const defaultHttpAdapter: HttpAdapter = {
    fetch,

    createMultipart(field, file, filename) {
        const form = new FormData();
        form.append(field, file, filename);

        return {
            body: form,
        };
    },
};
