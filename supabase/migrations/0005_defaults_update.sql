-- Reduce the seeded default stores for NEW households to 3: 쿠팡, 식료품, 네이버.
-- Existing households keep whatever they have (safe to run on existing data).

create or replace function sobiyojung.create_my_household()
returns uuid
language plpgsql
security definer
set search_path = sobiyojung, public
as $BODY$
declare
  v_uid uuid;
  v_new_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  v_new_id := gen_random_uuid();

  insert into sobiyojung.households (id) values (v_new_id);

  insert into sobiyojung.household_members (household_id, user_id)
  values (v_new_id, v_uid);

  insert into sobiyojung.stores (household_id, name, slug, icon, color, sort_order)
  values
    (v_new_id, '쿠팡', 'coupang', '📦', '#F53D5B', 0),
    (v_new_id, '식료품', 'food', '🥬', '#F5A524', 1),
    (v_new_id, '네이버', 'naver', '🟢', '#03C75A', 2);

  return v_new_id;
end;
$BODY$;

notify pgrst, 'reload schema';
