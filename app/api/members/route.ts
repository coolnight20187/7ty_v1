// FILE: app/api/members/route.ts
// MỤC TIÊU: Xử lý GET (List) và POST (Add) cho Khách Hàng Thẻ

import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// === LẤY DANH SÁCH KHT (GET) ===
export async function GET() {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }
        
        // RLS (Bảo mật Cấp độ Hàng) đã được kích hoạt trên Supabase
        // nên truy vấn này sẽ tự động:
        // - Trả về TẤT CẢ KHT nếu là Admin
        // - Chỉ trả về KHT của user đó nếu là User
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('name');
            
        if (error) throw error;
        return NextResponse.json(data);
        
    } catch (err: any) {
        console.error('Lỗi /api/members (GET):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// === THÊM KHT (POST) ===
export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }
        const userId = session.user.id;

        const { name, zalo, bank } = await request.json();
        if (!name) {
            return NextResponse.json({ error: 'Thiếu tên' }, { status: 400 });
        }

        // RLS sẽ tự động thêm user_id (hoặc thất bại nếu user_id không khớp)
        const { data, error } = await supabase
            .from('members')
            .insert({ 
                name, 
                zalo: zalo || '', 
                bank: bank || '',
                user_id: userId // Thêm user_id
            })
            .select()
            .single(); // Trả về 1 đối tượng thay vì mảng

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });

    } catch (err: any) {
        console.error('Lỗi /api/members (POST):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

