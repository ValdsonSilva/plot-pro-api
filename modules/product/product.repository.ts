import { prisma } from "../../infra/db/prisma";

export const productRepo = {
    create(data: any) {
        return prisma.product.create({ data });
    },

    findById(id: string) {
        return prisma.product.findUnique({ where: { id } });
    },

    list(args: { q?: string; category?: string; skip?: number; take?: number }) {
        const { q, category, skip = 0, take = 50 } = args;

        return prisma.product.findMany({
            where: {
                category: category,
                ...(q
                    ? {
                        OR: [
                            { name: { contains: q, mode: "insensitive" } },
                            { manufacturer: { contains: q, mode: "insensitive" } },
                        ],
                    }
                    : {}),
            },
            orderBy: [{ id: "desc" }],
            skip,
            take,
        });
    },

    update(id: string, data: any) {
        return prisma.product.update({ where: { id }, data });
    },

    delete(id: string) {
        return prisma.product.delete({ where: { id } });
    },
};
