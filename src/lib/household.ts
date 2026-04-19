import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Household } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getHouseholdForUser(
  userId: string,
): Promise<Household | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("household_members")
    .select("household_id, households(*)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const raw = data as unknown as {
    households: Household | Household[] | null;
  };
  const hh = Array.isArray(raw.households) ? raw.households[0] : raw.households;
  return hh ?? null;
}

export async function requireHousehold(): Promise<{
  user: Awaited<ReturnType<typeof requireUser>>;
  household: Household;
}> {
  const user = await requireUser();
  const household = await getHouseholdForUser(user.id);

  if (!household) {
    redirect("/onboarding");
  }

  return { user, household };
}
