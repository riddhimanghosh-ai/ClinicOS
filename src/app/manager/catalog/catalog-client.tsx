"use client";

import { useState } from "react";
import { Search, X, Tag, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { inr } from "@/lib/utils";
import type { Service, Product } from "@/lib/types";

type ViewFilter = "all" | "discount" | "new";

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function DetailDrawer({ item, type, onClose }: { item: Service | Product; type: "service" | "product"; onClose: () => void }) {
  const p = item as Product;
  const s = item as Service;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={type === "service" ? "accent" : "outline"} className="text-[10px]">
                {type === "service" ? "Service" : "Product"}
              </Badge>
              {item.item_code && (
                <span className="font-mono text-xs text-muted-foreground">{item.item_code}</span>
              )}
              {!!item.is_new_launch && (
                <Badge className="text-[10px] bg-emerald-500 text-white">New Launch</Badge>
              )}
              {(item.discount_pct ?? 0) > 0 && (
                <Badge className="text-[10px] bg-amber-500 text-white">{item.discount_pct}% off</Badge>
              )}
            </div>
            <h3 className="mt-2 text-base font-bold text-foreground">{item.name}</h3>
            <p className="text-xs text-muted-foreground">{item.category}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {item.description && (
          <p className="text-sm text-foreground leading-relaxed">{item.description}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Price</div>
            <div className="text-lg font-bold text-foreground mt-0.5">{inr(item.price_inr)}</div>
            {(item.discount_pct ?? 0) > 0 && (
              <div className="text-xs text-amber-600 font-medium">
                → {inr(Math.round(item.price_inr * (1 - (item.discount_pct ?? 0) / 100)))} after discount
              </div>
            )}
          </div>
          {type === "service" && (s as Service).periodic_days != null && (s as Service).periodic_days! > 0 && (
            <div className="rounded-lg bg-secondary/50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Cadence</div>
              <div className="text-lg font-bold text-foreground mt-0.5">Every {(s as Service).periodic_days}d</div>
            </div>
          )}
          {type === "product" && p.sku && (
            <div className="rounded-lg bg-secondary/50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">SKU</div>
              <div className="font-mono text-sm font-bold text-foreground mt-0.5">{p.sku}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type CatalogItem = (Service | Product) & { _type: "service" | "product" };

export function CatalogClient({ initialProducts, initialServices }: { initialProducts: Product[]; initialServices: Service[] }) {
  const [q, setQ] = useState("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const allItems: CatalogItem[] = [
    ...initialServices.map(s => ({ ...s, _type: "service" as const })),
    ...initialProducts.map(p => ({ ...p, _type: "product" as const })),
  ];

  const categories = Array.from(new Set(allItems.map(i => i.category))).sort();

  const filtered = allItems.filter(item => {
    if (viewFilter === "discount" && !(item.discount_pct && item.discount_pct > 0)) return false;
    if (viewFilter === "new" && !item.is_new_launch) return false;
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (q.trim()) {
      const qLower = q.toLowerCase();
      return (
        item.name.toLowerCase().includes(qLower) ||
        (item.item_code ?? "").toLowerCase().includes(qLower) ||
        item.category.toLowerCase().includes(qLower) ||
        (item.description ?? "").toLowerCase().includes(qLower) ||
        ("sku" in item ? (item as Product).sku.toLowerCase().includes(qLower) : false)
      );
    }
    return true;
  });

  const discountCount = allItems.filter(i => i.discount_pct && i.discount_pct > 0).length;
  const newCount = allItems.filter(i => i.is_new_launch).length;

  // Group by category when no search
  const grouped = q.trim() || categoryFilter
    ? null
    : categories.reduce((acc, cat) => {
        const items = filtered.filter(i => i.category === cat);
        if (items.length) acc[cat] = items;
        return acc;
      }, {} as Record<string, CatalogItem[]>);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterPill active={viewFilter === "all"} onClick={() => setViewFilter("all")}>
          All ({allItems.length})
        </FilterPill>
        <FilterPill active={viewFilter === "discount"} onClick={() => setViewFilter("discount")}>
          <Tag className="h-3 w-3" />On Discount ({discountCount})
        </FilterPill>
        <FilterPill active={viewFilter === "new"} onClick={() => setViewFilter("new")}>
          <Sparkles className="h-3 w-3" />New Launches ({newCount})
        </FilterPill>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="h-7 rounded-full border border-border bg-secondary text-xs font-medium px-3 text-muted-foreground focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Name, item code, SKU, description…" className="pl-9 h-8 text-sm" />
        </div>
      </div>

      {/* Search results — flat list */}
      {(q.trim() || categoryFilter) && (
        <Card>
          <CardHeader>
            <CardTitle>Results ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matches.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(item => (
                  <CatalogCard key={`${item._type}-${item.id}`} item={item} onClick={() => setSelected(item)} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category-grouped browse when no search */}
      {!q.trim() && !categoryFilter && grouped && Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat}>
          <CardHeader className="py-3 px-5">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
            >
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">{cat}</CardTitle>
                <span className="text-xs text-muted-foreground">({items.length})</span>
                {items.some(i => i.is_new_launch) && <Badge className="text-[9px] bg-emerald-500 text-white py-0">New</Badge>}
                {items.some(i => (i.discount_pct ?? 0) > 0) && <Badge className="text-[9px] bg-amber-500 text-white py-0">Sale</Badge>}
              </div>
              {expandedCategory === cat ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
          </CardHeader>
          {expandedCategory === cat && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(item => (
                  <CatalogCard key={`${item._type}-${item.id}`} item={item} onClick={() => setSelected(item)} />
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Detail drawer */}
      {selected && (
        <DetailDrawer item={selected} type={selected._type} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function CatalogCard({ item, onClick }: { item: CatalogItem; onClick: () => void }) {
  const hasDiscount = (item.discount_pct ?? 0) > 0;
  const discountedPrice = hasDiscount
    ? Math.round(item.price_inr * (1 - (item.discount_pct ?? 0) / 100))
    : null;

  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all p-4 space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          <Badge variant={item._type === "service" ? "accent" : "outline"} className="text-[9px]">
            {item._type === "service" ? "Service" : "Product"}
          </Badge>
          {!!item.is_new_launch && <Badge className="text-[9px] bg-emerald-500 text-white">New</Badge>}
          {hasDiscount && <Badge className="text-[9px] bg-amber-500 text-white">{item.discount_pct}% off</Badge>}
        </div>
        {item.item_code && <span className="font-mono text-[9px] text-muted-foreground shrink-0">{item.item_code}</span>}
      </div>
      <div className="text-sm font-semibold text-foreground leading-tight">{item.name}</div>
      {item.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
      )}
      <div className="flex items-center gap-2 pt-1">
        {hasDiscount ? (
          <>
            <span className="text-xs line-through text-muted-foreground">{inr(item.price_inr)}</span>
            <span className="text-sm font-bold text-amber-600">{inr(discountedPrice!)}</span>
          </>
        ) : (
          <span className="text-sm font-bold text-foreground">{inr(item.price_inr)}</span>
        )}
      </div>
    </button>
  );
}
