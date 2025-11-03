// FILE: app/api/kho/route.ts
// MỤC TIÊU: Xử lý GET (List) và POST (Import) cho KHO

import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// === LẤY DANH SÁCH KHO (GET) ===
export async function GET() {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    try {
        // 1. Xác thực
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }
        const userId = session.user.id;

        // 2. Truy vấn (Đã được bảo vệ bởi RLS - Row Level Security)
        // RLS Policy (từ file SQL) sẽ tự động lọc `WHERE user_id = auth.uid()`
        const { data, error } = await supabase
            .from('kho')
            .select('*')
            .is('xuatAt', null) // Chỉ lấy bill chưa xuất
            // .eq('user_id', userId) // ** SỬA: Không cần dòng này vì RLS đã làm **
            .order('nhapAt', { ascending: false });

        if (error) throw error;

        // 3. Trả về
        return NextResponse.json({ data: data }); // Trả về { data: [...] }

    } catch (err: any) {
        console.error('Lỗi /api/kho/list (GET):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// === NHẬP KHO (POST) ===
export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    try {
        // 1. Xác thực
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }
        const userId = session.user.id;

        // 2. Lấy dữ liệu
        const { bills } = await request.json();
        if (!Array.isArray(bills) || bills.length === 0) {
            return NextResponse.json({ error: 'Thiếu mảng bills' }, { status: 400 });
        }

        // 3. Chuẩn bị dữ liệu để insert (thêm user_id vào mỗi bill)
        // RLS Policy yêu cầu cột user_id phải khớp với người đang đăng nhập
        const billsToInsert = bills.map(b => ({
            key: b.key,
            account: b.account,
            provider_id: b.provider_id,
            name: b.name || '-',
            address: b.address || '-',
            amount_current: String(b.amount_current ?? b.curr ?? '0'),
            amount_previous: String(b.amount_previous ?? b.prev ?? '0'),
            total: String(b.total ?? '0'),
            nhapAt: b.nhap,
            raw: b.raw || {},
            user_id: userId // Quan trọng: Đánh dấu bill này là của user hiện tại
        }));

        // 4. Insert (upsert = true -> ON CONFLICT DO NOTHING)
        const { error, count } = await supabase
            .from('kho')
            .upsert(billsToInsert, { 
                onConflict: 'key', // Nếu key đã tồn tại, bỏ qua
            })
            .select('key', { count: 'exact' }); // Chỉ select để lấy count

        if (error) throw error;

        // 5. Lấy tổng số lượng kho
        const { count: totalCount, error: countError } = await supabase
            .from('kho')
            .select('key', { count: 'exact', head: true })
            .is('xuatAt', null);
            // RLS đã tự lọc theo user_id
        
        if (countError) throw countError;

        // 6. Trả về
        return NextResponse.json({ ok: true, added: count || 0, total: totalCount || 0 });

    } catch (err: any) {
        console.error('Lỗi /api/kho/import (POST):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

