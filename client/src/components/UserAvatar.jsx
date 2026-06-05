import { useState } from "react";
import { User } from "lucide-react";

const PROFILE_IMAGE_KEYS = [
  "avatarUrl",
  "avatarURL",
  "avatar",
  "profileImageUrl",
  "profileImage",
  "profilePicture",
  "picture",
  "photo",
  "photoURL",
  "image",
];

const SIZE_STYLES = {
  sm: {
    container: "w-8 h-8 sm:w-9 sm:h-9",
    text: "text-xs sm:text-sm",
    icon: 16,
  },
  md: {
    container: "w-10 h-10",
    text: "text-sm",
    icon: 18,
  },
};

function getProfileImageUrl(user) {
  if (!user) return null;
  for (const key of PROFILE_IMAGE_KEYS) {
    const value = user[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function getInitials(user) {
  if (!user) return null;
  if (user.name) {
    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts[0]) return parts[0][0].toUpperCase();
  }
  if (user.email) return user.email[0].toUpperCase();
  return null;
}

export default function UserAvatar({ user, size = "sm", className = "" }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getProfileImageUrl(user);
  const initials = getInitials(user);
  const showImage = imageUrl && !imgError;
  const styles = SIZE_STYLES[size] || SIZE_STYLES.sm;

  const ringClass =
    "ring-2 ring-white dark:ring-gray-800 shadow-sm dark:shadow-gray-900/40";

  if (showImage) {
    return (
      <img
        src={imageUrl}
        alt=""
        onError={() => setImgError(true)}
        className={`${styles.container} rounded-full object-cover flex-shrink-0 ${ringClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${styles.container} rounded-full flex items-center justify-center flex-shrink-0 font-semibold tracking-tight text-white bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 ${ringClass} ${className}`}
      aria-hidden="true"
    >
      {initials ? (
        <span className={`${styles.text} select-none drop-shadow-sm`}>{initials}</span>
      ) : (
        <User size={styles.icon} strokeWidth={2.25} className="opacity-95" />
      )}
    </div>
  );
}
