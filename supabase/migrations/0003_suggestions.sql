-- Autocomplete suggestion RPC. Returns distinct item texts across the
-- caller's household, ordered by most recent usage.

drop function if exists sobiyojung.item_suggestions(int);

create function sobiyojung.item_suggestions(p_limit int default 500)
returns setof text
language sql
security definer
set search_path = sobiyojung, public
stable
as $BODY$
  select text
  from (
    select text, max(created_at) as last_used
    from sobiyojung.items
    where exists (
      select 1
      from sobiyojung.stores s
      where s.id = items.store_id
        and sobiyojung.is_household_member(s.household_id)
    )
    group by text
  ) t
  order by last_used desc
  limit coalesce(p_limit, 500);
$BODY$;

grant execute on function sobiyojung.item_suggestions(int) to authenticated;

notify pgrst, 'reload schema';
