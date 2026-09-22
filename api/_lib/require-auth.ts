import { adminAuth } from "./firebase-admin";

export async function requireAuth(
  request: Request,
) {
  const authorization =
    request.headers.get("authorization");

  if (!authorization) {
    throw new Error("Missing Authorization header");
  }

  if (!authorization.startsWith("Bearer ")) {
    throw new Error("Invalid Authorization header");
  }

  const idToken =
    authorization.slice("Bearer ".length).trim();

  if (!idToken) {
    throw new Error("Missing Firebase ID token");
  }

  const decodedToken =
    await adminAuth.verifyIdToken(idToken);

  return decodedToken;
}