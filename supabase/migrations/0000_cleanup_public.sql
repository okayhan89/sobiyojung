-- Cleanup: 이전에 public 스키마로 생성했던 테이블/함수/정책을 제거합니다.
-- 반드시 0001_init.sql 실행 전에 먼저 실행하세요.
-- 공유 Supabase 프로젝트이므로 이 파일은 오직 이 앱이 만든 객체만 건드립니다.

-- 1. realtime publication에서 제거 (등록돼 있지 않아도 무시)
do $$
begin
  begin
    alter publication supabase_realtime drop table public.items;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime drop table public.stores;
  exception when others then null;
  end;
end $$;

-- 2. 테이블 삭제 (CASCADE로 정책/외래키 같이 정리)
drop table if exists public.items cascade;
drop table if exists public.stores cascade;
drop table if exists public.household_members cascade;
drop table if exists public.households cascade;

-- 3. 헬퍼 함수 삭제
drop function if exists public.is_household_member(uuid);
