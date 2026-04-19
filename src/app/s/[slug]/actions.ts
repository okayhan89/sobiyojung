"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/lib/types";

interface ActionResult {
  success: boolean;
  error?: string;
}

interface AddItemResult extends ActionResult {
  item?: Item;
}

const MAX_TEXT_LENGTH = 200;

export async function addItemAction(input: {
  storeId: string;
  text: string;
}): Promise<AddItemResult> {
  const text = input.text.trim();
  if (!text) {
    return { success: false, error: "내용을 적어주세요." };
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return { success: false, error: "너무 길어요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { data, error } = await supabase
    .from("items")
    .insert({
      store_id: input.storeId,
      text,
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "추가 실패" };
  }

  revalidatePath("/");
  return { success: true, item: data as Item };
}

export async function toggleItemAction(input: {
  itemId: string;
  checked: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { error } = await supabase
    .from("items")
    .update({
      checked: input.checked,
      checked_at: input.checked ? new Date().toISOString() : null,
    })
    .eq("id", input.itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteStoreAction(input: {
  storeId: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { error } = await supabase
    .from("stores")
    .delete()
    .eq("id", input.storeId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteItemAction(input: {
  itemId: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요해요." };
  }

  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", input.itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
