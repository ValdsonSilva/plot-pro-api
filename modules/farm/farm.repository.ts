import { prisma } from "../../infra/db/prisma";

export const farmRepo = {
  create(data: {
    name: string;
    location?: string;
    is_active?: boolean;
    farm_map_document_id?: string;
  }) {
    return prisma.farm.create({
      data,
      include: {
        farm_map_document: true,
        fields: true,
        users: true,
      },
    });
  },

  list() {
    return prisma.farm.findMany({
      include: {
        farm_map_document: true,
      },
      orderBy: {
        id: "desc",
      },
    });
  },

  getById(id: string) {
    return prisma.farm.findUnique({
      where: { id },
      include: {
        farm_map_document: true,
        fields: true,
        users: true,
      },
    });
  },

  update(id: string, data: any) {
    return prisma.farm.update({
      where: { id },
      data,
      include: {
        farm_map_document: true,
        fields: true,
        users: true,
      },
    });
  },
};