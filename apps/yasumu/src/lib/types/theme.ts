export interface YasumuThemeVariables {
  background?: string;
  foreground?: string;
  card?: string;
  'card-foreground'?: string;
  popover?: string;
  'popover-foreground'?: string;
  primary?: string;
  'primary-foreground'?: string;
  secondary?: string;
  'secondary-foreground'?: string;
  muted?: string;
  'muted-foreground'?: string;
  accent?: string;
  'accent-foreground'?: string;
  destructive?: string;
  'destructive-foreground'?: string;
  border?: string;
  input?: string;
  ring?: string;
  'chart-1'?: string;
  'chart-2'?: string;
  'chart-3'?: string;
  'chart-4'?: string;
  'chart-5'?: string;
  sidebar?: string;
  'sidebar-foreground'?: string;
  'sidebar-primary'?: string;
  'sidebar-primary-foreground'?: string;
  'sidebar-accent'?: string;
  'sidebar-accent-foreground'?: string;
  'sidebar-border'?: string;
  'sidebar-ring'?: string;
  'font-sans'?: string;
  'font-serif'?: string;
  'font-mono'?: string;
  radius?: string;
  'shadow-2xs'?: string;
  'shadow-xs'?: string;
  'shadow-sm'?: string;
  shadow?: string;
  'shadow-md'?: string;
  'shadow-lg'?: string;
  'shadow-xl'?: string;
  'shadow-2xl'?: string;
}

export interface YasumuThemeConfig {
  id: string;
  name: string;
  type: 'light' | 'dark';
  variables: YasumuThemeVariables;
}

export interface YasumuThemeFile {
  themes: YasumuThemeConfig[];
}
