import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const body = await req.json();

    // 🔐 Check admin cookie
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get("admin_auth");

    if (!isAdmin || isAdmin.value !== "true") {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const { city, country, lat, lng } = body;

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const filePath = "public/bookingData.json";

    // 1️⃣ Fetch current file from GitHub
    const fileRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!fileRes.ok) {
      return NextResponse.json({ success: false, error: "GitHub fetch failed" }, { status: 500 });
    }

    const fileData = await fileRes.json();

    const content = Buffer.from(fileData.content, "base64").toString("utf8");
    const existing = JSON.parse(content);

    // Prevent duplicates
    const alreadyExists = existing.some(
      (c) => c.city === city && c.country === country
    );

    if (!alreadyExists) {
      existing.push({ city, country, lat, lng });
    }

    const updatedContent = Buffer.from(
      JSON.stringify(existing, null, 2)
    ).toString("base64");

    // 2️⃣ Update GitHub file
    const updateRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Add city ${city}`,
          content: updatedContent,
          sha: fileData.sha,
        }),
      }
    );

    if (!updateRes.ok) {
      return NextResponse.json({ success: false, error: "GitHub update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}