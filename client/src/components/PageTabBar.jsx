import { useCallback, useEffect, useRef, useState } from "react";

function shortenScheduleLabel(label) {
  if (label === "Today's") return "Today";
  if (label === "Tomorrow's") return "Tomorrow";
  return label;
}

function defaultGetTabLabel(tab, { mobile, labelOverrides }) {
  const override = labelOverrides?.[tab.id];
  const full = override ?? tab.label;
  if (!mobile) return full;
  if (override) return shortenScheduleLabel(override);
  return tab.shortLabel ?? tab.label;
}

function CountBadge({ count, isActive }) {
  return (
    <span
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
        isActive
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      {count ?? 0}
    </span>
  );
}

export default function PageTabBar({
  tabs,
  activeTab,
  onChange,
  ariaLabel = "Page views",
  tabCounts = {},
  labelOverrides = {},
  getTabLabel = defaultGetTabLabel,
  alwaysShowBadgeFor = [],
}) {
  const scrollRef = useRef(null);
  const tabRefs = useRef({});
  const [scrollHints, setScrollHints] = useState({ left: false, right: false });

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setScrollHints({
      left: scrollLeft > 2,
      right: scrollLeft + clientWidth < scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollHints();
    el.addEventListener("scroll", updateScrollHints, { passive: true });
    const ro = new ResizeObserver(updateScrollHints);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollHints);
      ro.disconnect();
    };
  }, [tabs, updateScrollHints]);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    el?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [activeTab, tabs]);

  if (!tabs?.length) return null;

  return (
    <div className="relative flex-shrink-0 min-w-0">
      {scrollHints.left && (
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-5 z-10 bg-gradient-to-r from-gray-50 dark:from-gray-900 to-transparent"
          aria-hidden
        />
      )}
      {scrollHints.right && (
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-5 z-10 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent"
          aria-hidden
        />
      )}
      <div
        ref={scrollRef}
        className="flex gap-0.5 sm:gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide -mx-1 px-1"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id];
          const showBadge =
            alwaysShowBadgeFor.includes(tab.id) || (count != null && count > 0);
          const desktopLabel = getTabLabel(tab, { mobile: false, labelOverrides });
          const mobileLabel = getTabLabel(tab, { mobile: true, labelOverrides });

          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node) tabRefs.current[tab.id] = node;
                else delete tabRefs.current[tab.id];
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors flex-shrink-0 whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {Icon && <Icon size={16} className="flex-shrink-0" />}
              <span className="sm:hidden">{mobileLabel}</span>
              <span className="hidden sm:inline">{desktopLabel}</span>
              {showBadge && <CountBadge count={count} isActive={isActive} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
