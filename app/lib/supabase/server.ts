// FILE: app/lib/supabase/server.ts
// MỤC TIÊU: Tạo 1 Supabase client an toàn để dùng trong Backend (API Routes / Serverless Functions)
// Nó sẽ đọc cookie từ request.

import { createServerClient as createServerClientLib } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServer() {
  const cookieStore = cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL hoặc Anon Key chưa được cài đặt.')
  }

  return createServerClientLib(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      // (Không cần set/remove ở đây vì API route chỉ đọc)
    },
  })
}

// Alias export để tương thích với các file đang import createServerClient
export const createServerClient = createServer
