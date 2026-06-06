import { getAllCatalog } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { CatalogClient } from "./catalog-client";

export const dynamic = "force-dynamic";

export default function CatalogPage() {
  const { products, services } = getAllCatalog();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Product & Service Catalog"
        subtitle="Search by name, item code, or filter by discounts and new launches."
      />
      <CatalogClient initialProducts={products} initialServices={services} />
    </div>
  );
}
