// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Gemini Config
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Types
interface AIResponse {
    intent: 'transaction' | 'balance' | 'history' | 'insight' | 'set_budget' | 'budget_inquiry' | 'set_goal' | 'goal_inquiry' | 'delete_transaction' | 'chat' | 'unknown';
    data?: Record<string, unknown>;
    error?: string;
    text_response?: string;
}

interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    description: string;
    category: string;
    type: string;
    date: string;
}

interface Budget {
    id: string;
    user_id: string;
    category: string;
    budget_limit: number;
    spent: number;
}

interface Goal {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    target_date: string;
}

// Main Handler
Deno.serve(async (req: Request) => {
  try {
    const update = await req.json()

    // 0. Handle Scheduled Tasks (Cron)
    if (update.type === 'daily_recap') {
        await handleDailyRecap()
        return new Response('Recap Sent', { status: 200 })
    }
    
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id.toString()
      const text = update.message.text.trim()
      const firstName = update.message.from?.first_name || 'User'

      console.log(`[Bot] Message from ${chatId}: ${text}`)

      // 1. Authenticate User
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('telegram_chat_id', chatId)
        .single()

      if (userError || !userProfile) {
        await sendTelegramMessage(chatId, "⚠️ *Akun belum terhubung*\n\nSilakan buka Settings di aplikasi Dompet Digital dan masukkan Chat ID Anda: `" + chatId + "`")
        return new Response('User not found', { status: 200 })
      }

      const userId = userProfile.user_id

      // 2. Handle Commands
      if (text.startsWith('/start')) {
        await sendTelegramMessage(chatId, `👋 *Halo ${firstName}!*\n\nAku Asisten Keuangan Pribadimu 💰\n\n*Yang bisa kamu lakukan:*\n📝 Catat: _"Beli kopi 25rb"_\n💰 Saldo: _"Pengeluaran bulan ini?"_\n📊 Budget: _"Set budget makan 500rb"_\n🎯 Impian: _"Target beli HP 5jt Desember"_\n📜 Riwayat: _"5 transaksi terakhir"_\n🧠 Analisis: _"Saya boros di mana?"_\n\nKetik apa saja, aku siap bantu! 🚀`)
        return new Response('OK', { status: 200 })
      }

      if (text === '/help') {
        await sendTelegramMessage(chatId, `📚 *Panduan Lengkap*\n\n*Catat Transaksi:*\n• "Beli bakso 10rb"\n• "Gaji 5jt"\n• "Bayar listrik 150rb kemarin"\n\n*Cek Keuangan:*\n• "Saldo bulan ini"\n• "Total pengeluaran minggu ini"\n\n*Budget:*\n• "Set budget Makanan 500rb"\n• "Budget saya?"\n\n*Impian/Goals:*\n• "Tabung untuk iPhone 10jt target Des"\n• "Progress impian"\n\n*Lainnya:*\n• "Hapus transaksi terakhir"\n• "Analisis pengeluaran saya"`)
        return new Response('OK', { status: 200 })
      }

      // 3. AI Processing
      if (!GOOGLE_AI_API_KEY) {
        await sendTelegramMessage(chatId, "⚠️ API AI belum dikonfigurasi.")
        return new Response('OK', { status: 200 })
      }

      // Typing indicator
      await sendTypingAction(chatId)

      const aiResult = await parseIntentWithGemini(text)

      if (aiResult.error) {
        await sendTelegramMessage(chatId, `⚠️ Error: ${aiResult.error}`)
        return new Response('OK', { status: 200 })
      }

      // 4. Route to Handlers
      switch (aiResult.intent) {
        case 'transaction':
          await handleTransaction(chatId, userId, aiResult.data)
          break
        
        case 'balance':
          await handleBalanceInquiry(chatId, userId, aiResult.data)
          break

        case 'history':
          await handleHistoryInquiry(chatId, userId, aiResult.data)
          break

        case 'insight':
          await handleInsight(chatId, userId)
          break

        case 'set_budget':
          await handleSetBudget(chatId, userId, aiResult.data)
          break

        case 'budget_inquiry':
          await handleBudgetInquiry(chatId, userId)
          break

        case 'set_goal':
          await handleSetGoal(chatId, userId, aiResult.data)
          break

        case 'goal_inquiry':
          await handleGoalProgress(chatId, userId)
          break

        case 'delete_transaction':
          await handleDeleteTransaction(chatId, userId)
          break

        case 'chat':
          await sendTelegramMessage(chatId, aiResult.text_response || "Ada yang bisa saya bantu? 😊")
          break

        default:
          await sendTelegramMessage(chatId, aiResult.text_response || "Maaf, aku kurang paham 🤔\n\nCoba ketik /help untuk melihat panduan.")
          break
      }
    }

    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('[Bot Error]', err)
    return new Response('Error', { status: 500 })
  }
})

