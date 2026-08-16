import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    console.log("================================");
    console.log("MUSIC FLOW UPLOAD API");
    console.log("================================");

    const cookieStore = await cookies();

    const token =
      cookieStore.get("music_flow_admin")?.value;

    if (!token) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const session =
      await verifyAdminSession(token);

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

    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "No file was selected.",
        },
        {
          status: 400,
        }
      );
    }

    console.log("FILE NAME:", file.name);
    console.log("FILE TYPE:", file.type);
    console.log("FILE SIZE:", file.size);

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "Selected file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    const resourceType =
      file.type.startsWith("image/")
        ? "image"
        : "video";

    console.log(
      "CLOUDINARY RESOURCE TYPE:",
      resourceType
    );

    const result = await new Promise<{
      secure_url: string;
    }>((resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder: "music-flow",
            resource_type: resourceType,
          },
          (error, result) => {
            if (error) {
              console.error(
                "CLOUDINARY ERROR:",
                error
              );

              reject(error);
              return;
            }

            if (!result) {
              reject(
                new Error(
                  "Cloudinary returned no result."
                )
              );

              return;
            }

            resolve({
              secure_url: result.secure_url,
            });
          }
        );

      uploadStream.end(buffer);
    });

    console.log(
      "UPLOAD SUCCESS:",
      result.secure_url
    );

    return NextResponse.json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error(
      "================================"
    );

    console.error(
      "MUSIC FLOW UPLOAD ERROR:",
      error
    );

    console.error(
      "================================"
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Upload failed.",
      },
      {
        status: 500,
      }
    );
  }
}