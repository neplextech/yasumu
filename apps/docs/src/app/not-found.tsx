import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] py-12 px-4 text-center">
      <div className="bg-fd-primary/10 p-6 rounded-full mb-6">
        <FileQuestion className="w-16 h-16 text-fd-primary" />
      </div>

      <h2 className="text-3xl font-bold tracking-tight mb-2">Page Not Found</h2>

      <p className="text-fd-muted-foreground text-lg max-w-md mb-8">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="flex gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-2 rounded-lg border border-fd-border bg-fd-card hover:bg-fd-accent hover:text-fd-accent-foreground transition-colors font-medium"
        >
          Go Home
        </Link>
        <Link
          href="/docs"
          className="inline-flex items-center justify-center px-6 py-2 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium hover:bg-fd-primary/90 transition-colors"
        >
          Browse Docs
        </Link>
      </div>
    </div>
  );
}