// === HANDLERS ===

async function handleTransaction(chatId: string, userId: string, data?: Record<string, unknown>) {
    if (!data || !data.amount) {
        await sendTelegramMessage(chatId, "⚠️ Hmm, data transaksi tidak lengkap. Coba lagi ya!")
        return
    }

    const amount = Number(data.amount)
    const description = String(data.description || 'Transaksi')
    const category = String(data.category || 'Lainnya')
    const type = String(data.type || 'pengeluaran')

    const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        amount,
        description,
        category,
        type,
        date: new Date().toISOString()
    })

    if (error) {
        console.error('[DB Error]', error)
        await sendTelegramMessage(chatId, "❌ Gagal menyimpan. Coba lagi nanti.")
        return
    }

    const icon = type === 'pemasukan' ? '💰' : '💸'
    const formatted = formatRupiah(amount)
    
    // Get proactive tip
    const tip = await getProactiveTip(userId, category, type)
    
    await sendTelegramMessage(chatId, `✅ *Tercatat!*\n\n${icon} ${description}\n💵 ${formatted}\n📂 ${category}\n\n${tip}`)
}

async function handleBalanceInquiry(chatId: string, userId: string, data?: Record<string, unknown>) {
    const period = String(data?.period || 'month')
    const now = new Date()
    
    let startDate: Date
    let periodLabel: string

    if (period === 'week') {
        const dayOfWeek = now.getDay()
        startDate = new Date(now)
        startDate.setDate(now.getDate() - dayOfWeek)
        startDate.setHours(0, 0, 0, 0)
        periodLabel = 'Minggu Ini'
    } else if (period === 'today') {
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        periodLabel = 'Hari Ini'
    } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        periodLabel = now.toLocaleString('id-ID', { month: 'long' })
    }
    
    const { data: txData, error } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())

    if (error) {
        await sendTelegramMessage(chatId, "❌ Gagal mengambil data.")
        return
    }

    let income = 0
    let expense = 0
    txData?.forEach((t: { amount: number; type: string }) => {
        if (t.type === 'pemasukan') income += t.amount
        else expense += t.amount
    })

    const balance = income - expense
    const balanceIcon = balance >= 0 ? '📈' : '📉'

    await sendTelegramMessage(chatId, `📊 *Laporan ${periodLabel}*\n\n💵 Pemasukan: ${formatRupiah(income)}\n💸 Pengeluaran: ${formatRupiah(expense)}\n\n${balanceIcon} *Saldo: ${formatRupiah(balance)}*`)
}

async function handleHistoryInquiry(chatId: string, userId: string, data?: Record<string, unknown>) {
    const limit = Number(data?.limit) || 5

    const { data: txData, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit)

    if (error || !txData || txData.length === 0) {
        await sendTelegramMessage(chatId, "📭 Belum ada transaksi tercatat.")
        return
    }

    let msg = `📜 *${limit} Transaksi Terakhir:*\n\n`
    txData.forEach((t: Transaction) => {
        const icon = t.type === 'pemasukan' ? '➕' : '➖'
        const date = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        msg += `${icon} *${t.description}*\n    ${formatRupiah(t.amount)} • ${date}\n\n`
    })

    await sendTelegramMessage(chatId, msg)
}

async function handleInsight(chatId: string, userId: string) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    
    const { data, error } = await supabase
        .from('transactions')
        .select('category, amount, type, description')
        .eq('user_id', userId)
        .eq('type', 'pengeluaran')
        .gte('date', startOfMonth)

    if (error || !data || data.length === 0) {
        await sendTelegramMessage(chatId, "📭 Belum cukup data untuk dianalisis. Yuk mulai catat pengeluaran! 📝")
        return
    }

    // Calculate category breakdown
    const categoryTotals: Record<string, number> = {}
    let total = 0
    data.forEach((t: { category: string; amount: number }) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
        total += t.amount
    })

    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
    const topCategory = sorted[0]
    
    // Get AI insight
    const prompt = `Analyze this spending data and give a short, friendly financial advice in Indonesian (max 2 sentences). Use 1-2 emojis.
    
Total spending: ${formatRupiah(total)}
Top categories: ${sorted.slice(0, 3).map(([cat, amt]) => `${cat}: ${formatRupiah(amt)}`).join(', ')}
Number of transactions: ${data.length}

Be encouraging but honest. If spending seems high, suggest ways to save.`

    const aiAdvice = await callGeminiSimple(prompt)

    let breakdown = ''
    sorted.slice(0, 5).forEach(([cat, amt]) => {
        const pct = Math.round((amt / total) * 100)
        breakdown += `• ${cat}: ${formatRupiah(amt)} (${pct}%)\n`
    })

    await sendTelegramMessage(chatId, `🧠 *Analisis Bulan Ini*\n\n*Top Pengeluaran:*\n${breakdown}\n💡 *Insight:*\n${aiAdvice}`)
}

