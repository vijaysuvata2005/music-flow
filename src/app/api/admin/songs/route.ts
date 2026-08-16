import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
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
    const admin = await checkAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const songs = await prisma.song.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ songs });
  } catch (error) {
    console.error("GET SONGS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch songs" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const admin = await checkAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const title = String(
      body.title ?? ""
    ).trim();

    const artist = String(
      body.artist ?? ""
    ).trim();

    const category = String(
      body.category ?? ""
    ).trim();

    const coverImage = String(
      body.coverImage ?? ""
    ).trim();

    const audioUrl = String(
      body.audioUrl ?? ""
    ).trim();

    const duration =
      body.duration === null ||
      body.duration === ""
        ? null
        : Number(body.duration);

    if (
      !title ||
      !artist ||
      !category ||
      !coverImage ||
      !audioUrl
    ) {
      return NextResponse.json(
        {
          error:
            "All required fields are missing.",
        },
        { status: 400 }
      );
    }

    const song = await prisma.song.create({
      data: {
        title,
        artist,
        category,
        coverImage,
        audioUrl,
        duration:
          duration !== null &&
          Number.isFinite(duration)
            ? duration
            : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        song,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE SONG ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to create song.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const admin = await checkAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = String(
      body.id ?? ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        { error: "Song ID is required." },
        { status: 400 }
      );
    }

    const title = String(
      body.title ?? ""
    ).trim();

    const artist = String(
      body.artist ?? ""
    ).trim();

    const category = String(
      body.category ?? ""
    ).trim();

    const coverImage = String(
      body.coverImage ?? ""
    ).trim();

    const audioUrl = String(
      body.audioUrl ?? ""
    ).trim();

    const duration =
      body.duration === null ||
      body.duration === ""
        ? null
        : Number(body.duration);

    if (
      !title ||
      !artist ||
      !category ||
      !coverImage ||
      !audioUrl
    ) {
      return NextResponse.json(
        {
          error:
            "All required fields are missing.",
        },
        { status: 400 }
      );
    }

    const song = await prisma.song.update({
      where: {
        id,
      },
      data: {
        title,
        artist,
        category,
        coverImage,
        audioUrl,
        duration:
          duration !== null &&
          Number.isFinite(duration)
            ? duration
            : null,
      },
    });

    return NextResponse.json({
      success: true,
      song,
    });
  } catch (error) {
    console.error(
      "UPDATE SONG ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to update song.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const admin = await checkAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = String(
      body.id ?? ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        { error: "Song ID is required." },
        { status: 400 }
      );
    }

    await prisma.song.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE SONG ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to delete song.",
      },
      { status: 500 }
    );
  }
}