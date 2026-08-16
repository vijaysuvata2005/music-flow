import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth";

async function getAdminSession() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("music_flow_admin")?.value;

  if (!token) {
    return null;
  }

  return await verifyAdminSession(token);
}

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    let settings =
      await prisma.siteSettings.findFirst();

    if (!settings) {
      settings =
        await prisma.siteSettings.create({
          data: {
            siteName: "Music Flow",
            instagramUrl: null,
          },
        });
    }

    return NextResponse.json({
      settings,
    });
  } catch (error) {
    console.error(
      "GET SETTINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load settings.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const siteName =
      typeof body.siteName === "string"
        ? body.siteName.trim() ||
          "Music Flow"
        : "Music Flow";

    const instagramUrl =
      typeof body.instagramUrl === "string"
        ? body.instagramUrl.trim()
        : "";

    let settings =
      await prisma.siteSettings.findFirst();

    if (!settings) {
      settings =
        await prisma.siteSettings.create({
          data: {
            siteName,
            instagramUrl:
              instagramUrl || null,
          },
        });
    } else {
      settings =
        await prisma.siteSettings.update({
          where: {
            id: settings.id,
          },
          data: {
            siteName,
            instagramUrl:
              instagramUrl || null,
          },
        });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "UPDATE SETTINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to update settings.",
      },
      {
        status: 500,
      }
    );
  }
}