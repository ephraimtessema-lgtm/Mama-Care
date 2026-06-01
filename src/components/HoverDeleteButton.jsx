import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HoverDeleteButton({
  onClick,
  title = 'Delete',
  className,
  iconClassName = 'w-3.5 h-3.5',
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={cn(
        'p-1.5 rounded-lg text-red-500 shrink-0',
        'opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity',
        'hover:bg-red-50 dark:hover:bg-red-950/40',
        className,
      )}
    >
      <Trash2 className={iconClassName} />
    </button>
  );
}
