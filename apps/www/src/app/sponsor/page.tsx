import Link from 'next/link';
import { FaHeart, FaPatreon, FaArrowRight, FaGithub, FaStar, FaCodeBranch } from 'react-icons/fa6';
import { GiDumpling } from 'react-icons/gi';
import { MdCode, MdBugReport, MdTranslate } from 'react-icons/md';

import Nepal from '@/components/nepal-flag';

import { BackgroundGrid } from '../../components/background-grid';

interface SponsorOption {
  name: string;
  icon: React.ReactNode;
  color: string;
  url: string;
  description: string;
  badge?: string;
}

const sponsorOptions: SponsorOption[] = [
  {
    name: 'Patreon',
    icon: <FaPatreon />,
    color: 'orange',
    url: 'https://patreon.com/twlite',
    description:
      'Support with monthly contributions and get exclusive updates, early access to features, and direct communication with the team.',
    badge: 'Recurring',
  },
  {
    name: 'Buy Me a Momo',
    icon: <GiDumpling />,
    color: 'gray',
    url: 'https://buymemomo.com/twilight',
    description: 'Make a one-time donation via Stripe (International) or eSewa/Khalti/ConnectIPS (Nepal).',
    badge: 'One-time',
  },
];

const contributeOptions = [
  {
    icon: <FaStar />,
    title: 'Star on GitHub',
    description: 'Show your support by starring the repository.',
    url: 'https://github.com/neplextech/yasumu',
    color: 'text-yellow-400',
  },
  {
    icon: <FaCodeBranch />,
    title: 'Contribute Code',
    description: 'Submit pull requests to fix bugs or add features.',
    url: 'https://github.com/neplextech/yasumu/blob/main/CONTRIBUTING.md',
    color: 'text-green-400',
  },
  {
    icon: <MdBugReport />,
    title: 'Report Issues',
    description: 'Help us improve by reporting bugs you encounter.',
    url: 'https://github.com/neplextech/yasumu/issues/new',
    color: 'text-red-400',
  },
  {
    icon: <MdTranslate />,
    title: 'Translate',
    description: 'Help make Yasumu accessible in more languages.',
    url: 'https://github.com/neplextech/yasumu',
    color: 'text-blue-400',
  },
];

const colorClasses: Record<string, string> = {
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20 group-hover:border-orange-500/40',
  gray: 'bg-gray-500/10 text-gray-200 border-gray-500/20 group-hover:border-gray-500/40',
};

export default function Sponsor() {
  return (
    <div className="animate-fade-in pt-32 pb-20">
      <BackgroundGrid />
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-pink-500/20 bg-pink-500/10">
            <FaHeart className="text-3xl text-pink-400" />
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl">Support Yasumu</h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Yasumu is a{' '}
            <Link
              className="font-bold text-white underline hover:text-white/80"
              href="https://github.com/neplextech/yasumu"
              target="_blank"
              rel="noopener noreferrer"
            >
              100% free and open source
            </Link>{' '}
            project maintained by a small team of developers from{' '}
            <Link
              href="https://wikipedia.org/wiki/Nepal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bold text-white hover:text-white/80 hover:underline"
            >
              Nepal <Nepal className="size-4" />
            </Link>
            . Your support helps us maintain and improve the project, add new features, and keep it accessible to
            everyone.
          </p>
        </div>

        <div className="mx-auto mb-20 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
          {sponsorOptions.map((option) => (
            <a
              key={option.name}
              href={option.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
            >
              {option.badge && (
                <span className="absolute top-4 right-4 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
                  {option.badge}
                </span>
              )}
              <div
                className={`mb-6 flex h-12 w-12 items-center justify-center rounded-lg border text-2xl transition-transform duration-300 group-hover:scale-110 ${colorClasses[option.color]}`}
              >
                {option.icon}
              </div>
              <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
                {option.name}
                <FaArrowRight className="text-sm opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">{option.description}</p>
            </a>
          ))}
        </div>

        <div className="mx-auto mb-20 max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-2xl font-bold text-white">Other Ways to Contribute</h2>
            <p className="text-text-secondary">Not able to donate? No problem! Here are other ways you can help.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {contributeOptions.map((option) => (
              <a
                key={option.title}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div
                  className={`mt-0.5 text-xl ${option.color} transition-transform duration-300 group-hover:scale-110`}
                >
                  {option.icon}
                </div>
                <div>
                  <h4 className="mb-1 flex items-center gap-2 text-sm font-medium text-white">
                    {option.title}
                    <FaArrowRight className="text-[10px] opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </h4>
                  <p className="text-text-secondary text-xs">{option.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-3xl rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
              <MdCode className="text-xl text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Why Sponsor?</h3>
          </div>
          <div className="text-text-secondary grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
            <div className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400"></span>
              <p>
                <strong className="text-gray-200">Sustainable Development</strong> — Your contributions help cover
                hosting, infrastructure, and development costs.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400"></span>
              <p>
                <strong className="text-gray-200">Direct Support</strong> — Sponsors get direct support and
                communication with the development team.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400"></span>
              <p>
                <strong className="text-gray-200">Feature Priority</strong> — Sponsors get a voice in shaping the
                roadmap and prioritizing new features.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400"></span>
              <p>
                <strong className="text-gray-200">Keep It Free</strong> — Your support ensures Yasumu remains free and
                open source for everyone.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <p className="inline-flex items-center gap-2 text-sm text-gray-500">
              Every contribution, big or small, makes a difference. Thank you for supporting open source!{' '}
              <FaHeart className="animate-pulse text-pink-400" />
            </p>
            <a
              href="https://github.com/neplextech/yasumu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-white"
            >
              <FaGithub className="text-sm" />
              <span>github.com/neplextech/yasumu</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
