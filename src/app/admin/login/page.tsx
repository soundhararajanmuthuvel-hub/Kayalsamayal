"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { loginAdmin } from "@/lib/admin-auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("from") || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = loginAdmin(username, password);
    if (!result.success) {
      setError(result.error || "Invalid username or password");
      setLoading(false);
      return;
    }

    router.push(redirectPath);
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-[#1B432E] bg-[#0C2B1C] p-8 shadow-2xl text-white">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-3 h-16 w-16 overflow-hidden rounded-2xl border-2 border-[#D4A373]/50 shadow-md">
          <Image
            src="/assets/logo.jpg"
            alt="Kayal Samayal"
            fill
            className="object-cover"
            priority
          />
        </div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-[#F7E7CE]">
          Kayal Samayal
        </h1>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4A373] mt-1">
          Admin Portal & ERP
        </p>
        <p className="text-xs text-neutral-400 mt-2">
          Direct Google Sheets integration • Real-time order synchronization
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
          <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Admin Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              <User size={16} />
            </span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full rounded-lg border border-[#1B432E] bg-[#092216] py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:border-[#D4A373] focus:outline-hidden focus:ring-1 focus:ring-[#D4A373] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Admin Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              <Lock size={16} />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-[#1B432E] bg-[#092216] py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:border-[#D4A373] focus:outline-hidden focus:ring-1 focus:ring-[#D4A373] transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#D4A373] py-2.5 px-4 text-sm font-semibold text-[#0C2B1C] shadow-md hover:bg-[#E5B585] active:scale-98 disabled:opacity-60 transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-[#1B432E] pt-4 text-center">
        <p className="text-[11px] text-neutral-500">
          Google Sheets single source of truth • Frontend + Sheet direct sync
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="text-white text-sm">Loading admin portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
