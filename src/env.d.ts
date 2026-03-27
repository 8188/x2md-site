/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_CONVERT_API_BASE?: string;
  readonly PUBLIC_RELEASES_API?: string;
  readonly PUBLIC_CREEM_BASIC_URL?: string;
  readonly PUBLIC_CREEM_PRO_URL?: string;
  readonly PUBLIC_CREEM_LIFETIME_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
