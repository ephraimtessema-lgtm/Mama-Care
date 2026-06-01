/** Google OAuth sometimes sets name to the app title — ignore that for display */
const BLOCKED_NAMES = /^mama-?care(\s*ai)?$/i;

/** Username shown in nav / profile button (part before @) */
export function getUsername(user) {
  const emailPrefix = user?.email?.split('@')[0]?.trim();
  if (emailPrefix) return emailPrefix;

  const fullName = user?.full_name?.trim();
  if (fullName && !BLOCKED_NAMES.test(fullName)) {
    return fullName;
  }

  const metaName = user?.user_metadata?.full_name?.trim() || user?.user_metadata?.name?.trim();
  if (metaName && !BLOCKED_NAMES.test(metaName)) {
    return metaName;
  }

  return 'Member';
}

/** @deprecated use getUsername — kept for imports */
export function getDisplayLabel(user) {
  return getUsername(user);
}

export function getFlowerName(user) {
  return user?.flower_name?.trim() || null;
}

export function getAvatarInitial(user) {
  const username = getUsername(user);
  const match = username.match(/[a-zA-Z0-9]/);
  return (match ? match[0] : '?').toUpperCase();
}
