import { NextResponse } from "next/server";
import { createAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body.username ?? "");
    const password = String(body.password ?? "");

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        {
          error: "Admin credentials are not configured",
        },
        {
          status: 500,
        }
      );
    }

    if (
      username !== adminUsername ||
      password !== adminPassword
    ) {
      return NextResponse.json(
        {
          error: "Invalid username or password",
        },
        {
          status: 401,
        }
      );
    }

    const token = await createAdminSession(username);

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set({
      name: "music_flow_admin",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return NextResponse.json(
      {
        error: "Login failed",
      },
      {
        status: 500,
      }
    );
  }
}