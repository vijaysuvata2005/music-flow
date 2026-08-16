import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const songs = await prisma.song.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        artist: true,
        category: true,
        coverImage: true,
        audioUrl: true,
        duration: true,
      },
    });

    return NextResponse.json({
      songs,
    });
  } catch (error) {
    console.error(
      "PUBLIC SONGS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load songs.",
      },
      {
        status: 500,
      }
    );
  }
}