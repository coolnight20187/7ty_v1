// FILE: app/api/employees/[id]/notes/route.ts
// MỤC TIÊU: Lấy (GET) và Thêm (POST) ghi chú cho 1 nhân viên [id]

import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Hàm helper kiểm tra Admin
async function isAdmin(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from('employees').select('role').eq('id', user.id).single();
    return data?.role === 'admin';
}

// === LẤY GHI CHÚ (GET) ===
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    const { id: employee_id } = params; // ID của nhân viên

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }
        
        // RLS: Admin thấy mọi ghi chú, User chỉ thấy ghi chú của mình
        const { data, error } = await supabase
            .from('work_notes')
            .select('*')
            .eq('employee_id', employee_id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return NextResponse.json(data);

    } catch (err: any) {
        console.error('Lỗi /api/employees/[id]/notes (GET):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// === THÊM GHI CHÚ (POST) ===
export async function POST(request: Request, { params }: { params: { id: string } }) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    const { id: employee_id } = params; // ID của nhân viên bị ghi chú

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }
        
        // Chỉ Admin mới được thêm ghi chú
        if (!(await isAdmin(supabase))) {
            return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
        }
        
        const author_id = session.user.id;
        const author_username = session.user.email; // Lấy email của Admin
        const { note_text } = await request.json();

        if (!note_text) {
            return NextResponse.json({ error: 'Nội dung ghi chú là bắt buộc.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('work_notes')
            .insert({
                employee_id,
                author_id,
                author_username,
                note_text
            })
            .select()
            .single();
            
        if (error) throw error;
        return NextResponse.json(data, { status: 201 });

    } catch (err: any) {
        console.error('Lỗi /api/employees/[id]/notes (POST):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

