import type { resources } from './index';

type Resources = (typeof resources)['en'];

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: Resources;
  }
}
