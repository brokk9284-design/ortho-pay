import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { Wallet, LedgerEntry, WalletReservation, BalanceReconciliation, LedgerCategory } from "@/types";
import type { IWalletService } from "./index";

export class WalletService implements IWalletService {
  async getBalances(walletId: string) {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("wallets")
      .select("total_received, total_sent, reserved_balance, pending_balance")
      .eq("wallet_id", walletId)
      .single();

    if (error || !data) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    const available = Number(data.total_received) - Number(data.total_sent) - Number(data.reserved_balance);
    return {
      available: Math.max(0, available),
      reserved: Number(data.reserved_balance),
      pending: Number(data.pending_balance),
    };
  }

  async reserveBalance(walletId: string, amount: number, reason: string): Promise<WalletReservation> {
    const supabase = await createSupabaseAdminClient();

    const { data: wallet, error: wErr } = await supabase
      .from("wallets")
      .select("total_received, total_sent, reserved_balance")
      .eq("wallet_id", walletId)
      .single();

    if (wErr || !wallet) throw new Error(`Wallet not found: ${walletId}`);

    const available = Number(wallet.total_received) - Number(wallet.total_sent) - Number(wallet.reserved_balance);
    if (available < amount) {
      throw new Error(`Insufficient available balance: have ${available}, need ${amount}`);
    }

    const newReserved = Number(wallet.reserved_balance) + amount;
    const { error: updateErr } = await supabase
      .from("wallets")
      .update({ reserved_balance: newReserved })
      .eq("wallet_id", walletId);

    if (updateErr) throw new Error(`Failed to reserve balance: ${updateErr.message}`);

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const { data: reservation, error: rErr } = await supabase
      .from("wallet_reservations")
      .insert({ wallet_id: walletId, amount, reason, expires_at: expiresAt })
      .select()
      .single();

    if (rErr || !reservation) throw new Error(`Failed to create reservation: ${rErr?.message}`);

    logger.info("Balance reserved", { walletId, amount, reason });
    return reservation as WalletReservation;
  }

  async releaseReserve(reservationId: string): Promise<void> {
    const supabase = await createSupabaseAdminClient();

    const { data: reservation, error } = await supabase
      .from("wallet_reservations")
      .select("wallet_id, amount, released")
      .eq("id", reservationId)
      .single();

    if (error || !reservation) throw new Error(`Reservation not found: ${reservationId}`);
    if (reservation.released) return;

    await supabase.from("wallet_reservations").update({ released: true }).eq("id", reservationId);

    const { data: wallet } = await supabase
      .from("wallets")
      .select("reserved_balance")
      .eq("wallet_id", reservation.wallet_id)
      .single();

    if (wallet) {
      const newReserved = Math.max(0, Number(wallet.reserved_balance) - Number(reservation.amount));
      await supabase.from("wallets").update({ reserved_balance: newReserved }).eq("wallet_id", reservation.wallet_id);
    }

    logger.info("Reserve released", { reservationId });
  }

  async debit(walletId: string, amount: number, category: string, reference: string): Promise<LedgerEntry> {
    const supabase = await createSupabaseAdminClient();

    const { data: wallet, error } = await supabase
      .from("wallets")
      .select("total_received, total_sent, reserved_balance, currency")
      .eq("wallet_id", walletId)
      .single();

    if (error || !wallet) throw new Error(`Wallet not found: ${walletId}`);

    const balanceBefore = Number(wallet.total_received) - Number(wallet.total_sent);
    const balanceAfter = balanceBefore - amount;

    const { data: entry, error: lErr } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: walletId,
        direction: "debit",
        debit: amount,
        credit: 0,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        currency: wallet.currency,
        category: category as LedgerCategory,
        reference,
      })
      .select()
      .single();

    if (lErr || !entry) throw new Error(`Failed to create ledger entry: ${lErr?.message}`);

    await supabase
      .from("wallets")
      .update({ total_sent: Number(wallet.total_sent) + amount })
      .eq("wallet_id", walletId);

    return entry as LedgerEntry;
  }

  async credit(walletId: string, amount: number, category: string, reference: string): Promise<LedgerEntry> {
    const supabase = await createSupabaseAdminClient();

    const { data: wallet, error } = await supabase
      .from("wallets")
      .select("total_received, total_sent, currency")
      .eq("wallet_id", walletId)
      .single();

    if (error || !wallet) throw new Error(`Wallet not found: ${walletId}`);

    const balanceBefore = Number(wallet.total_received) - Number(wallet.total_sent);
    const balanceAfter = balanceBefore + amount;

    const { data: entry, error: lErr } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: walletId,
        direction: "credit",
        credit: amount,
        debit: 0,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        currency: wallet.currency,
        category: category as LedgerCategory,
        reference,
      })
      .select()
      .single();

    if (lErr || !entry) throw new Error(`Failed to create ledger entry: ${lErr?.message}`);

    await supabase
      .from("wallets")
      .update({ total_received: Number(wallet.total_received) + amount })
      .eq("wallet_id", walletId);

    return entry as LedgerEntry;
  }

  async reconcile(walletId: string): Promise<BalanceReconciliation> {
    const supabase = await createSupabaseAdminClient();

    const { data: wallet } = await supabase
      .from("wallets")
      .select("total_received, total_sent")
      .eq("wallet_id", walletId)
      .single();

    if (!wallet) throw new Error(`Wallet not found: ${walletId}`);

    const { data: ledger } = await supabase
      .from("wallet_transactions")
      .select("credit, debit")
      .eq("wallet_id", walletId);

    const ledgerSum = (ledger || []).reduce((sum, e) => sum + (Number(e.credit) - Number(e.debit)), 0);
    const storedBalance = Number(wallet.total_received) - Number(wallet.total_sent);

    return {
      wallet_id: walletId,
      ledger_sum: ledgerSum,
      stored_balance: storedBalance,
      difference: ledgerSum - storedBalance,
      reconciled_at: new Date().toISOString(),
    };
  }

  async checkLimits(walletId: string, amount: number): Promise<boolean> {
    const supabase = await createSupabaseAdminClient();

    const { data: limit } = await supabase
      .from("wallet_limits")
      .select("single_transaction_limit, daily_limit")
      .eq("wallet_id", walletId)
      .single();

    if (!limit) return true;
    if (amount > Number(limit.single_transaction_limit)) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("wallet_transactions")
      .select("*", { count: "exact", head: true })
      .eq("wallet_id", walletId)
      .eq("direction", "debit")
      .gte("created_at", today.toISOString());

    return (count || 0) <= Number(limit.daily_limit);
  }

  async getWalletByUserId(userId: string): Promise<Wallet | null> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();
    return data as Wallet | null;
  }
}

export const walletService = new WalletService();
