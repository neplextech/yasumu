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
  href?: string;
  external?: boolean;
  onClick?: () => void;
}) {
  const Wrapper = (props: React.PropsWithChildren) => {
    if (!onClick && href) {
      return (
        <Link
          href={href as any}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="group block"
        >
          {props.children}
        </Link>
      );
    }

    return (
      <a
        onClick={(e) => {
          e.preventDefault();
          onClick?.();
        }}
        className="group block"
      >
        {props.children}
      </a>
    );
  };

  return (
    <Wrapper>
      <Card className="hover:border-primary/50 cursor-pointer transition-all duration-300 group-hover:-translate-y-1 hover:shadow-md">
        <div className="flex items-center gap-4 p-4">
          <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground shrink-0 rounded-md p-3 transition-colors">
            <Icon className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="group-hover:text-primary text-base font-semibold transition-colors">{title}</h3>
            {description && <p className="text-muted-foreground line-clamp-2 text-sm">{description}</p>}
          </div>
        </div>
      </Card>
    </Wrapper>
  );
}
