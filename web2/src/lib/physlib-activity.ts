import { site } from "@/lib/site";

/** One recent pull request, reduced to what the home page activity strip shows. */
export type ActivityItem = {
  number: number;
  url: string;
  login: string;
  /** Conventional-commit scope, prettified: "QuantumMechanics" → "Quantum Mechanics". */
  area: string;
  /** Title with the `type(scope):` prefix removed. */
  summary: string;
  /** Which part of the Globe the work lands in: colours match the Globe's tiles. */
  library: "Physlib" | "PhyslibAlpha";
  status: "merged" | "review" | "draft";
  /** ISO time of the merge for merged work, otherwise of the last update. */
  at: string;
};

export type Activity = {
  items: ActivityItem[];
  /** Distinct authors among pull requests updated in the last seven days. */
  activeThisWeek: number;
};

type RawPull = {
  number?: unknown;
  html_url?: unknown;
  title?: unknown;
  state?: unknown;
  draft?: unknown;
  merged_at?: unknown;
  updated_at?: unknown;
  user?: { login?: unknown; type?: unknown } | null;
};

// "feat(Scope): …", "chore: …" and the occasional "[Scope]: …".
const PREFIX = /^\s*(?:[a-z]+(?:\(([^)]*)\))?!?|\[([^\]]+)\])\s*:\s*/i;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function prettyArea(scope: string): string {
  const first = scope.split(/[/,]/, 1)[0].trim();
  return first.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

export function toActivity(raw: unknown, now = Date.now()): Activity {
  const items: ActivityItem[] = [];
  const recentAuthors = new Set<string>();
  for (const pr of Array.isArray(raw) ? (raw as RawPull[]) : []) {
    const login = pr.user?.login;
    if (typeof pr.number !== "number" || typeof pr.title !== "string" || typeof login !== "string" ||
        pr.html_url !== `${site.github}/pull/${pr.number}` || typeof pr.updated_at !== "string") continue;
    // Bots (dependency bumps, mirrors) are not people contributing.
    if (pr.user?.type === "Bot" || login.endsWith("[bot]")) continue;
    const merged = typeof pr.merged_at === "string";
    // Closed without merging is abandoned work, not activity worth celebrating.
    if (pr.state === "closed" && !merged) continue;
    if (now - Date.parse(pr.updated_at) < WEEK_MS) recentAuthors.add(login.toLowerCase());
    const match = PREFIX.exec(pr.title);
    const scope = (match?.[1] ?? match?.[2] ?? "").trim();
    const summary = pr.title.replace(PREFIX, "").replace(/\s*\(#\d+\)\s*$/, "").trim();
    if (!summary) continue;
    const alpha = /alpha/i.test(scope) || /physlibalpha/i.test(pr.title);
    items.push({
      number: pr.number,
      url: pr.html_url,
      login,
      area: scope && !/^physlib\s*alpha$/i.test(scope) ? prettyArea(scope) : alpha ? "Physlib Alpha" : "Physlib",
      summary: summary[0].toUpperCase() + summary.slice(1),
      library: alpha ? "PhyslibAlpha" : "Physlib",
      status: merged ? "merged" : pr.draft === true ? "draft" : "review",
      at: merged ? (pr.merged_at as string) : pr.updated_at,
    });
  }
  return { items, activeThisWeek: recentAuthors.size };
}

/** The most recently updated pull requests on Physlib, cached for five minutes. */
export async function getActivity(): Promise<Activity | null> {
  try {
    const url = new URL("https://api.github.com/repos/leanprover-community/physlib/pulls");
    url.search = new URLSearchParams({ state: "all", sort: "updated", direction: "desc", per_page: "40" }).toString();
    const response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const activity = toActivity(await response.json());
    return activity.items.length ? activity : null;
  } catch {
    return null;
  }
}
