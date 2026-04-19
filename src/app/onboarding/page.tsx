import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, getHouseholdForUser } from "@/lib/household";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "시작하기",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const existing = await getHouseholdForUser(user.id);
  if (existing) {
    redirect("/");
  }

  return (
    <main className="safe-top safe-bottom flex flex-1 flex-col items-center justify-center px-6">
      <div className="relative w-full max-w-sm">
        <div
          aria-hidden
          className="absolute -top-12 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-[#ffd5e3] blur-3xl"
        />
        <section className="relative rounded-[28px] border border-[#f0dde4] bg-white/85 p-7 shadow-[0_20px_60px_-24px_rgba(138,27,82,0.28)] backdrop-blur">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ffd5e3] text-3xl">
              ✨
            </div>
            <h1 className="mt-4 text-xl font-bold text-[#2a1a24]">
              함께 쓸 공간 만들기
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#6a5560]">
              새로 시작하거나, 짝꿍이 보내준 코드로 합류할 수 있어요.
            </p>
          </div>
          <div className="mt-6">
            <OnboardingForm />
          </div>
        </section>
      </div>
    </main>
  );
}
