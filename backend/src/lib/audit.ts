import { prisma } from "./prisma.js";

export async function logAudit(params: {
  eventType: string;
  actorType: string;
  actorId?: number | null;
  entityType: string;
  entityId?: number | null;
  message: string;
  metadata?: Record<string, unknown> | null;
}) {
  return prisma.auditEvent.create({
    data: {
      eventType: params.eventType,
      actorType: params.actorType,
      actorId: params.actorId ?? null,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      message: params.message,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}
