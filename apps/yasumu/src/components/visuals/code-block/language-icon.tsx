'use client';
import { useMemo } from 'react';
import {
  SiJavascript,
  SiCss3,
  SiHtml5,
  SiJson,
  SiTypescript,
  SiYaml,
  SiReact,
} from 'react-icons/si';
import { BundledLanguage } from 'shiki/bundle/web';

const languageIcons: Record<string, React.FC<{ className?: string }>> = {
  'ts,typescript': SiTypescript,
  'js,javascript': SiJavascript,
  'jsx,javascriptreact,tsx,typescriptreact': SiReact,
  'html,html': SiHtml5,
  'css,css': SiCss3,
  'json,json': SiJson,
  'yaml,yaml': SiYaml,
  'yml,yml': SiYaml,
};

export default function LanguageIcon({
  language,
  className,
}: {
  language: BundledLanguage;
  className?: string;
}) {
  const Component = useMemo(() => {
    const key = Object.keys(languageIcons).find((key) =>
      key.split(',').includes(language.toLowerCase()),
    );
    return key ? languageIcons[key] : null;
  }, [language]);

  if (!Component) return null;

  return <Component className={className} />;
}
