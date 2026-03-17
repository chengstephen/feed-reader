"use client";

import { useState, useRef, useEffect } from "react";
import { BR_SPORTS } from "@/lib/constants";

interface SettingsPanelProps {
  twitterAccounts: string[];
  brSports: string[];
  onSave: (accounts: string[], sports: string[]) => void;
  onClose: () => void;
}

export default function SettingsPanel({
  twitterAccounts,
  brSports,
  onSave,
  onClose,
}: SettingsPanelProps) {
  const [accounts, setAccounts] = useState<string[]>(twitterAccounts);
  const [sports, setSports] = useState<string[]>(brSports);
  const [newAccount, setNewAccount] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function addAccount() {
    const cleaned = newAccount.replace(/^@/, "").trim();
    if (cleaned && !accounts.includes(cleaned)) {
      setAccounts((prev) => [...prev, cleaned]);
    }
    setNewAccount("");
  }

  function removeAccount(a: string) {
    setAccounts((prev) => prev.filter((x) => x !== a));
  }

  function toggleSport(slug: string) {
    setSports((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function handleSave() {
    onSave(accounts, sports);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Feed Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-7">
          {/* Twitter / X Accounts */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-xs">𝕏</span>
              Twitter / X Accounts
            </h3>

            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAccount()}
                  placeholder="username"
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 pl-7 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={addAccount}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
              >
                Add
              </button>
            </div>

            {accounts.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No accounts added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {accounts.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 pl-3 pr-2 py-1 text-sm text-sky-300"
                  >
                    @{a}
                    <button
                      onClick={() => removeAccount(a)}
                      className="text-sky-500 hover:text-sky-200 transition"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-gray-600">
              Twitter feeds load via Nitter RSS — availability may vary.
            </p>
          </section>

          {/* Bleacher Report Sports */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-xs">BR</span>
              Bleacher Report Sports
            </h3>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BR_SPORTS.map((sport) => {
                const active = sports.includes(sport.slug);
                return (
                  <button
                    key={sport.slug}
                    onClick={() => toggleSport(sport.slug)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium text-left transition ${
                      active
                        ? "border-orange-500/60 bg-orange-500/20 text-orange-300"
                        : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200"
                    }`}
                  >
                    {sport.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-700 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition"
          >
            Save & Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
