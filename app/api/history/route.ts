// FILE: app/api/history/route.ts
// MỤC TIÊU: Lấy danh sách Lịch sử Bán Hàng

import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    try {
        // 1. Xác thực
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }

        // 2. Lấy dữ liệu
        // RLS (Bảo mật) đã được kích hoạt:
        // - Admin thấy tất cả.
        // - User chỉ thấy của mình.
        const { data, error } = await supabase
            .from('history')
            .select('*')
            .order('soldAt', { ascending: false });

        if (error) throw error;
        return NextResponse.json({ data: data }); // Trả về { data: [...] }

    } catch (err: any) {
        console.error('Lỗi /api/history (GET):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