async function handleSetBudget(chatId: string, userId: string, data?: Record<string, unknown>) {
    if (!data || !data.category || !data.amount) {
        await sendTelegramMessage(chatId, "⚠️ Format: _Set budget [kategori] [jumlah]_\nContoh: Set budget Makanan 500rb")
        return
    }

    const category = String(data.category)
    const amount = Number(data.amount)

    // Check if budget exists
    const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', userId)
        .eq('category', category)
        .single()

    if (existing) {
        // Update existing
        await supabase
            .from('budgets')
            .update({ budget_limit: amount })
            .eq('id', existing.id)
    } else {
        // Create new
        await supabase.from('budgets').insert({
            user_id: userId,
            category,
            budget_limit: amount,
            spent: 0
        })
    }

    await sendTelegramMessage(chatId, `✅ *Budget Diset!*\n\n📂 ${category}\n💰 Limit: ${formatRupiah(amount)}\n\nSaya akan ingatkan kalau kamu hampir melebihi budget! 🔔`)
}

async function handleBudgetInquiry(chatId: string, userId: string) {
    const { data: budgets, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)

    if (error || !budgets || budgets.length === 0) {
        await sendTelegramMessage(chatId, "📭 Belum ada budget yang diset.\n\nKetik: _Set budget Makanan 500rb_ untuk mulai!")
        return
    }

    // Get this month's spending per category
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    
    const { data: spending } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', userId)
        .eq('type', 'pengeluaran')
        .gte('date', startOfMonth)

    const spentByCategory: Record<string, number> = {}
    spending?.forEach((t: { category: string; amount: number }) => {
        spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount
    })

    let msg = "📊 *Status Budget Bulan Ini:*\n\n"
    budgets.forEach((b: Budget) => {
        const spent = spentByCategory[b.category] || 0
        const remaining = b.budget_limit - spent
        const pct = Math.round((spent / b.budget_limit) * 100)
        
        let status = '🟢'
        if (pct >= 100) status = '🔴'
        else if (pct >= 80) status = '🟡'

        msg += `${status} *${b.category}*\n`
        msg += `   ${formatRupiah(spent)} / ${formatRupiah(b.budget_limit)} (${pct}%)\n`
        msg += `   Sisa: ${formatRupiah(remaining)}\n\n`
    })

    await sendTelegramMessage(chatId, msg)
}

async function handleSetGoal(chatId: string, userId: string, data?: Record<string, unknown>) {
    if (!data || !data.name || !data.target_amount) {
        await sendTelegramMessage(chatId, "⚠️ Format: _Target [nama] [jumlah] [tanggal]_\nContoh: Target beli iPhone 15jt Desember 2024")
        return
    }

    const name = String(data.name)
    const targetAmount = Number(data.target_amount)
    const targetDate = data.target_date ? String(data.target_date) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase.from('goals').insert({
        user_id: userId,
        name,
        target_amount: targetAmount,
        current_amount: 0,
        target_date: targetDate
    })

    if (error) {
        await sendTelegramMessage(chatId, "❌ Gagal membuat goal. Coba lagi.")
        return
    }

    await sendTelegramMessage(chatId, `🎯 *Goal Baru Dibuat!*\n\n✨ ${name}\n💰 Target: ${formatRupiah(targetAmount)}\n📅 Deadline: ${new Date(targetDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}\n\nSemangat menabung! 💪`)
}

