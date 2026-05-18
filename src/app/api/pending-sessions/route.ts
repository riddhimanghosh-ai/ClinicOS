import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { todayISO } from "@/lib/utils";

export type PendingSessionRow = {
  branch_name: string;
  patient_id: number;
  patient_name: string;
  package_id: number;
  service_id: number;
  service_name: string;
  service_category: string;
  sessions_total: number;
  sessions_used: number;
  pending: number;
  expiry_date: string | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") ?? "";
  const branch_id = searchParams.get("branch_id") ?? "";
  const today = todayISO();

  let sql = `
    SELECT b.name AS branch_name,
           p.id AS patient_id, p.name AS patient_name,
           pk.id AS package_id,
           sc.id AS service_id, sc.name AS service_name, sc.category AS service_category,
           pk.sessions_total, pk.sessions_used,
           (pk.sessions_total - pk.sessions_used) AS pending,
           pk.expiry_date
    FROM packages_purchased pk
    JOIN patients p ON p.id = pk.patient_id
    JOIN branches b ON b.id = p.home_branch_id
    JOIN services_catalog sc ON sc.id = pk.service_id
    WHERE pk.sessions_used < pk.sessions_total
      AND (pk.expiry_date IS NULL OR pk.expiry_date >= ?)
  `;
  const params: any[] = [today];

  if (category) {
    sql += " AND sc.category = ?";
    params.push(category);
  }
  if (branch_id) {
    sql += " AND p.home_branch_id = ?";
    params.push(Number(branch_id));
  }

  sql += " ORDER BY pending DESC, b.name, p.name";

  const rows = db().prepare(sql).all(...params) as PendingSessionRow[];
  const total_pending = rows.reduce((acc, r) => acc + r.pending, 0);

  return NextResponse.json({ rows, total_pending });
}
