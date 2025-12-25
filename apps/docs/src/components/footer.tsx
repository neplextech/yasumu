import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-fd-border bg-fd-card py-12">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo-dark-glow.png"
              alt="Yasumu Logo"
              className="w-6 h-6 rounded-md"
            />
            <span className="font-bold text-lg">Yasumu</span>
          </Link>
          <p className="text-fd-muted-foreground text-sm">
            The modern API laboratory for developers.
          </p>
          <div className="text-fd-muted-foreground text-sm flex items-center gap-2 mt-2">
            <span>© {new Date().getFullYear()}</span>
            <a
              href="https://neplextech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-fd-foreground transition-colors"
            >
              Neplex
            </a>
          </div>
        </div>

        <div className="flex gap-8 text-sm">
          <div className="flex flex-col gap-3">
            <h4 className="font-medium">Project</h4>
            <a
              href="https://github.com/neplextech/yasumu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://github.com/neplextech/yasumu/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              Contributing
            </a>
            <Link
              href="/docs/changelog"
              className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              Changelog
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="font-medium">Legal</h4>
            <a
              href="https://github.com/neplextech/yasumu/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              License
            </a>
            <a
              href="https://github.com/neplextech/yasumu/blob/main/CODE_OF_CONDUCT.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              Code of Conduct
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
