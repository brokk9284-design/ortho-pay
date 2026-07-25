-- ==========================================
-- ORTHO-PAY — Deposits & Withdrawals Tables
-- Run this on your Supabase database
-- ==========================================

-- Deposits Table
CREATE TABLE IF NOT EXISTS public.deposits (
    deposit_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    wallet_id UUID REFERENCES public.wallets(wallet_id) NOT NULL,
    payment_method_id UUID REFERENCES public.payment_methods(method_id) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0.00),
    reference VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    payment_details JSONB DEFAULT '{}'::jsonb,
    reviewed_by UUID REFERENCES public.admins(admin_id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    withdrawal_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    wallet_id UUID REFERENCES public.wallets(wallet_id) NOT NULL,
    withdrawal_type VARCHAR(10) NOT NULL CHECK (withdrawal_type IN ('crypto', 'cash')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0.00),
    reference VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    details JSONB DEFAULT '{}'::jsonb,
    reviewed_by UUID REFERENCES public.admins(admin_id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for deposits
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own deposits"
    ON public.deposits FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Allow users to create own deposits"
    ON public.deposits FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow admins to view all deposits"
    ON public.deposits FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Allow admins to update deposits"
    ON public.deposits FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- RLS for withdrawals
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own withdrawals"
    ON public.withdrawals FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Allow users to create own withdrawals"
    ON public.withdrawals FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow admins to view all withdrawals"
    ON public.withdrawals FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Allow admins to update withdrawals"
    ON public.withdrawals FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
