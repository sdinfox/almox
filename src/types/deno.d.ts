// Declaração para módulos importados via URL (Deno/ESM)
declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.45.0" {
  import { SupabaseClient } from '@supabase/supabase-js';
  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): SupabaseClient;
  export * from '@supabase/supabase-js';
}

// Declaração para o objeto global Deno
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};