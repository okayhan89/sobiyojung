import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginButton } from "./login-button";

export const metadata: Metadata = {
  title: "로그인",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="safe-top safe-bottom flex flex-1 flex-col items-center justify-center px-6">
      <div className="relative w-full max-w-sm">
        <div
          aria-hidden
          className="absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#ffd5e3] blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-10 -right-6 h-32 w-32 rounded-full bg-[#fff2d6] blur-2xl"
        />

        <section className="relative rounded-[28px] border border-[#f0dde4] bg-white/80 p-7 shadow-[0_20px_60px_-24px_rgba(138,27,82,0.28)] backdrop-blur">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ffd5e3] text-3xl">
              🧚‍♀️
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#2a1a24]">
              소비요정의 쇼핑구매희망리스트
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#6a5560]">
              이번 주엔 어디서 뭘 살까?
              <br />
              당근·쿠팡·마켓컬리별로 적어두는 공유 메모장
            </p>
          </div>

          <div className="mt-7">
            <LoginButton />
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-[#a8949c]">
            로그인하면 아내·남편과 같은 리스트를 실시간으로 공유할 수
            있어요.
          </p>
        </section>
      </div>
    </main>
  );
}
