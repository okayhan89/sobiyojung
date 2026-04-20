-- Extend widget_summary to include the top 3 open item texts per store.
-- Keeps backward-compatible column order; adds `open_items text[]` at the end.

drop function if exists sobiyojung.widget_summary(text);

create function sobiyojung.widget_summary(p_invite_code text)
returns table(
  store_id uuid,
  name text,
  slug text,
  icon text,
  color text,
  sort_order int,
  open_count bigint,
  open_items text[]
)
language sql
security definer
set search_path = sobiyojung, public
stable
as $BODY$
  with h as (
    select id from sobiyojung.households
    where invite_code = upper(trim(p_invite_code))
  ),
  open_items_raw as (
    select
      i.store_id,
      i.text,
      i.created_at,
      row_number() over (partition by i.store_id order by i.created_at desc) as rn,
      count(*) over (partition by i.store_id) as cnt
    from sobiyojung.items i
    join sobiyojung.stores s on s.id = i.store_id
    where i.checked = false
      and s.household_id = (select id from h)
  ),
  item_agg as (
    select
      store_id,
      max(cnt) as cnt,
      array_agg(text order by created_at desc)
        filter (where rn <= 3) as items
    from open_items_raw
    group by store_id
  )
  select
    s.id as store_id,
    s.name,
    s.slug,
    s.icon,
    s.color,
    s.sort_order,
    coalesce(ia.cnt, 0)::bigint as open_count,
    coalesce(ia.items, '{}'::text[]) as open_items
  from sobiyojung.stores s
  left join item_agg ia on ia.store_id = s.id
  where s.household_id = (select id from h)
    and s.is_archived = false
  order by s.sort_order asc, s.created_at asc
  limit 30;
$BODY$;

grant execute on function sobiyojung.widget_summary(text) to anon, authenticated;

notify pgrst, 'reload schema';
