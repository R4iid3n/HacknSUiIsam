/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_EVENT_ID?: string
  readonly VITE_PACKAGE_ID?: string
  readonly VITE_APP_OBJECT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
