import { cookies } from "next/headers";

export async function POST(req) {
  const body = await req.json();

  if (body.password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ success: false }, { status: 401 });
  }

  const cookieStore = await cookies();   // ✅ IMPORTANT FIX

  cookieStore.set("admin_auth", "true", {
    httpOnly: true,
    secure: false, // change to true when deployed
    sameSite: "strict",
    path: "/"
  });

  return Response.json({ success: true });
}