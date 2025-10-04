// import { formats } from '@/i18n/request';
import messages from './translations/en.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: 'en';
    Messages: typeof messages;
    Formats: undefined;
  }
}
