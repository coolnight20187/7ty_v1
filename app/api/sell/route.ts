// FILE: app/api/sell/route.ts
// MỤC TIÊU: Xử lý logic Bán Hàng (chuyển từ Kho sang Lịch sử)

import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    try {
        // 1. Xác thực người dùng
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }
        const userId = session.user.id;
        
        // Lấy username/email từ bảng employees (do email có thể bị thay đổi)
        const { data: employee } = await supabase
            .from('employees')
            .select('username')
            .eq('id', userId)
            .single();

        const employeeUsername = employee?.username || session.user.email; // Lấy email làm dự phòng

        // 2. Lấy dữ liệu từ frontend
        const { memberId, memberName, keys, soldAt } = await request.json();
        if (!memberId || !Array.isArray(keys) || !keys.length || !soldAt) {
            return NextResponse.json({ error: 'Thiếu memberId, keys hoặc soldAt' }, { status: 400 });
        }

        // 3. Lấy các bill trong kho (chỉ lấy của user này - RLS đã bảo vệ)
        const { data: billsToSell, error: fetchError } = await supabase
            .from('kho')
            .select('*')
            .in('key', keys)
            .is('xuatAt', null); // Đảm bảo bill chưa bị bán

        if (fetchError) throw fetchError;
        
        // 4. Kiểm tra xem có bill nào bị thiếu không
        if (billsToSell.length !== keys.length) {
            const foundKeys = new Set(billsToSell.map(b => b.key));
            const missingKeys = keys.filter(k => !foundKeys.has(k));
            throw new Error(`Một số Bill không tìm thấy hoặc đã được bán/xóa: ${missingKeys.join(', ')}`);
        }

        // 5. Chuẩn bị dữ liệu cho bảng 'history'
        const historyEntries = billsToSell.map(b => ({
            account: b.account,
            provider_id: b.provider_id,
            name: b.name,
            address: b.address,
            amount_current: b.amount_current,
            amount_previous: b.amount_previous,
            total: b.total,
            nhapAt: b.nhapAt,
            xuatAt: soldAt, // Ngày xuất = Ngày bán
            soldAt: soldAt,  // Ngày bán
            memberId: memberId,
            memberName: memberName,
            raw: b.raw,
            employee_id: userId,
            employee_username: employeeUsername,
            user_id: userId // Quan trọng cho RLS
        }));

        // 6. Insert vào 'history'
        const { error: insertError } = await supabase
            .from('history')
            .insert(historyEntries);

        if (insertError) throw insertError;

        // 7. Cập nhật (đánh dấu) 'kho' là đã xuất
        const { error: updateError, count } = await supabase
            .from('kho')
            .update({ xuatAt: soldAt })
            .in('key', keys);
            // RLS đã tự lọc user_id

        if (updateError) throw updateError;
        
        return NextResponse.json({ ok: true, sold_count: count || 0, sold: historyEntries });

    } catch (err: any) {
        console.error('Lỗi /api/sell (Transaction):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

