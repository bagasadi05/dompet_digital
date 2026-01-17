/**
 * Receipt Scanning Service
 * Uses Google AI Studio API (Gemini 2.5) for multimodal receipt image extraction
 */

const GOOGLE_AI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GOOGLE_AI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';

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
    if (!GOOGLE_AI_API_KEY) {
        return { success: false, error: 'Google AI API Key tidak ditemukan' };
    }

    // Create abort controller with 30s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        // Extract base64 data without the data URI prefix
        const base64Data = imageBase64.includes(',')
            ? imageBase64.split(',')[1]
            : imageBase64;

        console.log('[Receipt Scan] Sending request to Gemini API...');
        const response = await fetch(`${GOOGLE_AI_API_URL}?key=${GOOGLE_AI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: SCAN_PROMPT },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: base64Data
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 1024
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Receipt Scan] API Error:', errorText);
            return { success: false, error: `API Error: ${response.status}` };
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { success: false, error: 'Gagal parsing hasil scan' };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.error) {
            return { success: false, error: parsed.error };
        }

        clearTimeout(timeoutId);
        return {
            success: true,
            merchant: parsed.merchant,
            date: parsed.date,
            items: parsed.items || [],
            total: parsed.total || 0,
            suggestedCategory: parsed.suggestedCategory || 'Lainnya'
        };
    } catch (error: unknown) {
        clearTimeout(timeoutId);
        console.error('[Receipt Scan] Error:', error);

        // Handle timeout/abort error
        if (error instanceof Error && error.name === 'AbortError') {
            return { success: false, error: 'Request timeout. Gambar mungkin terlalu besar atau koneksi lambat.' };
        }

        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat scan';
        return { success: false, error: errorMessage };
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
