import { getAllCatalog } from "@/lib/db";
import { ManagerPageHeader as PageHeader } from "@/components/manager-page-header";
import { CatalogClient } from "./catalog-client";

export const dynamic = "force-dynamic";

export default function CatalogPage() {
  const { products, services } = getAllCatalog();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue"
        subtitle="Browse products & services — search by name, SKU, or category. Tap any item to see alternatives."
      />
      <CatalogClient initialProducts={products} initialServices={services} />
    </div>
  );
}
