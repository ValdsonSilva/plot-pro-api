import { Prisma, User } from "../../generated/client/client";
import { prisma } from "../../infra/db/prisma";

export const userRepo = {
    create(data: {
        name: string
        email?: string
        password_hash: string
        role?: string
        is_active?: boolean
        farm_id: string
    }) {
        return prisma.user.create({
            data
        })
    },

    findById(id: string) {
        return prisma.user.findUnique({ where: { id } });
    },

    list(args: { q?: string; role?: string; isActive?: boolean; skip?: number; take?: number }) {
        const { q, role, isActive, skip = 0, take = 50 } = args;

        return prisma.user.findMany({
            where: {
                role,
                is_active: isActive,
                ...(q
                    ? {
                        OR: [
                            { name: { contains: q, mode: "insensitive" } },
                            { email: { contains: q, mode: "insensitive" } },
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
        return prisma.user.update({ where: { id }, data });
    },
};
