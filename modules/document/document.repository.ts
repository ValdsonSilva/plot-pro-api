import { prisma } from "../../infra/db/prisma";

export const documentRepo = {
    create(data: { file_name: string; mime_type: string; storage_path: string }) {
        return prisma.document.create({ data });
    },

    findById(id: string) {
        return prisma.document.findUnique({ where: { id } });
    },

    list(args: { q?: string; skip?: number; take?: number }) {
        const { q, skip = 0, take = 50 } = args;

        return prisma.document.findMany({
            where: q ? { file_name: { contains: q, mode: "insensitive" } } : undefined,
            orderBy: [{ uploaded_at: "desc" }, { id: "desc" }],
            skip,
            take,
        });
    },

    delete(id: string) {
        return prisma.document.delete({ where: { id } });
    },
};
