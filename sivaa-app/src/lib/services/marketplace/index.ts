import type { MarketplaceOrder, ProviderOffer, MarketDepth, ProviderAvailability, OrderSide, Currency, PaymentRail, MarketplacePool } from "@/types";

export interface IMarketplaceService {
  createOrder(userId: string, side: OrderSide, amount: number, currency: Currency, rail: PaymentRail, pool: MarketplacePool): Promise<MarketplaceOrder>;
  createOffer(providerId: string, orderId: string, feePercentage: number, feeFixed: number, settlementTimeHours: number, amountOffered: number): Promise<ProviderOffer>;
  getMarketDepth(currency: Currency, rail: PaymentRail, pool: MarketplacePool): Promise<MarketDepth | null>;
  getProviderAvailability(currency: Currency, rail: PaymentRail): Promise<ProviderAvailability[]>;
  cancelOrder(orderId: string, userId: string): Promise<void>;
  withdrawOffer(offerId: string, providerId: string): Promise<void>;
  getOrder(orderId: string): Promise<MarketplaceOrder | null>;
  getOffersForOrder(orderId: string): Promise<ProviderOffer[]>;
}
