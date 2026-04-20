import { createClient } from "@/lib/supabase/server";
import { requireHousehold } from "@/lib/household";
import type { Item, Store } from "@/lib/types";
import { AddStoreButton } from "./_components/add-store-button";
import { DashboardStores } from "./_components/dashboard-stores";
import { InviteBadge } from "./_components/invite-badge";
import { SignOutButton } from "./_components/signout-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, household } = await requireHousehold();
  const supabase = await createClient();

  const [storesRes, itemsRes, suggestionsRes] = await Promise.all([
    supabase
      .from("stores")
      .select("*")
      .eq("household_id", household.id)
      .eq("is_archived", false)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.rpc("item_suggestions", { p_limit: 500 }),
  ]);

  const stores = (storesRes.data ?? []) as Store[];
  const initialItems = (itemsRes.data ?? []) as Item[];
  const suggestions = ((suggestionsRes.data ?? []) as string[])
    .map((s) => (s ?? "").trim())
    .filter(Boolean);

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
          <p className="mt-1 text-sm text-[#6a5560]">이번 주엔 뭘 사볼까?</p>
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

        <DashboardStores
          stores={stores}
          initialItems={initialItems}
          householdId={household.id}
          suggestions={suggestions}
        />
      </section>
    </div>
  );
}
