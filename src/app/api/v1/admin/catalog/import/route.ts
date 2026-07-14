import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import { importCatalog } from "@/features/vehicle-catalog/services";
import { IMPORT_MAX_BYTES } from "@/features/vehicle-catalog/constants";
import { AppError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = contentLengthHeader
      ? Number(contentLengthHeader)
      : null;

    if (contentLength !== null && contentLength > IMPORT_MAX_BYTES) {
      throw new AppError(
        "CAT_004",
        `Fichier trop volumineux (max ${IMPORT_MAX_BYTES} octets)`,
        413,
      );
    }

    const body = await request.json();
    const serialized = JSON.stringify(body);
    if (serialized.length > IMPORT_MAX_BYTES) {
      throw new AppError(
        "CAT_004",
        `Fichier trop volumineux (max ${IMPORT_MAX_BYTES} octets)`,
        413,
      );
    }

    const report = await importCatalog(
      body,
      admin.id,
      clientIp(request),
      serialized.length,
    );
    return jsonOk({ report });
  } catch (error) {
    return handleRouteError(error);
  }
}
