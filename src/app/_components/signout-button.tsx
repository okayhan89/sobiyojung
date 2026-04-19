import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        aria-label="로그아웃"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f0dde4] bg-white/70 text-[#6a5560] backdrop-blur transition hover:bg-white hover:text-[#2a1a24]"
      >
        <LogOut size={16} />
      </button>
    </form>
  );
}
