import { SignJWT, jwtVerify } from "jose";

const secret = process.env.ADMIN_SESSION_SECRET;

if (!secret) {
  throw new Error("ADMIN_SESSION_SECRET is missing");
}

const secretKey = new TextEncoder().encode(secret);

export async function createAdminSession(username: string) {
  return await new SignJWT({
    username,
    role: "admin",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifyAdminSession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (payload.role !== "admin") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}