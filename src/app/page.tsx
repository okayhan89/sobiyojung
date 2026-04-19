import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/household";
import type { Store, StoreWithCounts } from "@/lib/types";
import { AddStoreButton } from "./_components/add-store-button";
import { InviteBadge } from "./_components/invite-badge";
import { SignOutButton } from "./_components/signout-button";
import { StoreTilePending } from "./_components/store-tile-pending";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, household } = await requireHousehold();
  const supabase = await createClient();

  const [storesRes, itemsRes] = await Promise.all([
    supabase
      .from("stores")
      .select("*")
      .eq("household_id", household.id)
      .eq("is_archived", false)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("items")
      .select("store_id, checked")
      .eq("checked", false),
  ]);

  const stores = (storesRes.data ?? []) as Store[];
  const openItems = itemsRes.data ?? [];

  const openCountByStore = new Map<string, number>();
  for (const row of openItems) {
    openCountByStore.set(
      row.store_id,
      (openCountByStore.get(row.store_id) ?? 0) + 1,
    );
  }

  const storesWithCounts: StoreWithCounts[] = stores.map((s) => ({
    ...s,
    open_count: openCountByStore.get(s.id) ?? 0,
    total_count: 0,
  }));

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "소비요정";

  return (
    <div className="safe-top safe-bottom mx-auto flex w-full max-w-lg flex-1 flex-col px-5">
      <header className="flex items-start justify-between pt-6">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-[#a8949c] uppercase">
            Shopping Wish
          </p>
          <h1 className="mt-1 text-[22px] font-bold leading-tight text-[#2a1a24]">
            안녕, {displayName} <span aria-hidden>✨</span>
          </h1>
          <p className="mt-1 text-sm text-[#6a5560]">
            이번 주엔 뭘 사볼까?
          </p>
        </div>
        <SignOutButton />
      </header>

      <div className="mt-5">
        <InviteBadge code={household.invite_code} />
      </div>

      <section className="mt-7 flex-1 pb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#2a1a24]">
            어디서 살까?
          </h2>
          <AddStoreButton householdId={household.id} />
        </div>

        {storesWithCounts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#f0dde4] bg-white/60 p-6 text-center text-sm text-[#a8949c]">
            아직 스토어가 없어요. 새로 추가해 볼까요?
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {storesWithCounts.map((store) => (
              <StoreTile key={store.id} store={store} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StoreTile({ store }: { store: StoreWithCounts }) {
  const color = store.color ?? "#e85a9a";
  return (
    <li>
      <Link
        href={`/s/${store.slug}`}
        className="group relative flex aspect-[5/6] flex-col justify-between overflow-hidden rounded-[22px] border border-[#f0dde4] bg-white p-4 shadow-[var(--shadow-card)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] active:scale-[0.97] active:shadow-none"
      >
        <StoreTilePending />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-60 blur-2xl transition group-hover:opacity-90"
          style={{ background: `${color}33` }}
        />

        <div className="relative flex items-start justify-between">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl shadow-sm"
            style={{ background: `${color}1f` }}
          >
            {store.icon ?? "🛒"}
          </div>
          {store.open_count > 0 ? (
            <span
              className="rounded-full px-2 py-[3px] text-[11px] font-semibold text-white"
              style={{ background: color }}
            >
              {store.open_count}
            </span>
          ) : null}
        </div>

        <div className="relative mt-auto">
          <p className="text-[15px] font-bold text-[#2a1a24]">
            {store.name}
          </p>
          <p className="mt-0.5 text-[11.5px] text-[#a8949c]">
            {store.open_count > 0
              ? `${store.open_count}개 고민중`
              : "비어있어요"}
          </p>
        </div>
      </Link>
    </li>
  );
}
