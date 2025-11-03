// FILE: middleware.ts
// MỤC TIÊU: Chặn người dùng chưa đăng nhập và chuyển hướng họ đến trang /login

import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 1. Cập nhật (làm mới) session của Supabase
  const response = await updateSession(request)

  // 2. Lấy thông tin người dùng từ session vừa làm mới
  const supabase = response.supabase // Giả định updateSession trả về supabase instance
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 3. Logic chuyển hướng
  if (!user && pathname !== '/login') {
    // Nếu CHƯA đăng nhập VÀ KHÔNG đang ở trang login
    // -> Chuyển hướng về trang /login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
    
  } else if (user && pathname === '/login') {
    // Nếu ĐÃ đăng nhập VÀ đang ở trang /login
    // -> Chuyển hướng về trang chủ '/'
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 4. Nếu hợp lệ, cho phép truy cập
  return response
}

// Cấu hình: Áp dụng middleware này cho mọi trang,
// TRỪ các file tĩnh (_next/static), file hình (favicon.ico)...
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

