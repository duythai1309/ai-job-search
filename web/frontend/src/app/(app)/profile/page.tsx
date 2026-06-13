import { UserRound, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d95332]">Safe state</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#173c31]">Hồ sơ của tôi</h1>
      <p className="mt-2 text-sm text-[#365347]/65">
        Trang hồ sơ hiện chưa nối API profile, nên vẫn ở dạng giới hạn an toàn.
      </p>

      <div className="mt-8 rounded-[1.5rem] border border-[#1c2923]/10 bg-white/80 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef4eb] text-[#24543f]">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-[#173c31]">Thông tin cá nhân</p>
            <p className="text-sm text-[#365347]/62">Dùng CV upload và recommendations để tạo hồ sơ đầy đủ hơn.</p>
          </div>
        </div>

        <Link
          href="/cv-upload"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#173c31] px-5 py-3 text-sm font-bold text-white"
        >
          Tạo dữ liệu từ CV
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
