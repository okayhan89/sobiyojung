-- Change the seeded default stores for NEW households to 당근/식료품/네이버.
-- Also sync ALL existing households to this exact set of 3 stores.
-- WARNING: Removes non-default stores (아웃렛/시장/오아시스/마켓컬리/쿠팡 등) and
-- their items from every household via ON DELETE CASCADE. Idempotent.

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
    (v_new_id, '당근', 'danggeun', '🥕', '#FF7A00', 0),
    (v_new_id, '식료품', 'food', '🥬', '#F5A524', 1),
    (v_new_id, '네이버', 'naver', '🟢', '#03C75A', 2);

  return v_new_id;
end;
$BODY$;

-- Backfill: for every existing household, ensure the 3 defaults exist
-- (reusing matching slug preserves that store's items), then drop everything else.
do $$
declare
  h record;
begin
  for h in select id from sobiyojung.households loop
    insert into sobiyojung.stores (household_id, name, slug, icon, color, sort_order, is_archived)
    values
      (h.id, '당근', 'danggeun', '🥕', '#FF7A00', 0, false),
      (h.id, '식료품', 'food',     '🥬', '#F5A524', 1, false),
      (h.id, '네이버', 'naver',    '🟢', '#03C75A', 2, false)
    on conflict (household_id, slug) do update
      set name        = excluded.name,
          icon        = excluded.icon,
          color       = excluded.color,
          sort_order  = excluded.sort_order,
          is_archived = false;

    delete from sobiyojung.stores
    where household_id = h.id
      and slug not in ('danggeun', 'food', 'naver');
  end loop;
end $$;

notify pgrst, 'reload schema';
