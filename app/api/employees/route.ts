// FILE: app/api/employees/route.ts
// MỤC TIÊU: Lấy DS Nhân viên, Thêm Nhân viên (Chỉ Admin)

import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Hàm helper kiểm tra Admin (sẽ dùng trong nhiều API)
async function isAdmin(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data, error } = await supabase
        .from('employees')
        .select('role')
        .eq('id', user.id)
        .single();
        
    return !error && data && data.role === 'admin';
}

// === LẤY DANH SÁCH NHÂN VIÊN (GET) ===
export async function GET(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    try {
        if (!(await isAdmin(supabase))) {
            return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
        }
        
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let query = supabase.from('employees').select('id, username, role, full_name, phone, address, avatar_url, company_name, tax_code');
        
        if (search) {
            query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`);
        }
        
        const { data, error } = await query.order('username');

        if (error) throw error;
        return NextResponse.json(data); // Trả về mảng [...]

    } catch (err: any) {
        console.error('Lỗi /api/employees (GET):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// === THÊM NHÂN VIÊN MỚI (POST) ===
export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    
    // Tạo 1 client Admin đặc biệt (dùng service_key) để TẠO USER MỚI
    // Vì chỉ Admin (service_role) mới có quyền tạo user.
    const supabaseAdmin = createServerClient(cookieStore, {
        isSingleton: false,
        name: 'supabase-admin',
        options: {
            global: {
                headers: {
                    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
                },
            },
        },
    });

    try {
        if (!(await isAdmin(supabase))) {
            return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
        }

        const { username, password, role, full_name, ...otherProfileData } = await request.json();
        
        if (!username || !password || password.length < 6 || !role) {
            return NextResponse.json({ error: 'Email (Tên đăng nhập), Mật khẩu (>= 6 ký tự) và Quyền là bắt buộc.' }, { status: 400 });
        }
        
        // 1. Tạo user trong Supabase Auth (dùng Admin client)
        const { data: authData, error: authError } = await supabaseAdmin.auth.createUser({
            email: username,
            password: password,
            email_confirm: true, // Tự động xác nhận email
            app_metadata: {
                role: role, // Metadata cho RLS
                provider: 'email'
            },
            user_metadata: {
                full_name: full_name // Metadata cho dễ nhìn
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Không thể tạo user trong Auth");

        // 2. Hàm Trigger (trong SQL) sẽ tự động chạy và tạo dòng trong 'public.employees'.
        //    Giờ chúng ta chỉ cần CẬP NHẬT (UPDATE) dòng đó với thông tin thêm.
        
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('employees')
            .update({
                full_name: full_name,
                role: role, // Cập nhật role (quan trọng)
                ...otherProfileData // Cập nhật sđt, địa chỉ...
            })
            .eq('id', authData.user.id)
            .select('id, username, role, full_name')
            .single();
            
        if (profileError) throw profileError;

        return NextResponse.json(profileData, { status: 201 });

    } catch (err: any) {
        if (err.message.includes('unique constraint')) {
            return NextResponse.json({ error: 'Email (Tên đăng nhập) đã tồn tại.' }, { status: 409 });
        }
        console.error('Lỗi /api/employees (POST):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

