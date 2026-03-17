"use client";

import { useState, useRef, useEffect } from "react";
import { BR_TEAMS } from "@/lib/constants";
import type { BRTeam } from "@/lib/constants";

interface SettingsPanelProps {
  twitterAccounts: string[];
  brTeams: string[];
  onSave: (accounts: string[], teams: string[]) => void;
  onClose: () => void;
}

const SPORT_COLORS: Record<string, string> = {
  NBA: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  NFL: "bg-green-500/20 text-green-300 border-green-500/30",
  MLB: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  NHL: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Soccer: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

function sportColor(sport: string) {
  return SPORT_COLORS[sport] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";
}

export default function SettingsPanel({
  twitterAccounts,
  brTeams,
  onSave,
  onClose,
}: SettingsPanelProps) {
  const [accounts, setAccounts] = useState<string[]>(twitterAccounts);
  const [teams, setTeams] = useState<string[]>(brTeams);
  const [newAccount, setNewAccount] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const twitterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    twitterInputRef.current?.focus();
  }, []);

  // Filtered suggestions (exclude already-added teams)
  const suggestions: BRTeam[] = teamSearch.trim().length > 0
    ? BR_TEAMS.filter(
        (t) =>
          !teams.includes(t.slug) &&
          (t.label.toLowerCase().includes(teamSearch.toLowerCase()) ||
            t.sport.toLowerCase().includes(teamSearch.toLowerCase()))
      ).slice(0, 8)
    : [];

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

  function addTeam(slug: string) {
    if (!teams.includes(slug)) setTeams((prev) => [...prev, slug]);
    setTeamSearch("");
  }

  function removeTeam(slug: string) {
    setTeams((prev) => prev.filter((s) => s !== slug));
  }

  function teamForSlug(slug: string): BRTeam | undefined {
    return BR_TEAMS.find((t) => t.slug === slug);
  }

  function handleSave() {
    onSave(accounts, teams);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

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
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold">𝕏</span>
              Reporters / People
            </h3>

            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                <input
                  ref={twitterInputRef}
                  type="text"
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAccount()}
                  placeholder="e.g. ShamsCharania"
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
              <p className="text-sm text-gray-500 italic">No reporters added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {accounts.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 pl-3 pr-2 py-1 text-sm text-sky-300"
                  >
                    @{a}
                    <button onClick={() => removeAccount(a)} className="text-sky-500 hover:text-sky-200 transition">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-gray-600">Searches Google News by name — works best for reporters & journalists.</p>
          </section>

          {/* Bleacher Report Teams */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">BR</span>
              Bleacher Report Teams
            </h3>

            {/* Search input */}
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="Search teams (e.g. Lakers, Chiefs, Yankees…)"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="mb-3 rounded-lg border border-gray-700 bg-gray-800 overflow-hidden">
                {suggestions.map((team, i) => (
                  <button
                    key={team.slug}
                    onClick={() => addTeam(team.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-700 transition ${i > 0 ? "border-t border-gray-700/60" : ""}`}
                  >
                    <span className="text-gray-200">{team.label}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${sportColor(team.sport)}`}>
                      {team.sport}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected teams */}
            {teams.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No teams added yet. Search above to add.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teams.map((slug) => {
                  const team = teamForSlug(slug);
                  return (
                    <span
                      key={slug}
                      className={`inline-flex items-center gap-1.5 rounded-full border pl-3 pr-2 py-1 text-sm ${team ? sportColor(team.sport) : "bg-gray-700/40 text-gray-300 border-gray-600"}`}
                    >
                      {team?.label ?? slug}
                      <button onClick={() => removeTeam(slug)} className="opacity-70 hover:opacity-100 transition">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
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
