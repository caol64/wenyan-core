export interface MultipartBody {
    body: BodyInit;
    headers?: Record<string, string>;
}

export interface HttpAdapter {
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
    createMultipart(field: string, file: Blob, filename: string): MultipartBody;
}

export interface UploadResponse {
    media_id: string;
    url: string;
};
