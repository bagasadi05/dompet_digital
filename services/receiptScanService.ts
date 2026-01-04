/**
 * Receipt Scanning Service
 * Uses OpenRouter multimodal API to extract data from receipt images
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const VISION_MODEL = 'google/gemini-2.0-flash-001'; // Free multimodal model

export interface ReceiptItem {
    name: string;
    price: number;
    quantity?: number;
}

export interface ReceiptScanResult {
    success: boolean;
    merchant?: string;
    date?: string;
    items?: ReceiptItem[];
    total?: number;
    suggestedCategory?: string;
    error?: string;
}

const SCAN_PROMPT = `Kamu adalah asisten yang mengekstrak data dari struk/nota belanja.

Analisis gambar struk ini dan ekstrak informasi berikut dalam format JSON:
{
  "merchant": "Nama toko/merchant",
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "Nama item", "price": 0, "quantity": 1 }
  ],
  "total": 0,
  "suggestedCategory": "Kategori yang sesuai"
}

Kategori yang tersedia:
- Makanan & Minuman
- Transportasi
- Tagihan & Utilitas
- Hiburan
- Belanja
- Kesehatan
- Lainnya

PENTING:
- Harga dalam Rupiah (angka saja tanpa formatting)
- Jika tidak bisa membaca item, masukkan sebagai "Item tidak terbaca"
- Jika bukan struk, return { "error": "Bukan gambar struk" }
- HANYA return JSON, tanpa markdown atau penjelasan lain`;

export async function scanReceipt(imageBase64: string): Promise<ReceiptScanResult> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
        return { success: false, error: 'API Key tidak ditemukan' };
    }

    try {
        // Ensure base64 has proper data URI prefix
        const imageData = imageBase64.startsWith('data:')
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`;

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Dompet Digital - Receipt Scanner'
            },
            body: JSON.stringify({
                model: VISION_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: SCAN_PROMPT },
                            { type: 'image_url', image_url: { url: imageData } }
                        ]
                    }
                ],
                temperature: 0.1,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Receipt Scan] API Error:', errorText);
            return { success: false, error: `API Error: ${response.status}` };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { success: false, error: 'Gagal parsing hasil scan' };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.error) {
            return { success: false, error: parsed.error };
        }

        return {
            success: true,
            merchant: parsed.merchant,
            date: parsed.date,
            items: parsed.items || [],
            total: parsed.total || 0,
            suggestedCategory: parsed.suggestedCategory || 'Lainnya'
        };
    } catch (error: any) {
        console.error('[Receipt Scan] Error:', error);
        return { success: false, error: error.message || 'Terjadi kesalahan saat scan' };
    }
}

/**
 * Converts File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
