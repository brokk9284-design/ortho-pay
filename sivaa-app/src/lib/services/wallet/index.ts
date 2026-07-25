import type { Wallet, LedgerEntry, WalletReservation, Currency, BalanceReconciliation } from "@/types";

export interface IWalletService {
  getBalances(walletId: string): Promise<{ available: number; reserved: number; pending: number }>;
  reserveBalance(walletId: string, amount: number, reason: string): Promise<WalletReservation>;
  releaseReserve(reservationId: string): Promise<void>;
  debit(walletId: string, amount: number, category: string, reference: string): Promise<LedgerEntry>;
  credit(walletId: string, amount: number, category: string, reference: string): Promise<LedgerEntry>;
  reconcile(walletId: string): Promise<BalanceReconciliation>;
  checkLimits(walletId: string, amount: number): Promise<boolean>;
  getWalletByUserId(userId: string): Promise<Wallet | null>;
}
