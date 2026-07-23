"use server";

import { headers } from "next/headers";
import {
  submitContactMessage,
  type ContactActionResult,
} from "./submit-contact";

export async function submitContactAction(
  _prev: ContactActionResult | null,
  formData: FormData,
): Promise<ContactActionResult> {
  const h = await headers();
  return submitContactMessage(formData, h);
}
