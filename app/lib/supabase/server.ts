// FILE: app/lib/supabase/server.ts
import { createServerClient as createServerClientLib } from '@supabase/ssr'
import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies' // optional type
import { cookies } from 'next/headers'

export function createServer(cookieStore?: ReturnType<typeof cookies>) {
  const store = cookieStore ?? cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL hoặc Anon Key chưa được cài đặt.')
  }

  return createServerClientLib(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value
      },
    },
  })
}

// Giữ tên export được dùng khắp project
export const createServerClient = createServer
