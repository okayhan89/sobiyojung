"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "로그인에 실패했어요.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#2a1a24] px-5 text-[15px] font-medium text-white shadow-[0_8px_24px_-8px_rgba(42,26,36,0.45)] transition-[transform,box-shadow,background] duration-200 ease-out hover:bg-black active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleMark />
        <span>{loading ? "연결 중..." : "Google로 계속하기"}</span>
      </button>

      {error ? (
        <p role="alert" className="text-center text-xs text-[#e5484d]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.5-1.7 4.4-5.5 4.4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.9 14.6 3 12 3 6.9 3 2.8 7.1 2.8 12.2S6.9 21.4 12 21.4c6.9 0 11.5-4.9 11.5-11.7 0-.8-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#FBBC05"
        d="M3.8 7.5l3.2 2.4C7.9 8 9.8 6.6 12 6.6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.9 14.6 3 12 3 8.2 3 5 5.2 3.8 7.5z"
      />
      <path
        fill="#34A853"
        d="M12 21.4c2.6 0 4.8-.9 6.4-2.4l-3-2.4c-.8.6-2 1.1-3.4 1.1-2.7 0-4.9-1.8-5.7-4.2L3 16c1.2 3 4.8 5.4 9 5.4z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.2c0-.8-.1-1.3-.2-1.9H12v3.9h5.5c-.24 1.5-1.7 4.4-5.5 4.4-.5 0-1-.1-1.4-.2l3 2.4c1.8-.5 3.5-1.6 4.7-3.1 1.3-1.6 1.2-4 1.2-5.5z"
      />
    </svg>
  );
}
