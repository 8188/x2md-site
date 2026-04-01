/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_X2MD_VERSION?: string;
  readonly PUBLIC_CONVERT_API_BASE?: string;
  readonly PUBLIC_CREEM_BASIC_URL?: string;
  readonly PUBLIC_CREEM_PRO_URL?: string;
  readonly PUBLIC_CREEM_LIFETIME_URL?: string;
  readonly PUBLIC_ADSENSE_CLIENT?: string;
  readonly PUBLIC_ADSENSE_SCRIPT_SRC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
