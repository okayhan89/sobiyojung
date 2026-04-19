import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/household";
import type { Item, Store } from "@/lib/types";
import { ItemList } from "./item-list";
import { StoreMenu } from "./store-menu";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: slug,
  };
}

export const dynamic = "force-dynamic";

export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;
  const { household } = await requireHousehold();

  const supabase = await createClient();

  const { data: storeData } = await supabase
    .from("stores")
    .select("*")
    .eq("household_id", household.id)
    .eq("slug", slug)
    .maybeSingle();

  if (!storeData) {
    notFound();
  }

  const store = storeData as Store;

  const { data: itemsData } = await supabase
    .from("items")
    .select("*")
    .eq("store_id", store.id)
    .order("checked", { ascending: true })
    .order("created_at", { ascending: false });

  const initialItems = (itemsData ?? []) as Item[];
  const accent = store.color ?? "#e85a9a";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header
        className="safe-top relative overflow-hidden px-5 pt-6 pb-8"
        style={{
          background: `linear-gradient(180deg, ${accent}1f 0%, transparent 100%)`,
        }}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/60 px-3 py-1.5 text-xs font-medium text-[#2a1a24] backdrop-blur transition hover:bg-white"
          >
            <ArrowLeft size={13} />
            전체
          </Link>
          <StoreMenu
            storeId={store.id}
            storeName={store.name}
            itemCount={initialItems.length}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-sm"
            style={{ background: `${accent}33` }}
          >
            {store.icon ?? "🛒"}
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-[#a8949c] uppercase">
              Shopping at
            </p>
            <h1 className="text-2xl font-bold leading-tight text-[#2a1a24]">
              {store.name}
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5">
        <ItemList
          storeId={store.id}
          accent={accent}
          initialItems={initialItems}
        />
      </main>
    </div>
  );
}
