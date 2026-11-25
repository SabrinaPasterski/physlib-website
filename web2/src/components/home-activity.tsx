"use client";

import { useEffect, useState } from "react";
import type { Activity, ActivityItem } from "@/lib/physlib-activity";
import styles from "./home-activity.module.css";

const VISIBLE = 3;
const STEP_MS = 4_500;

function ago(iso: string, now: number) {
  const minutes = Math.max(1, Math.round((now - Date.parse(iso)) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function statusText(item: ActivityItem, now: number) {
  if (item.status === "merged") return `merged ${ago(item.at, now)}`;
  return item.status === "draft" ? "drafting" : "in review";
}

/** A small live feed of who is working on what in Physlib, shown under the Globe. */
export function HomeActivity({ paused }: { paused: boolean }) {
  const [activity, setActivity] = useState<Activity | null>();
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/activity")
      .then(response => response.ok ? response.json() as Promise<Activity> : null)
      .then(data => { if (active) setActivity(data); }, () => { if (active) setActivity(null); });
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => { active = false; media.removeEventListener("change", sync); };
  }, []);

  const count = activity?.items.length ?? 0;
  useEffect(() => {
    if (paused || reducedMotion || count <= VISIBLE) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setOffset(current => (current + 1) % count);
      setNow(Date.now());
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, count]);

  // Nothing to show is better than a broken widget on the home page.
  if (activity === null) return null;
  const shown = activity
    ? Array.from({ length: Math.min(VISIBLE, count) }, (_, i) => activity.items[(offset + i) % count])
    : [];

  return (
    <section className={styles.activity} aria-labelledby="home-activity-title">
      <h3 id="home-activity-title" className={styles.title}>
        <span className={styles.pulse} aria-hidden="true" />
        <span className="label-mono">Happening now</span>
        {activity && activity.activeThisWeek > 0 && (
          <span className={styles.people}>
            {activity.activeThisWeek} {activity.activeThisWeek === 1 ? "person" : "people"} this week
          </span>
        )}
      </h3>
      <ul className={styles.list} role="list" aria-busy={!activity}>
        {activity ? shown.map((item, i) => (
          <li key={item.number} className={i === 0 && !reducedMotion ? styles.enter : undefined}>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.row}
              title={`#${item.number} · ${item.summary}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://github.com/${encodeURIComponent(item.login)}.png?size=40`} alt=""
                width={20} height={20} loading="lazy" className={styles.avatar} />
              <span className={styles.who}>{item.login}</span>
              <span className={styles.area} data-library={item.library}>{item.area}</span>
              <span className={styles.what}>{item.summary}</span>
              <span className={styles.status} data-status={item.status}>{statusText(item, now)}</span>
            </a>
          </li>
        )) : Array.from({ length: VISIBLE }, (_, i) => <li key={i} className={styles.placeholder} />)}
      </ul>
    </section>
  );
}
