import { cn } from '@/lib/utils';
import { getAvatarInitial, getUsername } from '@/lib/displayName';

export default function UserAvatar({ user, size = 'md', className }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  if (!user) return null;

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white font-semibold flex items-center justify-center shrink-0 shadow-sm shadow-rose-200/60',
        sizes[size] || sizes.md,
        className,
      )}
      title={getUsername(user)}
      aria-hidden
    >
      {getAvatarInitial(user)}
    </div>
  );
}
