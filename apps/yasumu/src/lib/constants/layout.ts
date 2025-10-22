import { BsLayoutThreeColumns } from 'react-icons/bs';
import { IconType } from 'react-icons/lib';
import { VscLayoutPanelRight } from 'react-icons/vsc';

export const YasumuLayout = {
  Classic: 'classic',
  Default: 'default',
} as const;

export type YasumuLayout = (typeof YasumuLayout)[keyof typeof YasumuLayout];

export const YasumuLayoutList = Object.keys(YasumuLayout) as [
  keyof typeof YasumuLayout,
];

export const YasumuLayoutIcons = {
  [YasumuLayout.Classic]: VscLayoutPanelRight,
  [YasumuLayout.Default]: BsLayoutThreeColumns,
} as Record<YasumuLayout, IconType>;
