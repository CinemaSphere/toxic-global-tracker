import fs from "fs";
import path from "path";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const body = await req.json();

    // 🔒 Cookie-based admin check
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get("admin_auth");

    if (!isAdmin || isAdmin.value !== "true") {
      return Response.json({ success: false }, { status: 401 });
    }

    const filePath = path.join(process.cwd(), "public", "bookingData.json");

    if (!fs.existsSync(filePath)) {
      return Response.json({ success: false });
    }

    const raw = fs.readFileSync(filePath);
    const existing = JSON.parse(raw);

    const updated = existing.filter(
      c => !(c.city === body.city && c.country === body.country)
    );

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
}