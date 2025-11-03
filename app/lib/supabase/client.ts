// FILE: lib/supabase/client.ts
// MỤC TIÊU: Tạo 1 Supabase client an toàn để dùng trong Frontend (các file 'use client')
// Nó sẽ tự động đọc các biến NEXT_PUBLIC_...

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Lấy biến môi trường (đã được nạp bởi Next.js)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL hoặc Anon Key chưa được cài đặt trong .env.local');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

