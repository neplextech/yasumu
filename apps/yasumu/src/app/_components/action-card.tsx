'use client';
import Link from 'next/link';
import { Card } from '@yasumu/ui/components/card';

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
          className="block group"
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
        className="block group"
      >
        {props.children}
      </a>
    );
  };

  return (
    <Wrapper>
      <Card className="hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer group-hover:-translate-y-1">
        <div className="flex items-center p-4 gap-4">
          <div className="p-3 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
            <Icon className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Wrapper>
  );
}
