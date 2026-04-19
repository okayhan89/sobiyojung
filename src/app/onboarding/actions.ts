"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createHouseholdAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { error } = await supabase.rpc("create_my_household");

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}

export async function joinHouseholdAction(
  code: string,
): Promise<ActionResult> {
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode.length < 4) {
    return { success: false, error: "코드를 다시 확인해 주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { error } = await supabase.rpc("join_household_by_code", {
    p_code: cleanCode,
  });

  if (error) {
    if (error.message.includes("household not found")) {
      return { success: false, error: "코드에 맞는 공간이 없어요." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}
