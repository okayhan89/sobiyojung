export interface Household {
  id: string;
  invite_code: string;
  created_at: string;
}

export interface HouseholdMember {
  household_id: string;
  user_id: string;
  joined_at: string;
}

export interface Store {
  id: string;
  household_id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  store_id: string;
  text: string;
  checked: boolean;
  created_by: string | null;
  created_at: string;
  checked_at: string | null;
}

export interface StoreWithCounts extends Store {
  open_count: number;
  total_count: number;
}
