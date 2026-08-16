import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findFirst();

    return NextResponse.json({
      settings: {
        siteName:
          settings?.siteName || "Music Flow",

        instagramUrl:
          settings?.instagramUrl || "",
      },
    });
  } catch (error) {
    console.error(
      "PUBLIC SETTINGS ERROR:",
      error
    );

    return NextResponse.json({
      settings: {
        siteName: "Music Flow",
        instagramUrl: "",
      },
    });
  }
}