async function handleGoalProgress(chatId: string, userId: string) {
    const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)

    if (error || !goals || goals.length === 0) {
        await sendTelegramMessage(chatId, "🎯 Belum ada goal.\n\nBuat dengan: _Target beli HP 5jt Desember_")
        return
    }

    let msg = "🎯 *Progress Impian:*\n\n"
    goals.forEach((g: Goal) => {
        const pct = Math.round((g.current_amount / g.target_amount) * 100)
        const remaining = g.target_amount - g.current_amount
        
        // Progress bar
        const filled = Math.round(pct / 10)
        const bar = '█'.repeat(filled) + '░'.repeat(10 - filled)

        msg += `✨ *${g.name}*\n`
        msg += `   [${bar}] ${pct}%\n`
        msg += `   ${formatRupiah(g.current_amount)} / ${formatRupiah(g.target_amount)}\n`
        msg += `   Kurang: ${formatRupiah(remaining)}\n\n`
    })

    await sendTelegramMessage(chatId, msg)
}

async function handleDeleteTransaction(chatId: string, userId: string) {
    // Get the last transaction
    const { data, error } = await supabase
        .from('transactions')
        .select('id, description, amount, type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error || !data) {
        await sendTelegramMessage(chatId, "📭 Tidak ada transaksi untuk dihapus.")
        return
    }

    // Delete it
    await supabase.from('transactions').delete().eq('id', data.id)

    const icon = data.type === 'pemasukan' ? '💰' : '💸'
    await sendTelegramMessage(chatId, `🗑️ *Transaksi Dihapus:*\n\n${icon} ${data.description}\n💵 ${formatRupiah(data.amount)}`)
}

async function handleDailyRecap() {
    console.log('[Daily Recap] Starting...')
    
    // 1. Get all users with connected Telegram
    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('user_id, telegram_chat_id')
        .not('telegram_chat_id', 'is', null)

    if (error || !users) {
        console.error('[Daily Recap] Error fetching users:', error)
        return
    }

    console.log(`[Daily Recap] Processing ${users.length} users...`)

    // 2. Process each user
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    for (const user of users) {
        const { user_id, telegram_chat_id } = user
        if (!telegram_chat_id) continue

        // A. Get Today's Transactions
        const { data: todayTx } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('user_id', user_id)
            .gte('date', todayISO)

        // B. Get Total Balance (All Time)
        const { data: allTx } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('user_id', user_id)
        
        // Calculate totals
        let todayIncome = 0
        let todayExpense = 0
        todayTx?.forEach((t: { amount: number; type: string }) => {
            if (t.type === 'pemasukan') todayIncome += t.amount
            else todayExpense += t.amount
        })

        let totalBalance = 0
        allTx?.forEach((t: { amount: number; type: string }) => {
            if (t.type === 'pemasukan') totalBalance += t.amount
            else totalBalance -= t.amount
        })

        // C. Send Message
        const hasTransactionToday = todayTx && todayTx.length > 0
        let msg = ''

        if (hasTransactionToday) {
            msg = `🌙 *Ringkasan Harian*\n\n` +
                  `Hari ini kamu mencatat ${todayTx.length} transaksi.\n` +
                  `📉 Pengeluaran: ${formatRupiah(todayExpense)}\n` +
                  `📈 Pemasukan: ${formatRupiah(todayIncome)}\n\n` +
                  `💰 *Sisa Saldo: ${formatRupiah(totalBalance)}*\n\n` +
                  `Istirahat yang cukup ya! 😴`
        } else {
            msg = `👋 *Halo! Belum ada kabar nih*\n\n` +
                  `Sepertinya kamu belum mencatat transaksi hari ini. Ada yang terlupa? 🤔\n\n` +
                  `💰 *Saldo Saat Ini: ${formatRupiah(totalBalance)}*\n\n` +
                  `Yuk catat sekarang: _"Beli makan malam 25rb"_`
        }

        await sendTelegramMessage(telegram_chat_id, msg)
    }
    console.log('[Daily Recap] Done.')
}

// === HELPERS ===

async function sendTelegramMessage(chatId: string, text: string) {
    if (!TELEGRAM_BOT_TOKEN) return

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        })
    })
}

async function sendTypingAction(chatId: string) {
    if (!TELEGRAM_BOT_TOKEN) return

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            action: 'typing'
        })
    })
}

