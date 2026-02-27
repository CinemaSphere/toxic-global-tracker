import fs from "fs";
import path from "path";
import { cookies } from "next/headers";


export async function POST(req) {
  try {
    const body = await req.json();

    const cookieStore = await cookies();
        const isAdmin = cookieStore.get("admin_auth");

        if (!isAdmin || isAdmin.value !== "true") {
        return Response.json({ success: false }, { status: 401 });
        }

    const filePath = path.join(process.cwd(), "public", "bookingData.json");

    let existing = [];

    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath);
      existing = JSON.parse(raw);
    }

    const alreadyExists = existing.some(
      c => c.city === body.city && c.country === body.country
    );

    if (!alreadyExists) {
      existing.push(body);
    }

    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
}