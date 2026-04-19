-- Widget read-only RPC.
-- Authenticates by invite code (same secret as household membership),
-- so no native Google Sign-In is needed in the Android widget.
-- Returns per-store open item count for the matching household.

drop function if exists sobiyojung.widget_summary(text);

create function sobiyojung.widget_summary(p_invite_code text)
returns table(
  store_id uuid,
  name text,
  slug text,
  icon text,
  color text,
  sort_order int,
  open_count bigint
)
language sql
security definer
set search_path = sobiyojung, public
stable
as $BODY$
  select
    s.id as store_id,
    s.name,
    s.slug,
    s.icon,
    s.color,
    s.sort_order,
    coalesce(c.cnt, 0)::bigint as open_count
  from sobiyojung.stores s
  left join (
    select store_id, count(*)::bigint as cnt
    from sobiyojung.items
    where checked = false
    group by store_id
  ) c on c.store_id = s.id
  where s.household_id = (
    select id from sobiyojung.households
    where invite_code = upper(trim(p_invite_code))
  )
    and s.is_archived = false
  order by s.sort_order asc, s.created_at asc
  limit 30;
$BODY$;

grant execute on function sobiyojung.widget_summary(text) to anon, authenticated;

notify pgrst, 'reload schema';
