"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LIVE_ORDERING_SELECT_EVENT,
  liveOrderingDisplayName,
} from "@/lib/live-ordering";
import { fetchLiveOrderingItems, LIVE_ORDERING_POLL_MS } from "@/lib/order-poll";

function tableNumberFromPath(pathname: string): number | null {
  const match = pathname.match(/^\/(?:order|scan)\/(\d+)/);
  if (!match) return null;
  const tableNumber = parseInt(match[1], 10);
  return Number.isNaN(tableNumber) ? null : tableNumber;
}

export default function LiveOrderingBar() {
  const pathname = usePathname() || "/";
  const [itemNames, setItemNames] = useState<string[]>([]);
  const tableNumber = tableNumberFromPath(pathname);

  const hidden = pathname.startsWith("/admin");

  useEffect(() => {
    if (hidden) {
      setItemNames([]);
      return;
    }

    async function refresh() {
      const names = await fetchLiveOrderingItems(tableNumber);
      setItemNames(names);
    }

    void refresh();

    function tick() {
      if (document.visibilityState === "hidden") return;
      void refresh();
    }

    const interval = setInterval(tick, LIVE_ORDERING_POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [hidden, tableNumber, pathname]);

  if (hidden || !itemNames.length) return null;

  function selectItem(name: string) {
    window.dispatchEvent(new CustomEvent(LIVE_ORDERING_SELECT_EVENT, { detail: name }));
  }

  return (
    <div className="live-ordering-bar" aria-label="Other tables are ordering">
      <div className="live-ordering-bar__inner">
        <span className="live-ordering-dot shrink-0" aria-hidden />
        <p className="live-ordering-bar__label">Other tables are ordering</p>
        <div className="live-ordering-rail">
          {itemNames.map((name) => (
            <button
              key={name}
              type="button"
              className="live-ordering-chip"
              onClick={() => selectItem(name)}
            >
              {liveOrderingDisplayName(name)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
