import { cn } from '@yasumu/ui/lib/utils';

export default function LayoutGroup({
  children,
  className,
  ...rest
}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        'flex h-full w-[calc(100%-var(--sidebar-width-icon)-1px)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
