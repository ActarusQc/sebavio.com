import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import {
  deleteAdminUserNote,
  updateAdminUserNote,
} from "@/features/admin/services";
import { adminUserNoteUpdateSchema } from "@/features/admin/schemas";

type Params = { params: Promise<{ id: string; noteId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const actor = await requirePermission("users.notes");
    const { noteId } = await params;
    const body = adminUserNoteUpdateSchema.parse(await request.json());

    const note = await updateAdminUserNote(noteId, actor, {
      content: body.content,
      category: body.category,
      importance: body.importance,
      ipAddress: clientIp(request),
    });
    return jsonOk({ note });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const actor = await requirePermission("users.notes");
    const { noteId } = await params;

    await deleteAdminUserNote(noteId, actor, {
      ipAddress: clientIp(_request),
    });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
