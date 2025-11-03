// FILE: app/api/employees/[id]/route.ts
// MỤC TIÊU: Sửa (PUT) và Xóa (DELETE) 1 Nhân viên (Chỉ Admin)

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

// === SỬA NHÂN VIÊN (PUT) ===
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    const { id } = params; // ID của nhân viên cần sửa

    try {
        if (!(await isAdmin(supabase))) {
            return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
        }

        const { username, password, role, full_name, ...otherProfileData } = await request.json();
        
        if (!username || !role) {
            return NextResponse.json({ error: 'Tên đăng nhập và quyền là bắt buộc.' }, { status: 400 });
        }
        if (password && password.length < 6) {
            return NextResponse.json({ error: 'Mật khẩu mới (nếu nhập) phải có ít nhất 6 ký tự.' }, { status: 400 });
        }

        // 1. Cập nhật Bảng 'employees'
        const { data, error: profileError } = await supabase
            .from('employees')
            .update({
                username,
                role,
                full_name,
                ...otherProfileData
            })
            .eq('id', id)
            .select('id, username, role, full_name')
            .single();

        if (profileError) throw profileError;

        // 2. Cập nhật Bảng 'auth.users' (nếu có đổi mật khẩu hoặc email)
        if (password || username !== data.username) {
            const supabaseAdmin = createServerClient(cookieStore, {
                isSingleton: false,
                name: 'supabase-admin',
                options: { global: { headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}` } } },
            });
            
            const authUpdateData: any = { email: username };
            if (password) authUpdateData.password = password;
            
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdateData);
            if (authError) throw authError;
        }

        return NextResponse.json(data);

    } catch (err: any) {
        if (err.message.includes('unique constraint')) {
            return NextResponse.json({ error: 'Email (Tên đăng nhập) đã tồn tại.' }, { status: 409 });
        }
        console.error('Lỗi /api/employees/[id] (PUT):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// === XÓA NHÂN VIÊN (DELETE) ===
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    const { id } = params; // ID của nhân viên cần xóa

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }
        if (!(await isAdmin(supabase))) {
            return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
        }
        if (id === session.user.id) {
            return NextResponse.json({ error: 'Không thể tự xóa chính mình.' }, { status: 403 });
        }
        
        // Cần Admin client (service_key) để xóa user
        const supabaseAdmin = createServerClient(cookieStore, {
            isSingleton: false,
            name: 'supabase-admin',
            options: { global: { headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}` } } },
        });

        // 1. Xóa user khỏi Supabase Auth (Bảng 'employees' sẽ tự động xóa theo ON DELETE CASCADE)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        
        if (error) throw error;

        return NextResponse.json({ message: 'Đã xóa nhân viên thành công.' });

    } catch (err: any) {
        console.error('Lỗi /api/employees/[id] (DELETE):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

