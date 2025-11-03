// FILE: app/api/members/[id]/route.ts
// MỤC TIÊU: Xử lý PUT (Edit) cho 1 Khách Hàng Thẻ

import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    const { id } = params; // Lấy [id] từ URL

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }
        // (RLS sẽ tự động kiểm tra xem user này có quyền sửa [id] này không)

        const { name, zalo, bank } = await request.json();
        if (!name) {
            return NextResponse.json({ error: 'Thiếu tên' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('members')
            .update({ 
                name, 
                zalo: zalo || '', 
                bank: bank || '' 
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: 'Không tìm thấy KHT' }, { status: 404 });
        
        return NextResponse.json(data);

    } catch (err: any) {
        console.error('Lỗi /api/members/[id] (PUT):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

