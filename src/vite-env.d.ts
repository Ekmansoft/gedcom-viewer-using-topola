/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GENI_CLIENT_ID?: string;
  readonly VITE_GENI_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
