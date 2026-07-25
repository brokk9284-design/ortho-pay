-- ORTHO-PAY: Seed mock payment methods with payment details
-- Run this in Supabase SQL Editor to populate payment_methods table
-- Admin can update these via the admin dashboard (Payment Methods tab)

-- Clear existing methods (optional — comment out if you want to keep existing)
-- DELETE FROM payment_methods WHERE code IN ('cashapp', 'venmo', 'paypal', 'zelle', 'applepay', 'binance', 'bitcoin', 'ethereum', 'usdt', 'stripe');

INSERT INTO payment_methods (code, display_name, icon_key, fee_percentage, fee_fixed, min_amount, max_amount, daily_limit, monthly_limit, config, is_active, sort_order)
VALUES
  -- Cash App
  (
    'cashapp',
    'Cash App',
    'cashapp',
    0.00,
    0.00,
    10.00,
    5000.00,
    10000.00,
    50000.00,
    '{"cashtag": "$orthopay-deposits", "qr_code": "https://cash.app/qr/orthopay-deposits", "instructions": "Send payment to $orthopay-deposits with your deposit reference in the note.", "support_email": "support@ortho-m8.com", "network": "Cash App", "recipient_name": "ORTHO-PAY Escrow Services"}',
    true,
    1
  ),
  -- Venmo
  (
    'venmo',
    'Venmo',
    'venmo',
    0.00,
    0.00,
    10.00,
    3000.00,
    7000.00,
    30000.00,
    '{"venmo_handle": "@orthopay-escrow", "qr_code": "https://venmo.com/qr/orthopay-escrow", "instructions": "Send payment to @orthopay-escrow with your deposit reference in the note.", "support_email": "support@ortho-m8.com", "network": "Venmo", "recipient_name": "ORTHO-PAY Escrow Services"}',
    true,
    2
  ),
  -- PayPal
  (
    'paypal',
    'PayPal',
    'paypal',
    0.00,
    0.00,
    10.00,
    10000.00,
    20000.00,
    100000.00,
    '{"paypal_email": "deposits@ortho-m8.com", "paypal_link": "https://paypal.me/orthopaydeposits", "instructions": "Send payment to deposits@ortho-m8.com or via paypal.me/orthopaydeposits. Include your deposit reference.", "support_email": "support@ortho-m8.com", "network": "PayPal", "recipient_name": "ORTHO-PAY Escrow Services"}',
    true,
    3
  ),
  -- Zelle
  (
    'zelle',
    'Zelle',
    'zelle',
    0.00,
    0.00,
    20.00,
    2000.00,
    5000.00,
    20000.00,
    '{"zelle_email": "deposits@ortho-m8.com", "instructions": "Send via Zelle to deposits@ortho-m8.com. Add your deposit reference in the memo.", "support_email": "support@ortho-m8.com", "network": "Zelle", "recipient_name": "ORTHO-PAY Escrow Services"}',
    true,
    4
  ),
  -- Apple Pay
  (
    'applepay',
    'Apple Pay',
    'applepay',
    0.00,
    0.00,
    10.00,
    5000.00,
    10000.00,
    50000.00,
    '{"apple_pay_merchant": "merchant.com.ortho-m8.deposits", "instructions": "Use Apple Pay to send payment to merchant.com.ortho-m8.deposits. Your deposit reference will be auto-attached.", "support_email": "support@ortho-m8.com", "network": "Apple Pay", "recipient_name": "ORTHO-PAY Escrow Services"}',
    true,
    5
  ),
  -- Stripe (card payment)
  (
    'stripe',
    'Credit/Debit Card (Stripe)',
    'stripe',
    2.90,
    0.30,
    10.00,
    10000.00,
    25000.00,
    100000.00,
    '{"stripe_payment_link": "https://buy.stripe.com/orthopay-deposits", "instructions": "Click the Stripe link to pay with your credit or debit card. Your deposit reference will be pre-filled.", "support_email": "support@ortho-m8.com", "network": "Stripe", "recipient_name": "ORTHO-PAY Escrow Services", "accepted_cards": ["Visa", "Mastercard", "Amex", "Discover"]}',
    true,
    6
  ),
  -- Binance Pay
  (
    'binance',
    'Binance Pay',
    'binance',
    0.00,
    0.00,
    20.00,
    50000.00,
    100000.00,
    500000.00,
    '{"binance_id": "758920134", "binance_pay_id": "758920134", "instructions": "Send Binance Pay to ID 758920134. Include your deposit reference in the message.", "support_email": "support@ortho-m8.com", "network": "Binance Pay", "recipient_name": "ORTHO-PAY Escrow Services"}',
    true,
    7
  ),
  -- Bitcoin
  (
    'bitcoin',
    'Bitcoin (BTC)',
    'bitcoin',
    0.00,
    0.00,
    50.00,
    100000.00,
    null,
    null,
    '{"btc_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", "network": "Bitcoin (BTC)", "instructions": "Send BTC to the address above. Use your deposit reference as the transaction label. Funds credited at current USD rate.", "support_email": "support@ortho-m8.com", "confirmations_required": 3, "recipient_name": "ORTHO-PAY Escrow Services"}',
    true,
    8
  ),
  -- Ethereum
  (
    'ethereum',
    'Ethereum (ETH)',
    'ethereum',
    0.00,
    0.00,
    50.00,
    100000.00,
    null,
    null,
    '{"eth_address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", "network": "Ethereum (ERC-20)", "instructions": "Send ETH to the address above. Use your deposit reference as the transaction memo. Funds credited at current USD rate.", "support_email": "support@ortho-m8.com", "confirmations_required": 12, "recipient_name": "ORTHO-PAY Escrow Services"}',
    true,
    9
  ),
  -- USDT (Tether)
  (
    'usdt',
    'USDT (Tether)',
    'usdt',
    0.00,
    0.00,
    20.00,
    50000.00,
    null,
    null,
    '{"usdt_address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", "network": "Tron (TRC-20)", "instructions": "Send USDT (TRC-20) to the address above. Include your deposit reference in the memo. 1 USDT = 1 USD.", "support_email": "support@ortho-m8.com", "confirmations_required": 20, "recipient_name": "ORTHO-PAY Escrow Services"}',
    true,
    10
  ),
  -- Bank Transfer (ACH)
  (
    'banktransfer',
    'Bank Transfer (ACH)',
    'bank',
    0.00,
    0.00,
    100.00,
    50000.00,
    100000.00,
    500000.00,
    '{"bank_name": "Mercury Bank", "account_name": "ORTHO-PAY Escrow Services LLC", "routing_number": "021000021", "account_number": "8843120945", "account_type": "Business Checking", "instructions": "Initiate an ACH transfer to the account above. Use your deposit reference as the memo/note.", "support_email": "support@ortho-m8.com", "network": "ACH", "recipient_name": "ORTHO-PAY Escrow Services"}',
    true,
    11
  )
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon_key = EXCLUDED.icon_key,
  fee_percentage = EXCLUDED.fee_percentage,
  fee_fixed = EXCLUDED.fee_fixed,
  min_amount = EXCLUDED.min_amount,
  max_amount = EXCLUDED.max_amount,
  daily_limit = EXCLUDED.daily_limit,
  monthly_limit = EXCLUDED.monthly_limit,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Verify insertion
SELECT code, display_name, fee_percentage, min_amount, max_amount, is_active, sort_order
FROM payment_methods
ORDER BY sort_order ASC;
