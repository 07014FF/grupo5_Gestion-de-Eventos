declare module 'https://deno.land/std@0.177.0/http/server.ts' {
  export type ServeHandler = (request: Request) => Response | Promise<Response>;

  export interface ServeOptions {
    port?: number;
    hostname?: string;
    signal?: AbortSignal;
  }

  export function serve(handler: ServeHandler, options?: ServeOptions): Promise<void>;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}

interface DenoEnv {
  get(key: string): string | undefined;
}

declare const Deno: {
  env: DenoEnv;
};
