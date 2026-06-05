const SIZE_STYLES = {
  sm: {
    container: "w-8 h-8 rounded-lg",
    icon: "w-[18px] h-[18px]",
  },
  md: {
    container: "w-11 h-11 rounded-xl",
    icon: "w-5 h-5",
  },
  lg: {
    container: "w-12 h-12 xl:w-14 xl:h-14 rounded-xl xl:rounded-2xl",
    icon: "w-6 h-6 xl:w-7 xl:h-7",
  },
};

const VARIANT_STYLES = {
  solid: "bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-blue-500/20",
  sidebar: "bg-blue-600 flex items-center justify-center flex-shrink-0",
  glass:
    "bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-xl ring-1 ring-white/10",
  gradient: "bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0",
};

/** Stylized C arc + sparkle mark — readable from 16px upward */
export function CreatorAIIcon({ className = "", title = "Creator AI" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path
        d="M15.8 7.4C14.4 5.6 11.9 4.5 9.2 4.5C5.5 4.5 2.5 7.5 2.5 11.2s3 6.7 6.7 6.7c2.7 0 5.2-1.1 6.6-2.9"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M17.8 5.8l.55 1.3 1.3.55-1.3.55-.55 1.3-.55-1.3-1.3-.55 1.3-.55.55-1.3z"
        fill="currentColor"
      />
      <circle cx="19.2" cy="13.8" r="1.15" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

export default function CreatorAILogo({
  size = "sm",
  variant = "sidebar",
  className = "",
  iconClassName = "",
}) {
  const sizeStyle = SIZE_STYLES[size] ?? SIZE_STYLES.sm;
  const variantStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.sidebar;

  return (
    <div
      className={`${sizeStyle.container} ${variantStyle} ${className}`.trim()}
      aria-hidden="true"
    >
      <CreatorAIIcon
        className={`${sizeStyle.icon} text-white ${iconClassName}`.trim()}
      />
    </div>
  );
}
