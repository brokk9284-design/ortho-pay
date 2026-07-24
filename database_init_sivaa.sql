-- ==========================================
-- ORTHO-PAY Database Schema & RLS Configuration
-- Escrow Payment Platform — USA & England
-- Currency: USD ($) only
-- Database: PostgreSQL (Supabase)
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------
-- 1. Types & Enums
-- ------------------------------------------
CREATE TYPE public.kyc_status_type AS ENUM ('unverified', 'pending', 'verified', 'rejected');

CREATE TYPE public.payment_status_type AS ENUM (
    'pending',        -- sender committed, waiting for admin approval
    'under_review',   -- admin is reviewing
    'escrow_held',    -- funds locked in escrow
    'completed',      -- admin approved, funds released to receiver
    'reversed',       -- admin rejected, funds returned to sender
    'refunded',
    'failed',
    'cancelled'
);

CREATE TYPE public.admin_role_type AS ENUM ('reviewer', 'super_admin');

CREATE TYPE public.wallet_status_type AS ENUM ('active', 'frozen', 'suspended');

CREATE TYPE public.txn_type AS ENUM (
    'transfer_in',      -- received money from completed escrow
    'transfer_out',     -- sent money into escrow hold
    'fee',              -- platform fee deducted
    'escrow_hold',      -- funds locked for pending escrow
    'escrow_release',   -- funds released from escrow to receiver
    'escrow_refund',    -- funds refunded from escrow to sender
    'adjust_in',        -- admin manual credit
    'adjust_out'        -- admin manual debit
);


-- ------------------------------------------
-- 2. Profiles Table
-- ------------------------------------------
-- Links to Supabase auth.users
-- Every user gets a unique $SIVA tag (stored without $ prefix, e.g. "alice")
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    siva_tag VARCHAR(30) UNIQUE NOT NULL,   -- e.g. "alice" (displayed as $alice)
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    country VARCHAR(2) NOT NULL DEFAULT 'US',  -- US or GB
    kyc_status public.kyc_status_type DEFAULT 'unverified'::public.kyc_status_type NOT NULL,
    pin_hash VARCHAR(255),
    avatar_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_siva_tag CHECK (siva_tag ~ '^[a-zA-Z0-9_]{3,30}$'),
    CONSTRAINT chk_country CHECK (country IN ('US', 'GB'))
);

