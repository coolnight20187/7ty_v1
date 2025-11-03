// FILE: app/api/check-bill-port1/route.ts
// MỤC TIÊU: Thay thế /api/get-bill (Cổng 1) trong server.js cũ.
// API này SẼ BỊ CHẶN nếu API_COOKIE và API_CSRF_TOKEN hết hạn.

import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Lấy các biến môi trường (từ Netlify)
const {
    API_BASE_URL,
    API_GET_BILL_PATH,
    API_COOKIE,
    API_CSRF_TOKEN
} = process.env;

// Hàm helper
const nowSec = () => Math.floor(Date.now() / 1000).toString();

export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // 1. Xác thực người dùng (giống 'isAuthenticated')
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    // 2. Lấy payload từ app/page.tsx
    const { account, product_id } = await request.json();
    if (!account || !product_id) {
        return NextResponse.json({ error: 'Thiếu account hoặc product_id' }, { status: 400 });
    }

    // Kiểm tra biến môi trường (rất quan trọng)
    if (!API_BASE_URL || !API_GET_BILL_PATH || !API_COOKIE || !API_CSRF_TOKEN) {
        console.error('SERVERLESS: Thiếu biến Cổng 1 (API_BASE_URL, API_COOKIE...)');
        return NextResponse.json({ error: 'Lỗi cấu hình Cổng 1 trên server' }, { status: 500 });
    }

    const payload = { account, product_id, custom_bill_amount: '', province: '', configurable: true };

    try {
        // 3. Gọi API Dailyshopee (giống hệt server.js cũ)
        const upstream = await fetch(new URL(API_GET_BILL_PATH, API_BASE_URL).toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'a-csrftoken': API_CSRF_TOKEN,
                'a-from': 'APC-js', 'a-lang': 'vi', 'a-os': 'web',
                'a-timestamp': nowSec(),
                'Cookie': API_COOKIE,
                'Origin': API_BASE_URL,
                'Referer': `${API_BASE_URL}/`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
            },
            body: JSON.stringify(payload)
        });

        const ct = upstream.headers.get('content-type') || '';
        const responseText = await upstream.text();

        // 4. Xử lý lỗi (Nếu Dailyshopee chặn và trả về HTML/rỗng)
        if (!ct.includes('application/json')) {
            return NextResponse.json({ error: 'Lỗi từ API Cổng 1 (Có thể bị chặn hoặc token hết hạn)', details: responseText || 'Phản hồi không phải JSON' }, { status: upstream.status });
        }
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseErr: any) {
            console.error('Lỗi parse JSON Cổng 1:', parseErr.message, 'Response text:', responseText);
            return NextResponse.json({ error: 'API Cổng 1 trả về JSON không hợp lệ (có thể là rỗng)', details: parseErr.message }, { status: 500 });
        }
        
        // 5. Trả về thành công
        return NextResponse.json(data, { status: upstream.status });

    } catch (err: any) {
        console.error('Error in /api/check-bill-port1 (fetch):', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

