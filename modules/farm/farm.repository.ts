import { prisma } from "../../infra/db/prisma";

const farmInclude = {
  farm_map_document: true,
  fields: true,
  users: true,
};

export const farmRepo = {
  create(data: {
    name: string;
    location?: string;
    is_active?: boolean;
    farm_map_document_id?: string | null;
  }) {
    return prisma.farm.create({
      data,
      include: farmInclude,
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
      include: farmInclude,
    });
  },

  update(id: string, data: any) {
    return prisma.farm.update({
      where: { id },
      data,
      include: farmInclude,
    });
  },
};