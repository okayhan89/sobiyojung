-- RPC helpers for onboarding. Run after 0001_init.sql.
-- SECURITY DEFINER so they can atomically create a household + first member
-- + default stores without tripping the chicken-and-egg RLS on households.

drop function if exists sobiyojung.whoami();
drop function if exists sobiyojung.create_my_household();
drop function if exists sobiyojung.join_household_by_code(text);

------------------------------------------------------------
-- whoami — diagnostic
------------------------------------------------------------

create function sobiyojung.whoami()
returns jsonb
language sql
security definer
set search_path = sobiyojung, public
stable
as $$
  select jsonb_build_object(
    'uid', auth.uid(),
    'role', auth.role(),
    'jwt', nullif(current_setting('request.jwt.claims', true), '')::jsonb
  );
$$;

grant execute on function sobiyojung.whoami() to anon, authenticated;

------------------------------------------------------------
-- create_my_household
------------------------------------------------------------

create function sobiyojung.create_my_household()
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
    (v_new_id, '아웃렛', 'outlet', '🛍️', '#E5484D', 1),
    (v_new_id, '시장', 'market', '🍎', '#46A758', 2),
    (v_new_id, '오아시스', 'oasis', '🥬', '#30A46C', 3),
    (v_new_id, '마켓컬리', 'kurly', '💜', '#8E4EC6', 4),
    (v_new_id, '네이버', 'naver', '🟢', '#03C75A', 5),
    (v_new_id, '쿠팡', 'coupang', '📦', '#F53D5B', 6);

  return v_new_id;
end;
$BODY$;

grant execute on function sobiyojung.create_my_household() to authenticated;

------------------------------------------------------------
-- join_household_by_code
------------------------------------------------------------

create function sobiyojung.join_household_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = sobiyojung, public
as $BODY$
declare
  v_uid uuid;
  v_code text;
  v_household_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  v_code := upper(trim(p_code));
  if length(v_code) < 4 then
    raise exception 'invalid code' using errcode = '22023';
  end if;

  v_household_id := (
    select id from sobiyojung.households where invite_code = v_code limit 1
  );

  if v_household_id is null then
    raise exception 'household not found' using errcode = 'P0002';
  end if;

  insert into sobiyojung.household_members (household_id, user_id)
  values (v_household_id, v_uid)
  on conflict do nothing;

  return v_household_id;
end;
$BODY$;

grant execute on function sobiyojung.join_household_by_code(text) to authenticated;

notify pgrst, 'reload schema';
