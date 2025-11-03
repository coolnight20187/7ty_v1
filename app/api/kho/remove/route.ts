// FILE: app/api/kho/remove/route.ts
// MỤC TIÊU: Xử lý POST (Remove) cho KHO

import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    try {
        // 1. Xác thực & Kiểm tra quyền Admin
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }
        
        // Lấy role từ bảng employees
        const { data: employeeData } = await supabase
            .from('employees')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (employeeData?.role !== 'admin') {
            return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
        }

        // 2. Lấy keys
        const { keys } = await request.json();
        if (!Array.isArray(keys) || !keys.length) {
            return NextResponse.json({ error: 'Thiếu keys' }, { status: 400 });
        }

        // 3. Xóa
        // Admin có quyền xóa bill của bất kỳ ai (nhờ RLS Policy)
        const { error, count } = await supabase
            .from('kho')
            .delete()
            .in('key', keys);
        
        if (error) throw error;

        // 4. Trả về
        return NextResponse.json({ ok: true, removed: count || 0 });

    } catch (err: any) {
        console.error('Lỗi /api/kho/remove (POST):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

