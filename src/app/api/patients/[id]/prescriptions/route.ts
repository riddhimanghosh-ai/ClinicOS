import { NextRequest, NextResponse } from "next/server";
import { db, ROOT } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const patientId = Number(params.id);
  if (!patientId) return NextResponse.json({ error: "Invalid patient id" }, { status: 400 });

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    // Image / scan upload
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const regimenNotes = (formData.get("regimen_notes") as string) ?? null;
    const doctorId = formData.get("doctor_id") ? Number(formData.get("doctor_id")) : null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `p${patientId}_${Date.now()}.${ext}`;
    const dir = path.join(ROOT, "public", "prescriptions");
    fs.mkdirSync(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(dir, filename), buffer);

    const result = db()
      .prepare(
        `INSERT INTO prescriptions (patient_id, doctor_id, items_json, regimen_notes, image_path, source_type)
         VALUES (?, ?, ?, ?, ?, 'image') RETURNING *`
      )
      .get(patientId, doctorId, "[]", regimenNotes, `prescriptions/${filename}`) as any;

    return NextResponse.json({ prescription: result });
  }

  // JSON body — text or voice
  const body = await req.json();
  const {
    items = [],
    regimen_notes = null,
    doctor_id = null,
    session_id = null,
    source_type = "text",
  } = body;

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items must be an array" }, { status: 400 });
  }

  const result = db()
    .prepare(
      `INSERT INTO prescriptions (patient_id, session_id, doctor_id, items_json, regimen_notes, source_type)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`
    )
    .get(patientId, session_id, doctor_id, JSON.stringify(items), regimen_notes, source_type) as any;

  return NextResponse.json({ prescription: { ...result, items } });
}
