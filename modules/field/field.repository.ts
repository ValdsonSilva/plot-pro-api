import { prisma } from "../../infra/db/prisma";

type ListArgs = {
    farmId?: string;
    isActive?: boolean;
    q?: string;
    skip?: number;
    take?: number;
};

export const fieldRepo = {
    create(data: {
        farm_id: string;
        code: string;
        name: string;
        area_ha: number;
        geo_boundary?: any;
        is_active?: boolean;
    }) {
        return prisma.field.create({
            data: {
                farm_id: data.farm_id,
                code: data.code,
                name: data.name,
                area_ha: data.area_ha as any,
                geo_boundary: data.geo_boundary,
                is_active: data.is_active ?? true,
            },
        });
    },

    findById(id: string) {
        return prisma.field.findUnique({
            where: { id },
            include: { farm: true, field_events: true },
        });
    },

    list(args: ListArgs) {
        const { farmId, isActive, q, skip = 0, take = 20 } = args;

        return prisma.field.findMany({
            where: {
                farm_id: farmId,
                is_active: isActive,
                ...(q
                    ? {
                        OR: [
                            { name: { contains: q, mode: "insensitive" } },
                            { code: { contains: q, mode: "insensitive" } },
                        ],
                    }
                    : {}),
            },
            include: { farm: true, field_events: true },
            orderBy: [{ id: "desc" }],
            skip,
            take,
        });
    },

    update(id: string, data: any) {
        return prisma.field.update({
            where: { id },
            data,
            include: { farm: true },
        });
    },
};
