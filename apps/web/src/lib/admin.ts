import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/** For server actions and server components: throws unless the owner is signed in. Middleware already guards pages; this is the second lock. */
export async function requireAdmin(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const email = await verifySessionToken(token);
  if (!email) throw new Error("Not signed in.");
  return email;
}

export async function currentAdminEmail(): Promise<string | null> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}
