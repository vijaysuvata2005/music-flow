// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import { verifyAdminSession } from "@/lib/auth";
// import cloudinary from "@/lib/cloudinary";

// export const runtime = "nodejs";

// export async function POST(request: Request) {
//   try {
//     const cookieStore = await cookies();

//     const token =
//       cookieStore.get("music_flow_admin")?.value;

//     if (!token) {
//       return NextResponse.json(
//         {
//           error: "Unauthorized",
//         },
//         {
//           status: 401,
//         }
//       );
//     }

//     const session = await verifyAdminSession(token);

//     if (!session) {
//       return NextResponse.json(
//         {
//           error: "Unauthorized",
//         },
//         {
//           status: 401,
//         }
//       );
//     }

//     const formData = await request.formData();

//     const file = formData.get("file");

//     if (!(file instanceof File)) {
//       return NextResponse.json(
//         {
//           error: "No file provided",
//         },
//         {
//           status: 400,
//         }
//       );
//     }

//     const bytes = await file.arrayBuffer();

//     const buffer = Buffer.from(bytes);

//     const result = await new Promise<{
//       secure_url: string;
//     }>((resolve, reject) => {
//       const uploadStream =
//         cloudinary.uploader.upload_stream(
//           {
//             folder: "music-flow",
//             resource_type: "auto",
//           },
//           (error, result) => {
//             if (error) {
//               reject(error);
//               return;
//             }

//             if (!result) {
//               reject(
//                 new Error("Upload failed")
//               );
//               return;
//             }

//             resolve({
//               secure_url: result.secure_url,
//             });
//           }
//         );

//       uploadStream.end(buffer);
//     });

//     return NextResponse.json({
//       success: true,
//       url: result.secure_url,
//     });
//   } catch (error) {
//     console.error(
//       "CLOUDINARY UPLOAD ERROR:",
//       error
//     );

//     return NextResponse.json(
//       {
//         error: "Upload failed",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }