export type Branch = { id: number; name: string; city: string };

export type Doctor = {
  id: number;
  name: string;
  specialty: string;
  home_branch_id: number;
};

export type Patient = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  gender: string | null;
  dob: string | null;
  city: string | null;
  state: string | null;
  marital_status: string | null;
  guest_code: string | null;
  home_branch_id: number | null;
  premium_tier: string;
  created_at: string;
};

export type Service = {
  id: number;
  name: string;
  category: string;
  price_inr: number;
  periodic_days: number | null;
  description: string | null;
  item_code: string | null;
  is_new_launch: number | null;
  discount_pct: number | null;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  category: string;
  price_inr: number;
  description: string | null;
  item_code: string | null;
  is_new_launch: number | null;
  discount_pct: number | null;
};

export type Package = {
  id: number;
  patient_id: number;
  service_id: number;
  sessions_total: number;
  sessions_used: number;
  collection_paid_inr: number;
  purchase_date: string;
  expiry_date: string | null;
};

export type Session = {
  id: number;
  package_id: number | null;
  patient_id: number;
  branch_id: number;
  doctor_id: number;
  session_date: string;
  units_used: number | null;
  service_name_snapshot: string | null;
};

export type DoctorTags = {
  id: number;
  patient_id: number;
  session_id: number | null;
  primary_concern: string | null;
  barrier_status: string | null;
  next_recommended_service: string | null;
  product_adherence_score: number | null;
  active_acne_status: string | null;
  scar_treatment_candidate: number;
  treatment_ready_for: string | null;
  free_tags_json: string | null;
  created_at: string;
};

export type SkinPhoto = {
  id: number;
  patient_id: number;
  visit_date: string;
  region: string;
  image_path: string;
  uploaded_by_branch_id: number | null;
};

export type Prescription = {
  id: number;
  patient_id: number;
  session_id: number | null;
  doctor_id: number | null;
  items_json: string;
  regimen_notes: string | null;
  image_path: string | null;
  source_type: "text" | "voice" | "image";
  created_at: string;
};

export type RawNote = {
  id: number;
  patient_id: number;
  session_id: number | null;
  doctor_id: number | null;
  raw_text: string;
  created_at: string;
};

export type WhatsAppMessage = {
  id: number;
  patient_id: number;
  cohort_name: string;
  message_body: string;
  discount_code: string | null;
  status: "queued" | "sent" | "cancelled";
  generated_at: string;
  sent_at: string | null;
};

export type CheckIn = {
  id: number;
  patient_id: number;
  branch_id: number;
  doctor_id: number | null;
  check_in_ts: string;
  status: "waiting" | "in_consult" | "done";
};

export type CohortRow = {
  patient_id: number;
  patient_name: string;
  phone: string;
  branch_name: string;
  reason: string;
  suggested_discount_pct: number;
  context: Record<string, any>;
};

export type FinancialSummary = {
  package_collection_inr: number;
  package_net_revenue_inr: number;
  package_unearned_balance_inr: number;
  product_collection_inr: number;
  total_collection_inr: number;
  total_net_revenue_inr: number;
};

export type ExtractedTags = {
  primary_concern: string | null;
  barrier_status: string | null;
  next_recommended_service: string | null;
  product_adherence_score: number | null;
  active_acne_status: string | null;
  scar_treatment_candidate: number;
  treatment_ready_for: string | null;
  free_tags: Record<string, any>;
};

export type PatientPortfolio = {
  patient: Patient & { home_branch_name?: string; home_branch_city?: string };
  sessions: (Session & { branch_name: string; branch_city: string; doctor_name: string })[];
  packages: (Package & { service_name: string; service_category: string; service_periodic_days: number | null })[];
  product_purchases: (Product & { qty: number; price_paid_inr: number; purchase_date: string })[];
  tags: DoctorTags[];
  notes: RawNote[];
  photos: SkinPhoto[];
  prescriptions: (Prescription & { items: Array<{ name: string; instructions: string; duration_days: number }>; doctor_name: string | null })[];
};
