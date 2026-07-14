import { CredentialsSignin } from "next-auth";

/** Propagé depuis authorize → loginAction / API login (AUTH_004). */
export class EmailUnverifiedError extends CredentialsSignin {
  code = "AUTH_004";
}
