-- Migration: Add bill_id to transactions table
-- Description: Adds a foreign key column to link payment transactions to their original bills.

-- 1. Add the column
ALTER TABLE transactions
ADD COLUMN bill_id UUID REFERENCES bills(id) ON DELETE SET NULL;

-- 2. Update the pay_bill_and_update function to include bill_id
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

  -- 2. Insert the payment transaction WITH bill_id
  -- Note: We store the bill_id even if the bill is about to be deleted (for 'once' frequency).
  -- If the bill is deleted, the foreign key ON DELETE SET NULL will set it to NULL, 
  -- OR we can choose to keep the ID if we want historical reference but usually FK constraints enforce existence.
  -- Limitation: If the bill is deleted, the link is lost unless we soft delete bills or relax the FK.
  -- For recurring bills, the link remains valid as the bill ID persists.
  INSERT INTO public.transactions (user_id, type, amount, description, category, date, bill_id)
  VALUES (auth.uid(), 'pengeluaran', bill_record.amount, 'Pembayaran: ' || bill_record.name, 'Tagihan & Utilitas', NOW(), bill_id_to_pay);

  -- 3. Update or delete the bill based on frequency
  IF bill_record.frequency = 'once' THEN
    -- Delete the one-time bill
    -- WARNING: Deleting the bill will trigger ON DELETE SET NULL on the transaction we just inserted.
    -- If you want to keep the record that this transaction paid a specific bill that no longer exists, you might need a separate log or soft delete.
    -- For now, respecting the schema constraint.
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
        new_due_date := bill_record.due_date + INTERVAL '1 month';
    END CASE;

    -- Update the bill with the new due date
    UPDATE public.bills
    SET due_date = new_due_date
    WHERE id = bill_id_to_pay;
  END IF;

END;
$$;
