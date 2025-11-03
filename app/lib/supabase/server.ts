// FILE: app/lib/supabase/server.ts
// MỤC TIÊU: Tạo Supabase client an toàn cho Backend (API routes / server components).
// Hỗ trợ:
//  - createServerClient()                     -> dùng cookies() nội bộ
//  - createServerClient(cookieStore)          -> dùng cookieStore truyền vào
//  - createServerClient(cookieStore, options) -> tạo client với tuỳ chọn (vd. isSingleton/name/options)
//  - createAdminClient()                      -> tạo client dùng SUPABASE_SERVICE_ROLE_KEY (admin)

import { createServerClient as createServerClientLib } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

type CookieStore = ReturnType<typeof cookies>
type AdminOptions = {
  isSingleton?: boolean
  name?: string
  options?: { global?: { headers?: Record<string, string> } }
}

/**
 * Tạo Supabase server client.
 * @param cookieStore optional - nếu không truyền sẽ dùng cookies() từ next/headers
 * @param opt optional - tuỳ chọn không bắt buộc (dùng khi muốn override headers / singleton)
 */
export function createServerClient(
  cookieStore?: CookieStore,
  opt?: AdminOptions
): ReturnType<typeof createServerClientLib> {
  const store = cookieStore ?? cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL hoặc Anon Key chưa được cài đặt.')
  }

  // Nếu caller truyền options.options.global.headers, merge vào config headers
  const clientOptions: any = {}
  if (opt?.options?.global) {
    clientOptions.global = opt.options.global
  }

  return createServerClientLib(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value
      },
    },
    ...(clientOptions.global ? { global: clientOptions.global } : {}),
  } as any)
}

/**
 * Tạo Supabase admin client sử dụng SUPABASE_SERVICE_ROLE_KEY.
 * Dùng khi cần quyền cao (ví dụ thay đổi auth.users). Chỉ dùng trong server environment.
 */
export function createAdminClient(
  cookieStore?: CookieStore,
  opt?: AdminOptions
): ReturnType<typeof createServerClientLib> {
  const store = cookieStore ?? cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRole) {
    throw new Error('Supabase URL hoặc Service Role Key chưa được cài đặt.')
  }

  // tạo client sử dụng service role key bằng cách truyền header Authorization
  const globalHeaders = {
    Authorization: `Bearer ${serviceRole}`,
    ...(opt?.options?.global?.headers ?? {}),
  }

  return createServerClientLib(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value
      },
    },
    global: { headers: globalHeaders },
  } as any)
}

// Giữ alias cũ nếu code khác vẫn import createServerClient từ file này
export { createServerClient as createServer }
