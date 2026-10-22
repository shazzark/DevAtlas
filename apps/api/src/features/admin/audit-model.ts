import mongoose from "mongoose";

const auditEventSchema = new mongoose.Schema({
  actorId: { type: String, required: true, maxlength: 320 },
  action: { type: String, required: true, maxlength: 80 },
  entityType: { type: String, required: true, maxlength: 40 },
  entitySlug: { type: String, required: true, maxlength: 120 },
  previousStatus: { type: String, default: null },
  nextStatus: { type: String, default: null },
  changedFields: { type: [String], default: [] },
}, { timestamps: { createdAt: true, updatedAt: false }, strict: "throw", collection: "admin_audit_events" });

auditEventSchema.index({ createdAt: -1, _id: -1 }, { name: "admin_audit_timeline" });
auditEventSchema.index({ entityType: 1, entitySlug: 1, createdAt: -1 }, { name: "admin_audit_entity" });

export const AdminAuditEventModel = mongoose.models.AdminAuditEvent ?? mongoose.model("AdminAuditEvent", auditEventSchema);

export async function writeAdminAuditEvent(event: Record<string, unknown>): Promise<void> {
  await AdminAuditEventModel.create(event);
}
