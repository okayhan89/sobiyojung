"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface AddStoreInput {
  householdId: string;
  name: string;
  icon: string;
  color: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const random = Math.random().toString(36).slice(2, 6);
  const safe = base || "store";
  return `${safe}-${random}`;
}

export async function addStoreAction(
  input: AddStoreInput,
): Promise<ActionResult> {
  if (!input.name.trim()) {
    return { success: false, error: "이름을 적어주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { data: maxRow } = await supabase
    .from("stores")
    .select("sort_order")
    .eq("household_id", input.householdId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort = (maxRow?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("stores").insert({
    household_id: input.householdId,
    name: input.name,
    slug: slugify(input.name),
    icon: input.icon,
    color: input.color,
    sort_order: nextSort,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
