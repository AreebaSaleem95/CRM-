import { prisma } from "../../lib/prisma";

export async function logActivity(userId: number, action: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  if (!user) return;
  await prisma.activity.create({ data: { userId, text: `${user.name} ${action}` } });
}