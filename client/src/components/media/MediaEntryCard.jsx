import { Film, Link } from "lucide-react";

/** Colour palette cycling for category index badges */
const BADGE_COLOURS = [
  { bg: "bg-primary-50 dark:bg-primary-950/30", icon: "text-primary-600 dark:text-primary-400" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-violet-50 dark:bg-violet-950/30", icon: "text-violet-600 dark:text-violet-400" },
  { bg: "bg-amber-50 dark:bg-amber-950/30", icon: "text-amber-600 dark:text-amber-400" },
  { bg: "bg-rose-50 dark:bg-rose-950/30", icon: "text-rose-600 dark:text-rose-400" },
  { bg: "bg-sky-50 dark:bg-sky-950/30", icon: "text-sky-600 dark:text-sky-400" },
  { bg: "bg-teal-50 dark:bg-teal-950/30", icon: "text-teal-600 dark:text-teal-400" },
];

/** Platform SVG icons as inline components */
const YouTubeIcon = () => (
  <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-3.5 h-3.5 text-sky-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-3.5 h-3.5 text-pink-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
  </svg>
);

/**
 * Counts total links on an entry (platforms + custom links).
 */
function countLinks(entry) {
  let n = 0;
  if (entry.youtube) n++;
  if (entry.facebook) n++;
  if (entry.twitter) n++;
  if (entry.instagram) n++;
  if (entry.website) n++;
  if (Array.isArray(entry.customLinks)) n += entry.customLinks.filter((cl) => cl?.url).length;
  return n;
}

/**
 * Compact media entry card — fixed ~240 px wide, renders platform icons for
 * non-empty link fields and custom link labels.
 *
 * @param {{ entry: object, categoryIndex: number }} props
 */
export default function MediaEntryCard({ entry, categoryIndex = 0 }) {
  const colour = BADGE_COLOURS[categoryIndex % BADGE_COLOURS.length];
  const linkCount = countLinks(entry);
  const customLinks = Array.isArray(entry.customLinks)
    ? entry.customLinks.filter((cl) => cl?.url && cl?.label)
    : [];

  const hasPlatformLinks =
    entry.youtube || entry.facebook || entry.twitter || entry.instagram || entry.website;

  return (
    <div
      className="
        buffer-card flex flex-col overflow-hidden flex-shrink-0
        hover:shadow-md hover:-translate-y-px hover:border-primary-200 dark:hover:border-primary-700
        transition-all duration-150
      "
      style={{ width: "clamp(240px, 100%, 240px)" }}
    >
      {/* Header */}
      <div className="px-3 pt-2.5 pb-2 flex items-start gap-2">
        <div
          className={`w-7 h-7 rounded-lg ${colour.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}
          aria-hidden="true"
        >
          {linkCount > 3 ? (
            <Link size={14} className={colour.icon} />
          ) : (
            <Film size={14} className={colour.icon} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-xs font-semibold buffer-text truncate leading-snug"
            title={entry.name}
          >
            {entry.name}
          </p>
          {entry.description && (
            <p
              className="text-[10px] buffer-text-subtle leading-snug mt-0.5 line-clamp-2"
              title={entry.description}
            >
              {entry.description}
            </p>
          )}
          <p className="text-[10px] buffer-text-subtle tabular-nums mt-0.5">
            {linkCount} {linkCount === 1 ? "link" : "links"}
          </p>
        </div>
      </div>

      {/* Divider + platform icons */}
      {(hasPlatformLinks || customLinks.length > 0) && (
        <div className="px-3 pb-2.5 border-t border-gray-100 dark:border-gray-700 pt-1.5">
          <div className="flex flex-wrap items-center gap-1">
            {entry.youtube && (
              <a
                href={entry.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                aria-label={`${entry.name} on YouTube`}
                title="YouTube"
              >
                <YouTubeIcon />
              </a>
            )}
            {entry.facebook && (
              <a
                href={entry.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                aria-label={`${entry.name} on Facebook`}
                title="Facebook"
              >
                <FacebookIcon />
              </a>
            )}
            {entry.twitter && (
              <a
                href={entry.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                aria-label={`${entry.name} on Twitter / X`}
                title="Twitter / X"
              >
                <TwitterIcon />
              </a>
            )}
            {entry.instagram && (
              <a
                href={entry.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-pink-50 dark:bg-pink-950/30 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
                aria-label={`${entry.name} on Instagram`}
                title="Instagram"
              >
                <InstagramIcon />
              </a>
            )}
            {entry.website && (
              <a
                href={entry.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label={`${entry.name} website`}
                title="Website"
              >
                <GlobeIcon />
              </a>
            )}
            {/* Custom links — text label only, truncated */}
            {customLinks.map((cl, i) => (
              <a
                key={i}
                href={cl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block max-w-full px-1.5 py-0.5 rounded text-[10px] font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-100 dark:hover:bg-primary-900/40 border border-primary-200/60 dark:border-primary-800/40 truncate transition-colors"
                style={{ maxWidth: 128 }}
                title={`${cl.label}: ${cl.url}`}
              >
                {cl.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
