'use client';
import { Card } from '@yasumu/ui/components/card';
import Link from 'next/link';

export default function ActionCard({
  icon: Icon,
  title,
  description,
  href,
  external,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  href?: React.ComponentProps<typeof Link>['href'];
  external?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <Card className="hover:border-primary/50 cursor-pointer transition-all duration-300 group-hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center gap-4 p-4">
        <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground shrink-0 rounded-md p-3 transition-colors">
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="group-hover:text-primary text-base font-semibold transition-colors">{title}</h3>
          {description && <p className="text-muted-foreground line-clamp-2 text-sm">{description}</p>}
        </div>
      </div>
    </Card>
  );

  const interactiveClassName =
    'group block w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={interactiveClassName}>
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={interactiveClassName}
      >
        {content}
      </Link>
    );
  }

  return <div className="group block">{content}</div>;
}
