import Link from 'next/link';
import { BackgroundGrid } from '../../components/background-grid';
import {
  FaHeart,
  FaPatreon,
  FaArrowRight,
  FaGithub,
  FaStar,
  FaCodeBranch,
} from 'react-icons/fa6';
import { GiDumpling } from 'react-icons/gi';
import { MdCode, MdBugReport, MdTranslate } from 'react-icons/md';
import Nepal from 'components/nepal-flag';

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
    description:
      'Make a one-time donation via Stripe (International) or eSewa/Khalti/ConnectIPS (Nepal).',
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
  orange:
    'bg-orange-500/10 text-orange-400 border-orange-500/20 group-hover:border-orange-500/40',
  gray: 'bg-gray-500/10 text-gray-200 border-gray-500/20 group-hover:border-gray-500/40',
};

export default function Sponsor() {
  return (
    <div className="animate-fade-in pt-32 pb-20">
      <BackgroundGrid />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 mb-8">
            <FaHeart className="text-3xl text-pink-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
            Support Yasumu
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Yasumu is a{' '}
            <Link
              className="text-white hover:text-white/80 font-bold underline"
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
              className="inline-flex items-center gap-2 text-white hover:text-white/80 font-bold hover:underline"
            >
              Nepal <Nepal className="size-4" />
            </Link>
            . Your support helps us maintain and improve the project, add new
            features, and keep it accessible to everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-20">
          {sponsorOptions.map((option) => (
            <a
              key={option.name}
              href={option.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-white/[0.02] border border-white/5 p-8 rounded-xl hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
            >
              {option.badge && (
                <span className="absolute top-4 right-4 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded bg-white/5 text-gray-400 border border-white/10">
                  {option.badge}
                </span>
              )}
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border text-2xl ${colorClasses[option.color]}`}
              >
                {option.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                {option.name}
                <FaArrowRight className="text-sm opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {option.description}
              </p>
            </a>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">
              Other Ways to Contribute
            </h2>
            <p className="text-text-secondary">
              Not able to donate? No problem! Here are other ways you can help.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contributeOptions.map((option) => (
              <a
                key={option.title}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
              >
                <div
                  className={`text-xl mt-0.5 ${option.color} group-hover:scale-110 transition-transform duration-300`}
                >
                  {option.icon}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
                    {option.title}
                    <FaArrowRight className="text-[10px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
                  </h4>
                  <p className="text-xs text-text-secondary">
                    {option.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <MdCode className="text-xl text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Why Sponsor?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-text-secondary">
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
              <p>
                <strong className="text-gray-200">
                  Sustainable Development
                </strong>{' '}
                — Your contributions help cover hosting, infrastructure, and
                development costs.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 shrink-0"></span>
              <p>
                <strong className="text-gray-200">Direct Support</strong> —
                Sponsors get direct support and communication with the
                development team.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0"></span>
              <p>
                <strong className="text-gray-200">Feature Priority</strong> —
                Sponsors get a voice in shaping the roadmap and prioritizing new
                features.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0"></span>
              <p>
                <strong className="text-gray-200">Keep It Free</strong> — Your
                support ensures Yasumu remains free and open source for
                everyone.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <p className="text-sm text-gray-500 inline-flex items-center gap-2">
              Every contribution, big or small, makes a difference. Thank you
              for supporting open source!{' '}
              <FaHeart className="text-pink-400 animate-pulse" />
            </p>
            <a
              href="https://github.com/neplextech/yasumu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors"
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
