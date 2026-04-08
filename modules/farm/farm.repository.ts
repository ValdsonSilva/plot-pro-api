import { prisma } from "../../infra/db/prisma";

export const farmRepo = {
  create(data: { name: string; location?: string; is_active?: boolean }) {
    return prisma.farm.create({ data });
  },
  list() {
    return prisma.farm.findMany({ orderBy: { id: "desc" } });
  },
  getById(id: string) {
    return prisma.farm.findUnique({ where: { id } });
  },
  update(id: string, data: any) {
    return prisma.farm.update({ where: { id }, data });
  }
};
