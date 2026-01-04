/**
 * Voice Parser Service
 * Uses AI to parse natural language into transaction data
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface ParsedTransaction {
    success: boolean;
    type?: 'pemasukan' | 'pengeluaran';
    amount?: number;
    description?: string;
    category?: string;
    error?: string;
}

const PARSE_PROMPT = `Kamu adalah parser transaksi keuangan. Ekstrak data dari teks ucapan user.

Return JSON format:
{
  "type": "pemasukan" atau "pengeluaran",
  "amount": angka dalam Rupiah,
  "description": deskripsi singkat,
  "category": salah satu dari kategori di bawah
}

Kategori Pengeluaran:
- Makanan & Minuman
- Transportasi
- Tagihan & Utilitas
- Hiburan
- Belanja
- Kesehatan
- Lainnya

Kategori Pemasukan:
- Gaji
- Tabungan & Investasi
- Lainnya

Contoh:
- "Beli makan siang tiga puluh ribu" → {"type":"pengeluaran","amount":30000,"description":"Makan siang","category":"Makanan & Minuman"}
- "Terima gaji lima juta" → {"type":"pemasukan","amount":5000000,"description":"Gaji bulanan","category":"Gaji"}
- "Bayar grab dua puluh lima ribu" → {"type":"pengeluaran","amount":25000,"description":"Grab","category":"Transportasi"}

PENTING:
- Konversi angka teks ke angka (lima belas ribu = 15000)
- Jika tidak bisa parsing, return {"error": "Tidak bisa memahami"}
- HANYA return JSON, tanpa penjelasan`;

export async function parseVoiceInput(text: string): Promise<ParsedTransaction> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const model = import.meta.env.VITE_OPENROUTER_MODEL || 'xiaomi/mimo-v2-flash:free';

    if (!apiKey) {
        return { success: false, error: 'API Key tidak ditemukan' };
    }

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Dompet Digital - Voice Parser'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: PARSE_PROMPT },
                    { role: 'user', content: text }
                ],
                temperature: 0.1,
                max_tokens: 256
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Voice Parse] API Error:', errorText);
            return { success: false, error: 'Gagal memproses ucapan' };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { success: false, error: 'Gagal parsing hasil' };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.error) {
            return { success: false, error: parsed.error };
        }

        return {
            success: true,
            type: parsed.type,
            amount: parsed.amount,
            description: parsed.description,
            category: parsed.category
        };
    } catch (error: any) {
        console.error('[Voice Parse] Error:', error);
        return { success: false, error: error.message || 'Terjadi kesalahan' };
    }
}
