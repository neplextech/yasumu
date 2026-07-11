import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="bg-fd-primary/10 mb-6 rounded-full p-6">
        <FileQuestion className="text-fd-primary h-16 w-16" />
      </div>

      <h2 className="mb-2 text-3xl font-bold tracking-tight">Page Not Found</h2>

      <p className="text-fd-muted-foreground mb-8 max-w-md text-lg">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="flex gap-4">
        <Link
          href="/"
          className="border-fd-border bg-fd-card hover:bg-fd-accent hover:text-fd-accent-foreground inline-flex items-center justify-center rounded-lg border px-6 py-2 font-medium transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/docs"
          className="bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 inline-flex items-center justify-center rounded-lg px-6 py-2 font-medium transition-colors"
        >
          Browse Docs
        </Link>
      </div>
    </div>
  );
}
