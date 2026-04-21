import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Store } from "@/lib/types";
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
  const supabase = await createClient();

  // One round-trip only. We rely on:
  //   - proxy.ts already validated the session (redirects unauth'd to /login)
  //   - RLS on `stores` filters to rows in households the caller is a member of
  // So calling auth.getUser() and querying household_members here is redundant.
  // Items + suggestions are loaded client-side from localStorage cache.
  const { data: storeData, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  // Auth cookie was valid at proxy time but got rejected by Postgres (e.g. it
  // expired mid-flight or the user lost access). Bounce to login so the next
  // visit re-auths instead of looping on a dead page.
  if (error?.code === "PGRST301" || error?.code === "42501") {
    redirect("/login");
  }

  if (!storeData) {
    notFound();
  }

  const store = storeData as Store;
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
            className="inline-flex h-10 items-center gap-1 rounded-full border border-white/50 bg-white/60 px-4 text-[13px] font-medium text-[#2a1a24] backdrop-blur transition hover:bg-white active:scale-95 active:bg-white"
          >
            <ArrowLeft size={14} />
            전체
          </Link>
          <StoreMenu
            storeId={store.id}
            storeName={store.name}
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
          initialItems={[]}
          initialSuggestions={[]}
        />
      </main>
    </div>
  );
}
