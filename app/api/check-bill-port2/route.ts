// FILE: app/api/check-bill-port2/route.ts
// MỤC TIÊU: Gọi API Cổng 2 (7ty.vn). API này ổn định và không cần cookie.

import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Lấy các biến môi trường (từ Netlify)
const {
    API_CHECK_BILL_BASE_URL, // https://bill.7ty.vn
    API_CHECK_BILL_PATH      // /api/check-electricity
} = process.env;

export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // 1. Xác thực người dùng
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    // 2. Lấy payload (account chính là contract_number)
    const { account, sku } = await request.json();
    if (!account || !sku) {
        return NextResponse.json({ error: 'Thiếu account (contract_number) hoặc sku' }, { status: 400 });
    }

    // Kiểm tra biến môi trường
    if (!API_CHECK_BILL_BASE_URL || !API_CHECK_BILL_PATH) {
        console.error('SERVERLESS: Thiếu biến Cổng 2 (API_CHECK_BILL_BASE_URL, API_CHECK_BILL_PATH)');
        return NextResponse.json({ error: 'Lỗi cấu hình Cổng 2 trên server' }, { status: 500 });
    }

    const payload = {
        contract_number: account,
        sku: sku
    };

    try {
        // 3. Gọi API 7ty.vn
        const upstream = await fetch(
            new URL(API_CHECK_BILL_PATH, API_CHECK_BILL_BASE_URL).toString(),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(30000) // Timeout 30 giây
            }
        );

        const ct = upstream.headers.get('content-type') || '';
        const responseText = await upstream.text();

        if (!ct.includes('application/json')) {
            return NextResponse.json({ error: 'Lỗi từ API Cổng 2', details: responseText || 'Phản hồi không phải JSON' }, { status: upstream.status });
        }

        let data;
        try { data = JSON.parse(responseText); }
        catch (parseErr: any) {
            console.error('Lỗi parse JSON Cổng 2:', parseErr.message, 'Response text:', responseText);
            return NextResponse.json({ error: 'API Cổng 2 trả về JSON không hợp lệ (có thể là rỗng)', details: parseErr.message }, { status: 500 });
        }
        
        // 4. Trả về (kể cả khi API 7ty.vn báo lỗi, vẫn trả về JSON)
        return NextResponse.json(data, { status: upstream.status });

    } catch (err: any) {
        console.error('Error in /api/check-bill-port2 (fetch):', err);
        if (err.name === 'AbortError') {
            return NextResponse.json({ error: 'Gateway Timeout (API Cổng 2 không phản hồi)' }, { status: 504 });
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

