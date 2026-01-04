# Panduan Konfigurasi Backend Supabase untuk Dompet Digital

Ikuti langkah-langkah ini untuk menyiapkan database dan otentikasi Supabase agar sesuai dengan aplikasi Dompet Digital.

## Langkah 1: Buat Proyek Supabase
1.  Buka [supabase.com](https://supabase.com/) dan buat akun atau masuk.
2.  Klik "New project" dan berikan nama pada proyek Anda (misalnya, "dompet-digital").
3.  Simpan kata sandi database Anda di tempat yang aman.
4.  Tunggu hingga proyek Anda selesai dibuat.

## Langkah 2: Jalankan Skrip SQL
Navigasikan ke **SQL Editor** di dasbor Supabase Anda. Klik "New query", lalu salin dan jalankan semua skrip SQL di bawah ini sekaligus. Skrip ini akan membuat semua tabel yang diperlukan beserta kebijakan keamanannya.

### Skrip SQL Lengkap

```sql
-- Tabel transactions
-- Menyimpan semua catatan pemasukan dan pengeluaran.
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  goal_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel budgets
-- Menyimpan anggaran yang ditetapkan pengguna untuk kategori pengeluaran.
-- Catatan: spent_amount dihitung di sisi aplikasi untuk akurasi real-time.
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  budget_limit DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Tabel goals
-- Menyimpan tujuan finansial atau impian pengguna.
-- Catatan: currentAmount dihitung di sisi aplikasi dari transaksi terkait.
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tambahkan foreign key constraint setelah tabel goals dibuat
ALTER TABLE transactions
ADD CONSTRAINT fk_goal
FOREIGN KEY (goal_id)
REFERENCES goals(id)
ON DELETE SET NULL; -- Jika goal dihapus, goal_id di transaksi menjadi NULL

-- Tabel bills
-- Menyimpan tagihan berulang dan tanggal jatuh temponya.
CREATE TABLE bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'once', -- 'once', 'weekly', 'monthly', 'yearly'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel user_profiles (opsional untuk FCM token)
-- Digunakan untuk menyimpan token notifikasi push.
CREATE TABLE user_profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  fcm_token TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security untuk semua tabel
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies untuk transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Policies untuk budgets
CREATE POLICY "Users can view own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Policies untuk goals
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- Policies untuk bills
CREATE POLICY "Users can view own bills" ON bills
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bills" ON bills
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bills" ON bills
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bills" ON bills
  FOR DELETE USING (auth.uid() = user_id);

-- Policies untuk user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

## Langkah 3: Konfigurasi URL Proyek (PENTING!)
Agar link verifikasi email berfungsi dengan benar, terutama saat pengembangan di `localhost`, Anda harus memberi tahu Supabase alamat aplikasi Anda.

1.  Di dasbor Supabase, navigasikan ke **Authentication** (ikon pengguna).
2.  Pilih **URL Configuration** dari menu samping.
3.  Di kolom **Site URL**, masukkan URL aplikasi Anda. Untuk pengembangan lokal, ini biasanya: `http://localhost:3000` atau port lain yang Anda gunakan.
4.  Klik **Save**.

## Langkah 4: Konfigurasi Autentikasi
Secara default, Supabase Auth sudah siap digunakan dan mewajibkan konfirmasi email. Untuk mempermudah pengembangan, Anda bisa mematikan fitur ini sementara.

1.  Navigasikan ke **Authentication** (ikon pengguna).
2.  Pilih **Providers**.
3.  Di bawah **Email**, Anda dapat mematikan toggle **Confirm email**. **INGAT** untuk menyalakannya kembali saat aplikasi siap untuk produksi.

## Langkah 5: Buat Fungsi RPC untuk Transaksi Atomik (PENTING)
Untuk memastikan konsistensi data, terutama saat membayar tagihan (yang melibatkan pembuatan transaksi dan pembaruan tagihan), kita akan membuat fungsi di database. Ini memastikan bahwa kedua operasi berhasil atau gagal bersama-sama.

Buka **SQL Editor**, klik "New query", lalu salin dan jalankan skrip di bawah ini:

```sql
-- Function to pay a bill, which creates a transaction and updates/deletes the bill atomically.
CREATE OR REPLACE FUNCTION pay_bill_and_update(bill_id_to_pay UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bill_record RECORD;
  new_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 1. Fetch the bill details ensuring it belongs to the current user
  SELECT *
  INTO bill_record
  FROM public.bills
  WHERE id = bill_id_to_pay AND user_id = auth.uid();

  -- If no bill is found, raise an error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bill not found or you do not have permission to pay it.';
  END IF;

  -- 2. Insert the payment transaction
  INSERT INTO public.transactions (user_id, type, amount, description, category, date)
  VALUES (auth.uid(), 'pengeluaran', bill_record.amount, 'Pembayaran: ' || bill_record.name, 'Tagihan & Utilitas', NOW());

  -- 3. Update or delete the bill based on frequency
  IF bill_record.frequency = 'once' THEN
    -- Delete the one-time bill
    DELETE FROM public.bills WHERE id = bill_id_to_pay;
  ELSE
    -- Calculate the next due date for recurring bills
    CASE bill_record.frequency
      WHEN 'weekly' THEN
        new_due_date := bill_record.due_date + INTERVAL '7 days';
      WHEN 'monthly' THEN
        new_due_date := bill_record.due_date + INTERVAL '1 month';
      WHEN 'yearly' THEN
        new_due_date := bill_record.due_date + INTERVAL '1 year';
      ELSE
        -- This case should ideally not be hit with current app logic, but as a fallback:
        new_due_date := bill_record.due_date + INTERVAL '1 month';
    END CASE;

    -- Update the bill with the new due date
    UPDATE public.bills
    SET due_date = new_due_date
    WHERE id = bill_id_to_pay;
  END IF;

END;
$$;
```


## Langkah 6: Update Schema (Migrasi)
Jika Anda perlu menambahkan fitur pelacakan pembayaran tagihan yang terhubung dengan transaksi, jalankan skrip migrasi berikut di **SQL Editor**:

Lihat file: `sql/01_add_bill_id_to_transactions.sql`

Atau salin query berikut:

```sql
-- 1. Tambah kolom bill_id
ALTER TABLE transactions
ADD COLUMN bill_id UUID REFERENCES bills(id) ON DELETE SET NULL;

-- 2. Update fungsi pembayaran agar mencatat bill_id
CREATE OR REPLACE FUNCTION pay_bill_and_update(bill_id_to_pay UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bill_record RECORD;
  new_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 1. Fetch bill
  SELECT * INTO bill_record FROM public.bills WHERE id = bill_id_to_pay AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Bill not found.'; END IF;

  -- 2. Insert transaction dengan bill_id
  INSERT INTO public.transactions (user_id, type, amount, description, category, date, bill_id)
  VALUES (auth.uid(), 'pengeluaran', bill_record.amount, 'Pembayaran: ' || bill_record.name, 'Tagihan & Utilitas', NOW(), bill_id_to_pay);

  -- 3. Update/Delete bill
  IF bill_record.frequency = 'once' THEN
    DELETE FROM public.bills WHERE id = bill_id_to_pay;
  ELSE
    CASE bill_record.frequency
      WHEN 'weekly' THEN new_due_date := bill_record.due_date + INTERVAL '7 days';
      WHEN 'monthly' THEN new_due_date := bill_record.due_date + INTERVAL '1 month';
      WHEN 'yearly' THEN new_due_date := bill_record.due_date + INTERVAL '1 year';
      ELSE new_due_date := bill_record.due_date + INTERVAL '1 month';
    END CASE;
    UPDATE public.bills SET due_date = new_due_date WHERE id = bill_id_to_pay;
  END IF;
END;
$$;
```