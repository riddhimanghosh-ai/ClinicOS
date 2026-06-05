import { redirect } from "next/navigation";

// Always show login first — the login page handles redirecting
// already-signed-in users straight to the dashboard.
export default function CustomerRoot() {
  redirect("/customer/login");
}
