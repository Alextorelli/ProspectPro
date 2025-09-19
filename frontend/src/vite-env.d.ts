/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_EDGE_FUNCTIONS_URL?: string
  readonly VITE_GOOGLE_PLACES_API_KEY?: string
  readonly VITE_HUNTER_IO_API_KEY?: string
  readonly VITE_ZEROBOUNCE_API_KEY?: string
  readonly VITE_ENABLE_ADMIN_PANEL?: string
  readonly VITE_ENABLE_DEBUG_MODE?: string
  readonly VITE_DEFAULT_BUDGET_LIMIT?: string
  readonly VITE_WARNING_THRESHOLD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}