-- ------------------------------------------
-- 3. Admins Table
-- ------------------------------------------
-- Escrow reviewers and super admins who approve/reject payments
CREATE TABLE public.admins (
    admin_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role public.admin_role_type DEFAULT 'reviewer'::public.admin_role_type NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 4. Wallets Table (Escrow Holding Account)
-- ------------------------------------------
-- ORTHO-PAY does not hold user balances. This table tracks
-- escrow holds only — locked_balance represents funds
-- currently held in escrow for pending payments.
CREATE TABLE public.wallets (
    wallet_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_sent NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,       -- cumulative completed sent
    total_received NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,    -- cumulative completed received
    locked_balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL CHECK (locked_balance >= 0.00),  -- escrow holds
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    status public.wallet_status_type DEFAULT 'active'::public.wallet_status_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_currency CHECK (currency = 'USD')
);

-- ------------------------------------------
-- 5. Fee Rules Table (Legacy tier-based, kept for backward compat)
-- ------------------------------------------
CREATE TABLE public.fee_rules (
    rule_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    minimum_amount NUMERIC(15, 2) NOT NULL CHECK (minimum_amount >= 0.00),
    maximum_amount NUMERIC(15, 2) CHECK (maximum_amount > minimum_amount),
    percentage NUMERIC(5, 2) NOT NULL CHECK (percentage >= 0.00 AND percentage <= 100.00),
    active BOOLEAN DEFAULT true NOT NULL
);

-- ------------------------------------------
-- 5b. Payment Methods Table
-- ------------------------------------------
-- Each payment method has its own fee structure and limits.
-- Admin configures details (wallet addresses, handles, instructions) via JSONB config.
CREATE TABLE public.payment_methods (
    method_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,              -- crypto, cashapp, paypal, venmo
    display_name VARCHAR(50) NOT NULL,              -- Crypto, Cash App, PayPal, Venmo
    icon_key VARCHAR(50) NOT NULL,                   -- icon identifier for frontend
    fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (fee_percentage >= 0.00 AND fee_percentage <= 100.00),
    fee_fixed NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (fee_fixed >= 0.00),
    min_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (min_amount >= 0.00),
    max_amount NUMERIC(15, 2) CHECK (max_amount IS NULL OR max_amount > min_amount),
    daily_limit NUMERIC(15, 2) CHECK (daily_limit > 0.00),
    monthly_limit NUMERIC(15, 2) CHECK (monthly_limit > 0.00),
    config JSONB DEFAULT '{}'::jsonb NOT NULL,       -- admin-configurable: wallet addresses, handles, instructions, etc.
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 6. Payments Table (Escrow Model)
-- ------------------------------------------
CREATE TABLE public.payments (
    payment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
    gross_amount NUMERIC(15, 2) NOT NULL CHECK (gross_amount > 0.00),
    fee_amount NUMERIC(15, 2) NOT NULL CHECK (fee_amount >= 0.00),
    net_amount NUMERIC(15, 2) NOT NULL CHECK (net_amount > 0.00),
    payment_method_id UUID REFERENCES public.payment_methods(method_id) NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    status public.payment_status_type DEFAULT 'pending'::public.payment_status_type NOT NULL,
    escrow_notes TEXT,                        -- admin notes during review
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.admins(admin_id),
    CONSTRAINT chk_net_amount CHECK (net_amount = gross_amount - fee_amount),
    CONSTRAINT chk_sender_not_receiver CHECK (sender_id <> receiver_id)
);

-- ------------------------------------------
-- 7. Escrow Reviews Table
-- ------------------------------------------
-- Full audit trail of admin review actions on each escrow payment
CREATE TABLE public.escrow_reviews (
    review_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID REFERENCES public.payments(payment_id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES public.admins(admin_id) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'rejected', 'held', 'released')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 8. Payment Verifications Table
-- ------------------------------------------
CREATE TABLE public.payment_verifications (
    verification_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID REFERENCES public.payments(payment_id) ON DELETE CASCADE NOT NULL,
    verification_method VARCHAR(50) NOT NULL,   -- manual_receipt, auto_bank_match
    receipt_url VARCHAR(512),                    -- GitHub Storage path
    verified BOOLEAN DEFAULT false NOT NULL,
    verified_by UUID REFERENCES public.admins(admin_id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 8b. Payment Requests Table
-- ------------------------------------------
-- A receiver can request payment from another user by $SIVA tag.
-- The requested sender gets notified by email + in-app notification.
-- When the sender fulfills the request, it creates a normal escrow payment
-- linked back to this request.
CREATE TABLE public.payment_requests (
    request_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,   -- who is asking for money
    requested_from_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- who needs to pay
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0.00),
    payment_method_id UUID REFERENCES public.payment_methods(method_id),
    message TEXT,                                  -- optional note from requester
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,  -- pending, fulfilled, cancelled, expired
    fulfilled_payment_id UUID REFERENCES public.payments(payment_id),  -- set when sender creates the payment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 8c. Payment 2FA Codes Table
-- ------------------------------------------
-- Stores 6-digit verification codes sent to user email during payment initiation.
-- Codes expire after 10 minutes and can only be used once.
CREATE TABLE public.payment_2fa_codes (
    code_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    code_hash VARCHAR(255) NOT NULL,               -- SHA-256 hash of the 6-digit code
    purpose VARCHAR(30) NOT NULL,                   -- 'payment_send', 'payment_fulfill'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 8d. Transaction Chats Table
-- ------------------------------------------
-- A 1:1 conversation between two users who have transacted (or are about to).
-- Created automatically when a user enters a SIVA tag to send or request.
-- All payments, requests, receipts, and state changes between the pair are
-- surfaced as system messages in this chat.
CREATE TABLE public.transaction_chats (
    chat_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_a_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    user_b_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chat_users_different CHECK (user_a_id <> user_b_id),
    CONSTRAINT chat_users_ordered CHECK (user_a_id < user_b_id)  -- enforce canonical ordering to prevent duplicate chats
);

-- Unique constraint so only one chat exists per pair
CREATE UNIQUE INDEX idx_transaction_chats_pair ON public.transaction_chats(user_a_id, user_b_id);

-- ------------------------------------------
-- 8e. Transaction Messages Table
-- ------------------------------------------
-- Messages within a transaction chat. Can be:
-- - 'user'    : text message from one of the two participants
-- - 'system'  : auto-generated state change event (payment created, escrow held, approved, rejected, etc.)
-- - 'file'    : file/evidence upload (receipt, screenshot, document)
CREATE TABLE public.transaction_messages (
    message_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chat_id UUID REFERENCES public.transaction_chats(chat_id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,  -- who sent it (null for system messages)
    message_type VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (message_type IN ('user', 'system', 'file')),
    body TEXT,                                       -- text content (for user/system messages)
    file_url VARCHAR(512),                           -- GitHub Storage path (for file messages)
    file_name VARCHAR(255),                          -- original filename
    file_size BIGINT,
    -- Link to the payment this message relates to (for system messages about state changes)
    payment_id UUID REFERENCES public.payments(payment_id) ON DELETE SET NULL,
    payment_request_id UUID REFERENCES public.payment_requests(request_id) ON DELETE SET NULL,
    -- Metadata for system messages
    event_type VARCHAR(50),                          -- 'payment_created', 'escrow_held', 'escrow_approved', 'escrow_rejected', 'request_created', 'request_accepted', 'request_declined', 'request_fulfilled', 'receipt_uploaded'
    read_by_a BOOLEAN DEFAULT false NOT NULL,        -- whether user_a has read this message
    read_by_b BOOLEAN DEFAULT false NOT NULL,        -- whether user_b has read this message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT msg_body_or_file CHECK (body IS NOT NULL OR file_url IS NOT NULL)
);

-- ------------------------------------------
-- 9. Wallet Transactions (Ledger entries)
-- ------------------------------------------
CREATE TABLE public.wallet_transactions (
    transaction_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_id UUID REFERENCES public.wallets(wallet_id) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,              -- positive for credits, negative for debits
    type public.txn_type NOT NULL,
    payment_id UUID REFERENCES public.payments(payment_id),
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 10. KYC Documents Table
-- ------------------------------------------
-- Stores references to KYC verification documents (ID, proof of address, etc.)
CREATE TABLE public.kyc_documents (
    document_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    document_type VARCHAR(50) NOT NULL,          -- passport, drivers_license, utility_bill, bank_statement
    file_url VARCHAR(512) NOT NULL,              -- Supabase Storage documents bucket
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.admins(admin_id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 11. Audit Logs Table (Immutable insert-only)
-- ------------------------------------------
CREATE TABLE public.audit_logs (
    log_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    actor_id UUID NOT NULL,                      -- can be profile_id or admin_id
    actor_type VARCHAR(10) NOT NULL CHECK (actor_type IN ('user', 'admin', 'system')),
    action VARCHAR(100) NOT NULL,                -- e.g., Approve Escrow, Reject Escrow, Freeze Wallet, Update Fee
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 12. Support Tickets & Messages
-- ------------------------------------------
CREATE TABLE public.support_tickets (
    ticket_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category VARCHAR(100) NOT NULL,              -- payment_issue, escrow_dispute, account, kyc, other
    priority VARCHAR(50) DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES public.admins(admin_id),
    payment_id UUID REFERENCES public.payments(payment_id),  -- link to disputed payment if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.ticket_messages (
    message_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES public.support_tickets(ticket_id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 13. Notifications Table
-- ------------------------------------------
CREATE TABLE public.notifications (
    notification_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',           -- payment, escrow, kyc, security, general
    read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------
-- 14. Updated At Trigger Function
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------
-- 15. Automations & Trigger Functions
-- ------------------------------------------

-- Function: Create wallet on profile creation (USD)
CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, total_sent, total_received, locked_balance, currency, status)
    VALUES (NEW.id, 0.00, 0.00, 0.00, 'USD', 'active'::public.wallet_status_type);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_wallet();

-- Function: Prevent updates or deletes on audit logs (Immutability guarantee)
CREATE OR REPLACE FUNCTION public.prevent_audit_alteration()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are strictly immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_immutable_update
    BEFORE UPDATE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_alteration();

CREATE TRIGGER audit_immutable_delete
    BEFORE DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_alteration();

-- Function: Log escrow review action to audit_logs
CREATE OR REPLACE FUNCTION public.log_escrow_review()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (actor_id, actor_type, action, table_name, record_id, new_value)
    VALUES (
        NEW.admin_id,
        'admin',
        'Escrow ' || NEW.action,
        'payments',
        NEW.payment_id,
        jsonb_build_object('review_id', NEW.review_id, 'action', NEW.action, 'notes', NEW.notes, 'created_at', NEW.created_at)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_escrow_review_created
    AFTER INSERT ON public.escrow_reviews
    FOR EACH ROW EXECUTE FUNCTION public.log_escrow_review();

-- ------------------------------------------
-- 16. Row Level Security (RLS) Policies
-- ------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_2fa_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins
        WHERE profile_id = auth.uid() AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Allow authenticated read-only profiles access"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to update own profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Admins Policies (admin-only access)
CREATE POLICY "Allow admins to view all admins"
    ON public.admins FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Allow super_admins to insert admins"
    ON public.admins FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE profile_id = auth.uid() AND role = 'super_admin' AND is_active = true
        )
    );

CREATE POLICY "Allow super_admins to update admins"
    ON public.admins FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE profile_id = auth.uid() AND role = 'super_admin' AND is_active = true
        )
    );

-- Wallets Policies
CREATE POLICY "Allow users to view own wallet"
    ON public.wallets FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow admins to view all wallets"
    ON public.wallets FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Allow admins to update wallets"
    ON public.wallets FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Fee Rules Policies (public read, admin write)
CREATE POLICY "Allow anyone to view active fee rules"
    ON public.fee_rules FOR SELECT
    TO authenticated
    USING (active = true);

CREATE POLICY "Allow admins to insert fee rules"
    ON public.fee_rules FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to update fee rules"
    ON public.fee_rules FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Payment Methods Policies (public read active, admin full)
CREATE POLICY "Allow anyone to view active payment methods"
    ON public.payment_methods FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Allow admins to view all payment methods"
    ON public.payment_methods FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Allow admins to insert payment methods"
    ON public.payment_methods FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to update payment methods"
    ON public.payment_methods FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Payments Policies
CREATE POLICY "Allow users to view own payments (sent or received)"
    ON public.payments FOR SELECT
    TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Allow admins to view all payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Allow users to insert own payments"
    ON public.payments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Allow admins to update payments (escrow approval)"
    ON public.payments FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Escrow Reviews Policies (admin-only)
CREATE POLICY "Allow admins to view escrow reviews"
    ON public.escrow_reviews FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Allow admins to insert escrow reviews"
    ON public.escrow_reviews FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Payment Verifications Policies
CREATE POLICY "Allow users to view own payment verifications"
    ON public.payment_verifications FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.payments
            WHERE payments.payment_id = payment_verifications.payment_id
              AND (payments.sender_id = auth.uid() OR payments.receiver_id = auth.uid())
        )
    );

CREATE POLICY "Allow admins to view all payment verifications"
    ON public.payment_verifications FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Allow users to insert own payment verifications"
    ON public.payment_verifications FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.payments
            WHERE payments.payment_id = payment_verifications.payment_id
              AND (payments.sender_id = auth.uid() OR payments.receiver_id = auth.uid())
        )
    );

CREATE POLICY "Allow admins to update payment verifications"
    ON public.payment_verifications FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Payment Requests Policies
CREATE POLICY "Allow users to view own payment requests"
    ON public.payment_requests FOR SELECT
    TO authenticated
    USING (
        requester_id = auth.uid() OR requested_from_id = auth.uid()
    );

CREATE POLICY "Allow users to create payment requests"
    ON public.payment_requests FOR INSERT
    TO authenticated
    WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Allow users to update own payment requests"
    ON public.payment_requests FOR UPDATE
    TO authenticated
    USING (requester_id = auth.uid() OR requested_from_id = auth.uid())
    WITH CHECK (requester_id = auth.uid() OR requested_from_id = auth.uid());

CREATE POLICY "Allow admins to view all payment requests"
    ON public.payment_requests FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Payment 2FA Codes Policies (users can only insert and update their own codes)
CREATE POLICY "Allow users to insert own 2fa codes"
    ON public.payment_2fa_codes FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to view own 2fa codes"
    ON public.payment_2fa_codes FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Allow users to update own 2fa codes"
    ON public.payment_2fa_codes FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Transaction Chats Policies
CREATE POLICY "Allow users to view own chats"
    ON public.transaction_chats FOR SELECT
    TO authenticated
    USING (user_a_id = auth.uid() OR user_b_id = auth.uid());

CREATE POLICY "Allow users to create chats"
    ON public.transaction_chats FOR INSERT
    TO authenticated
    WITH CHECK (user_a_id = auth.uid() OR user_b_id = auth.uid());

CREATE POLICY "Allow users to update own chats"
    ON public.transaction_chats FOR UPDATE
    TO authenticated
    USING (user_a_id = auth.uid() OR user_b_id = auth.uid())
    WITH CHECK (user_a_id = auth.uid() OR user_b_id = auth.uid());

CREATE POLICY "Allow admins to view all chats"
    ON public.transaction_chats FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Transaction Messages Policies
CREATE POLICY "Allow users to view messages in own chats"
    ON public.transaction_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.transaction_chats
            WHERE transaction_chats.chat_id = transaction_messages.chat_id
              AND (transaction_chats.user_a_id = auth.uid() OR transaction_chats.user_b_id = auth.uid())
        )
    );

CREATE POLICY "Allow users to insert messages in own chats"
    ON public.transaction_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transaction_chats
            WHERE transaction_chats.chat_id = transaction_messages.chat_id
              AND (transaction_chats.user_a_id = auth.uid() OR transaction_chats.user_b_id = auth.uid())
              AND (transaction_messages.sender_id = auth.uid() OR transaction_messages.message_type = 'system')
        )
    );

CREATE POLICY "Allow users to update read status in own chats"
    ON public.transaction_messages FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.transaction_chats
            WHERE transaction_chats.chat_id = transaction_messages.chat_id
              AND (transaction_chats.user_a_id = auth.uid() OR transaction_chats.user_b_id = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transaction_chats
            WHERE transaction_chats.chat_id = transaction_messages.chat_id
              AND (transaction_chats.user_a_id = auth.uid() OR transaction_chats.user_b_id = auth.uid())
        )
    );

CREATE POLICY "Allow admins to view all messages"
    ON public.transaction_messages FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Wallet Transactions Policies
CREATE POLICY "Allow users to view own wallet transactions"
    ON public.wallet_transactions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.wallets
            WHERE wallets.wallet_id = wallet_transactions.wallet_id
              AND wallets.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow admins to view all wallet transactions"
    ON public.wallet_transactions FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Allow admins to insert wallet transactions"
    ON public.wallet_transactions FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- KYC Documents Policies
CREATE POLICY "Allow users to view own KYC documents"
    ON public.kyc_documents FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow admins to view all KYC documents"
    ON public.kyc_documents FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Allow users to insert own KYC documents"
    ON public.kyc_documents FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins to update KYC documents (approve/reject)"
    ON public.kyc_documents FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Audit Logs Policies (admin-only read, system insert)
CREATE POLICY "Allow admins to view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Support Tickets Policies
CREATE POLICY "Allow users to view own tickets"
    ON public.support_tickets FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow admins to view all tickets"
    ON public.support_tickets FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Allow users to create tickets"
    ON public.support_tickets FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins to update tickets"
    ON public.support_tickets FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Ticket Messages Policies
CREATE POLICY "Allow users to view own ticket messages"
    ON public.ticket_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE support_tickets.ticket_id = ticket_messages.ticket_id
              AND support_tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow admins to view all ticket messages"
    ON public.ticket_messages FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Allow users to add messages to own tickets"
    ON public.ticket_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id AND sender_type = 'user'
        AND EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE support_tickets.ticket_id = ticket_messages.ticket_id
              AND support_tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow admins to add messages to any ticket"
    ON public.ticket_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() AND sender_type = 'admin'
    );

-- Notifications Policies
CREATE POLICY "Allow users to view own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow system to insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------
-- 17. Indexes for Performance
-- ------------------------------------------
CREATE INDEX idx_profiles_siva_tag ON public.profiles(siva_tag);
CREATE INDEX idx_payments_sender_id ON public.payments(sender_id);
CREATE INDEX idx_payments_receiver_id ON public.payments(receiver_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX idx_escrow_reviews_payment_id ON public.escrow_reviews(payment_id);
CREATE INDEX idx_escrow_reviews_admin_id ON public.escrow_reviews(admin_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_payment_id ON public.wallet_transactions(payment_id);
CREATE INDEX idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX idx_payment_verifications_payment_id ON public.payment_verifications(payment_id);
CREATE INDEX idx_payment_requests_requested_from ON public.payment_requests(requested_from_id, status);
CREATE INDEX idx_payment_requests_requester ON public.payment_requests(requester_id, status);
CREATE INDEX idx_payment_2fa_codes_user_id ON public.payment_2fa_codes(user_id, used, expires_at);
CREATE INDEX idx_transaction_chats_user_a ON public.transaction_chats(user_a_id);
CREATE INDEX idx_transaction_chats_user_b ON public.transaction_chats(user_b_id);
CREATE INDEX idx_transaction_messages_chat_id ON public.transaction_messages(chat_id, created_at);
CREATE INDEX idx_transaction_messages_payment_id ON public.transaction_messages(payment_id);
CREATE INDEX idx_notifications_user_id_read ON public.notifications(user_id, read);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_payment_methods_active ON public.payment_methods(is_active, sort_order);
CREATE INDEX idx_payments_method_id ON public.payments(payment_method_id);

-- ------------------------------------------
-- 18. Seed Data
-- ------------------------------------------

-- Seed Fee Rules (USD tiers)
INSERT INTO public.fee_rules (minimum_amount, maximum_amount, percentage, active) VALUES
(0.00, 49.99, 3.00, true),
(50.00, 499.99, 2.00, true),
(500.00, NULL, 1.00, true);

-- Seed Payment Methods
INSERT INTO public.payment_methods (code, display_name, icon_key, fee_percentage, fee_fixed, min_amount, max_amount, daily_limit, monthly_limit, config, is_active, sort_order) VALUES
('crypto', 'Crypto', 'crypto', 1.00, 0.00, 1.00, 50000.00, 10000.00, 100000.00,
  '{"networks": ["BTC", "ETH", "USDT", "USDC"], "instructions": "Send crypto to the provided wallet address. Funds are held in escrow until admin confirmation."}'::jsonb,
  true, 1),
('cashapp', 'Cash App', 'cashapp', 2.50, 0.00, 1.00, 10000.00, 5000.00, 50000.00,
  '{"handle": "$ortho-pay-escrow", "instructions": "Send payment to $ortho-pay-escrow on Cash App with your $SIVA tag in the note."}'::jsonb,
  true, 2),
('paypal', 'PayPal', 'paypal', 3.00, 0.30, 1.00, 10000.00, 5000.00, 50000.00,
  '{"email": "escrow@ortho-m8.com", "instructions": "Send PayPal payment to escrow@ortho-m8.com with your $SIVA tag in the memo."}'::jsonb,
  true, 3),
('venmo', 'Venmo', 'venmo', 2.50, 0.00, 1.00, 5000.00, 3000.00, 30000.00,
  '{"handle": "@ortho-pay-escrow", "instructions": "Send Venmo payment to @ortho-pay-escrow with your $SIVA tag in the note."}'::jsonb,
  true, 4);
