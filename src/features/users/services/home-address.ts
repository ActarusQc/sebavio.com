import "server-only";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  homeAddressSchema,
  type HomeAddressInput,
} from "@/features/users/schemas/home-address";
import { defaultProfileData } from "@/features/users/services/defaults";
import type { HomeAddressDto } from "@/features/users/types";
import { Prisma } from "@prisma/client";

async function ensureProfileRow(userId: string) {
  const existing = await prisma.userProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.userProfile.create({ data: defaultProfileData(userId) });
}

function decimalToNumber(
  value: Prisma.Decimal | number | null | undefined,
): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  return value.toNumber();
}

function toHomeDto(row: {
  homeAddressLabel: string | null;
  homeAddressPlaceId: string | null;
  homeAddressLatitude: Prisma.Decimal | number | null;
  homeAddressLongitude: Prisma.Decimal | number | null;
  homeAddressCity: string | null;
  homeAddressProvince: string | null;
  homeAddressPostalCode: string | null;
  homeAddressCountry: string | null;
}): HomeAddressDto | null {
  const lat = decimalToNumber(row.homeAddressLatitude);
  const lng = decimalToNumber(row.homeAddressLongitude);
  if (
    !row.homeAddressLabel ||
    !row.homeAddressPlaceId ||
    lat == null ||
    lng == null
  ) {
    return null;
  }
  return {
    label: row.homeAddressLabel,
    placeId: row.homeAddressPlaceId,
    latitude: lat,
    longitude: lng,
    city: row.homeAddressCity,
    province: row.homeAddressProvince,
    postalCode: row.homeAddressPostalCode,
    country: row.homeAddressCountry,
  };
}

export async function getHomeAddress(
  userId: string,
): Promise<HomeAddressDto | null> {
  const profile = await ensureProfileRow(userId);
  return toHomeDto(profile);
}

export async function upsertHomeAddress(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<HomeAddressDto> {
  const input: HomeAddressInput = homeAddressSchema.parse(raw);
  await ensureProfileRow(userId);

  const updated = await prisma.userProfile.update({
    where: { userId },
    data: {
      homeAddressLabel: input.homeAddressLabel,
      homeAddressPlaceId: input.homeAddressPlaceId,
      homeAddressLatitude: new Prisma.Decimal(input.homeAddressLatitude),
      homeAddressLongitude: new Prisma.Decimal(input.homeAddressLongitude),
      homeAddressCity: input.homeAddressCity ?? null,
      homeAddressProvince: input.homeAddressProvince ?? null,
      homeAddressPostalCode: input.homeAddressPostalCode ?? null,
      homeAddressCountry: input.homeAddressCountry ?? "CA",
    },
  });

  await writeAuditLog({
    userId,
    entity: "user_profile",
    entityId: userId,
    action: "update_home_address",
    newValue: {
      city: updated.homeAddressCity,
      province: updated.homeAddressProvince,
      country: updated.homeAddressCountry,
      hasPlaceId: Boolean(updated.homeAddressPlaceId),
    },
    ipAddress,
  });

  const dto = toHomeDto(updated);
  if (!dto) {
    throw new AppError("USR_002", "Adresse de domicile invalide", 400);
  }
  return dto;
}

export async function clearHomeAddress(
  userId: string,
  ipAddress?: string | null,
): Promise<void> {
  await ensureProfileRow(userId);
  await prisma.userProfile.update({
    where: { userId },
    data: {
      homeAddressLabel: null,
      homeAddressPlaceId: null,
      homeAddressLatitude: null,
      homeAddressLongitude: null,
      homeAddressCity: null,
      homeAddressProvince: null,
      homeAddressPostalCode: null,
      homeAddressCountry: null,
    },
  });

  await writeAuditLog({
    userId,
    entity: "user_profile",
    entityId: userId,
    action: "clear_home_address",
    ipAddress,
  });
}
