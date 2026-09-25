import {
  adminAuth,
} from "./firebase-admin.mjs";

export async function requireAuth(
  request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (!authorization) {
    throw new Error(
      "Missing Authorization header",
    );
  }

  if (
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    throw new Error(
      "Invalid Authorization header",
    );
  }

  const idToken =
    authorization
      .slice("Bearer ".length)
      .trim();

  if (!idToken) {
    throw new Error(
      "Missing Firebase ID token",
    );
  }

  return adminAuth.verifyIdToken(
    idToken,
  );
}