function formatRupiah(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`
}

async function getProactiveTip(userId: string, category: string, type: string): Promise<string> {
    if (type === 'pemasukan') return "📈 Mantap! Pemasukan tercatat."

    // Check if near budget limit
    const { data: budget } = await supabase
        .from('budgets')
        .select('budget_limit')
        .eq('user_id', userId)
        .eq('category', category)
        .single()

    if (budget) {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        
        const { data: spending } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('category', category)
            .eq('type', 'pengeluaran')
            .gte('date', startOfMonth)

        const totalSpent = spending?.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0) || 0
        const pct = Math.round((totalSpent / budget.budget_limit) * 100)

        if (pct >= 100) return `⚠️ *Budget ${category} habis!* Sudah ${pct}% dari limit.`
        if (pct >= 80) return `🟡 Hati-hati, sudah ${pct}% dari budget ${category}!`
    }

    const tips = [
        "💡 Tip: Catat terus agar lebih aware!",
        "📊 Ketik 'insight' untuk analisis lengkap",
        "🎯 Sudah set budget? Ketik 'budget saya'",
        "💪 Konsisten mencatat = keuangan sehat!"
    ]
    
    return tips[Math.floor(Math.random() * tips.length)]
}

async function parseIntentWithGemini(text: string): Promise<AIResponse> {
    try {
        const today = new Date().toISOString().split('T')[0]
        
        const prompt = `You are a smart Indonesian financial assistant. Classify user intent and extract data.

User message: "${text}"
Today's date: ${today}

Return JSON with:
{
  "intent": "transaction" | "balance" | "history" | "insight" | "set_budget" | "budget_inquiry" | "set_goal" | "goal_inquiry" | "delete_transaction" | "chat" | "unknown",
  "data": { ... extracted data ... },
  "text_response": "friendly response if intent is chat/unknown"
}

Intent detection rules:
- "transaction": User wants to record income/expense. Extract: amount (number), description, category (from: Makanan & Minuman, Transportasi, Tagihan & Utilitas, Hiburan, Belanja, Kesehatan, Gaji, Tabungan & Investasi, Lainnya), type (pemasukan/pengeluaran)
- "balance": Asking for balance/summary. Extract: period (month/week/today)
- "history": Asking for transaction history. Extract: limit (default 5)
- "insight": Asking for spending analysis/advice
- "set_budget": Setting a budget limit. Extract: category, amount
- "budget_inquiry": Asking about budget status
- "set_goal": Creating savings goal. Extract: name, target_amount, target_date (ISO string)
- "goal_inquiry": Asking about goal progress
- "delete_transaction": Wants to delete last transaction
- "chat": General greeting/conversation (halo, hi, thanks)
- "unknown": Cannot understand

Amount parsing:
- "25rb" = 25000, "5jt" = 5000000, "1.5jt" = 1500000

Date parsing:
- "kemarin" = yesterday, "minggu lalu" = last week start
- "Desember 2024" = 2024-12-01

Examples:
- "Beli bakso 10rb" -> {"intent":"transaction","data":{"description":"Bakso","amount":10000,"category":"Makanan & Minuman","type":"pengeluaran"}}
- "Gaji 5jt" -> {"intent":"transaction","data":{"description":"Gaji","amount":5000000,"category":"Gaji","type":"pemasukan"}}
- "Pengeluaran minggu ini" -> {"intent":"balance","data":{"period":"week"}}
- "Set budget makan 500rb" -> {"intent":"set_budget","data":{"category":"Makanan & Minuman","amount":500000}}
- "Budget saya?" -> {"intent":"budget_inquiry"}
- "Target beli HP 5jt Desember" -> {"intent":"set_goal","data":{"name":"Beli HP","target_amount":5000000,"target_date":"2024-12-01"}}
- "Impian saya" -> {"intent":"goal_inquiry"}
- "Hapus transaksi terakhir" -> {"intent":"delete_transaction"}
- "Halo" -> {"intent":"chat","text_response":"Halo! Ada yang bisa saya bantu hari ini? 😊"}

Return ONLY valid JSON, no markdown.`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GOOGLE_AI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    temperature: 0.1, 
                    responseMimeType: "application/json" 
                }
            })
        })

        if (!response.ok) {
            console.error('[Gemini API Error]', response.status)
            return { intent: 'unknown', error: 'API Error' }
        }

        const result = await response.json()
        const content = result.candidates?.[0]?.content?.parts?.[0]?.text

        if (!content) return { intent: 'unknown', error: 'Empty response' }

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
        return JSON.parse(content)

    } catch (e) {
        console.error('[Parse Error]', e)
        return { intent: 'unknown', error: String(e) }
    }
}

async function callGeminiSimple(prompt: string): Promise<string> {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GOOGLE_AI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
            })
        })
        
        const data = await response.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak dapat menganalisis."
    } catch {
        return "Gagal menghubungi AI."
    }
}
