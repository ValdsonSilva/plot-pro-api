import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

type UploadResourceType = "image" | "video" | "raw" | "auto";

type UploadResult = {
    public_id: string;
    secure_url: string;
    url: string;
    resource_type: string;
    bytes: number;
};

let configured = false;

function ensureCloudinaryConfig() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        const err: any = new Error("Cloudinary não configurado. Verifique CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.");
        err.statusCode = 500;
        throw err;
    }

    if (!configured) {
        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
        });

        configured = true;
    }
}

function bufferToStream(buffer: Buffer) {
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    return readable;
}

export const cloudinaryService = {
    async uploadBuffer(input: {
        buffer: Buffer;
        originalName: string;
        folder?: string;
        resourceType?: UploadResourceType;
    }): Promise<UploadResult> {
        ensureCloudinaryConfig();

        const folder = input.folder ?? "plotpro/documents";
        const resourceType = input.resourceType ?? "raw";

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: resourceType,
                    use_filename: true,
                    unique_filename: true,
                    filename_override: input.originalName,
                },
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error("Cloudinary não retornou resultado do upload"));

                    resolve({
                        public_id: result.public_id,
                        secure_url: result.secure_url,
                        url: result.url,
                        resource_type: result.resource_type,
                        bytes: result.bytes,
                    });
                }
            );

            bufferToStream(input.buffer).pipe(uploadStream);
        });
    },

    async deleteFile(publicId: string, resourceType: string = "raw") {
        ensureCloudinaryConfig();

        return cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType as any,
        });
    },
};