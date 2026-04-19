"use client";

import { useState, useTransition } from "react";
import { createHouseholdAction, joinHouseholdAction } from "./actions";

type Mode = "choose" | "join";

export function OnboardingForm() {
  const [mode, setMode] = useState<Mode>("choose");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createHouseholdAction();
      if (!result.success) {
        setError(result.error ?? "문제가 생겼어요.");
      }
    });
  }

  function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await joinHouseholdAction(code);
      if (!result.success) {
        setError(result.error ?? "문제가 생겼어요.");
      }
    });
  }

  if (mode === "join") {
    return (
      <form onSubmit={handleJoin} className="flex flex-col gap-3">
        <label htmlFor="code" className="text-sm font-medium text-[#2a1a24]">
          초대 코드
        </label>
        <input
          id="code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="예: A3K9P2"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={6}
          className="h-12 rounded-2xl border border-[#f0dde4] bg-white px-4 text-center text-lg font-semibold tracking-[0.3em] text-[#2a1a24] outline-none focus:border-[#e85a9a]"
        />
        <button
          type="submit"
          disabled={isPending || code.length < 4}
          className="flex h-12 items-center justify-center rounded-full bg-[#e85a9a] text-[15px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(232,90,154,0.55)] transition active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "합류하는 중..." : "합류하기"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("choose");
            setError(null);
          }}
          className="text-center text-xs text-[#a8949c] underline-offset-4 hover:underline"
        >
          뒤로
        </button>
        {error ? (
          <p role="alert" className="text-center text-xs text-[#e5484d]">
            {error}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleCreate}
        disabled={isPending}
        className="flex h-14 items-center justify-between gap-3 rounded-2xl bg-[#2a1a24] px-5 text-left text-white shadow-[0_10px_24px_-10px_rgba(42,26,36,0.55)] transition active:translate-y-[1px] disabled:opacity-60"
      >
        <span className="flex flex-col">
          <span className="text-[15px] font-semibold">새로 시작하기</span>
          <span className="text-xs text-white/70">
            기본 스토어 7개가 준비돼 있어요
          </span>
        </span>
        <span aria-hidden className="text-xl">
          ✨
        </span>
      </button>

      <button
        type="button"
        onClick={() => setMode("join")}
        className="flex h-14 items-center justify-between gap-3 rounded-2xl border border-[#f0dde4] bg-white px-5 text-left text-[#2a1a24] transition hover:bg-[#fef7f9] active:translate-y-[1px]"
      >
        <span className="flex flex-col">
          <span className="text-[15px] font-semibold">코드로 합류</span>
          <span className="text-xs text-[#a8949c]">
            짝꿍이 보내준 초대 코드가 있다면
          </span>
        </span>
        <span aria-hidden className="text-xl">
          🔑
        </span>
      </button>

      {error ? (
        <p role="alert" className="text-center text-xs text-[#e5484d]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
