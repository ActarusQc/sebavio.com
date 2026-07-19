import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import {
  createAdminUserNote,
  listAdminUserNotes,
} from "@/features/admin/services";
import { adminUserNoteCreateSchema } from "@/features/admin/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const actor = await requirePermission("users.notes");
    const { id } = await params;
    const notes = await listAdminUserNotes(id, actor);
    return jsonOk({ notes });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const actor = await requirePermission("users.notes.create");
    const { id } = await params;
    const body = adminUserNoteCreateSchema.parse(await request.json());

    const note = await createAdminUserNote(id, actor, {
      content: body.content,
      category: body.category,
      importance: body.importance,
      ipAddress: clientIp(request),
    });
    return jsonOk({ note }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
