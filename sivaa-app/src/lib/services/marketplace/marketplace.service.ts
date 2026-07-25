import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { publish } from "@/lib/events/event-bus";
import type { MarketplaceOrder, ProviderOffer, MarketDepth, ProviderAvailability, OrderSide, Currency, PaymentRail, MarketplacePool } from "@/types";
import type { IMarketplaceService } from "./index";
import { cacheSet, cacheGet, cacheDelete, buildCacheKey } from "@/lib/redis";

export class MarketplaceService implements IMarketplaceService {
  async createOrder(
    userId: string,
    side: OrderSide,
    amount: number,
    currency: Currency,
    rail: PaymentRail,
    pool: MarketplacePool
  ): Promise<MarketplaceOrder> {
    const supabase = await createSupabaseAdminClient();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("marketplace_orders")
      .insert({
        user_id: userId,
        side,
        amount,
        currency,
        payment_rail: rail,
        pool_type: pool,
        status: "open",
        matched_amount: 0,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to create order: ${error?.message}`);

    await supabase.from("matching_queue").insert({ order_id: data.id, priority_score: 0 });

    await cacheDelete(buildCacheKey("market_depth", currency, rail, pool));

    await publish("ESCROW_CREATED", { orderId: data.id, side, amount, currency }, userId);

    logger.info("Marketplace order created", { orderId: data.id, userId, side, amount });
    return data as MarketplaceOrder;
  }

  async createOffer(
    providerId: string,
    orderId: string,
    feePercentage: number,
    feeFixed: number,
    settlementTimeHours: number,
    amountOffered: number
  ): Promise<ProviderOffer> {
    const supabase = await createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("provider_offers")
      .insert({
        order_id: orderId,
        provider_id: providerId,
        fee_percentage: feePercentage,
        fee_fixed: feeFixed,
        settlement_time_hours: settlementTimeHours,
        amount_offered: amountOffered,
        status: "pending",
      })
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to create offer: ${error?.message}`);

    logger.info("Provider offer created", { offerId: data.id, orderId, providerId });
    return data as ProviderOffer;
  }

  async getMarketDepth(currency: Currency, rail: PaymentRail, pool: MarketplacePool): Promise<MarketDepth | null> {
    const cacheKey = buildCacheKey("market_depth", currency, rail, pool);
    const cached = await cacheGet<MarketDepth>(cacheKey);
    if (cached) return cached;

    const supabase = await createSupabaseAdminClient();
    const { count: buyVolume } = await supabase
      .from("marketplace_orders")
      .select("*", { count: "exact", head: true })
      .eq("side", "buy")
      .eq("status", "open")
      .eq("currency", currency)
      .eq("payment_rail", rail)
      .eq("pool_type", pool);

    const { count: sellVolume } = await supabase
      .from("marketplace_orders")
      .select("*", { count: "exact", head: true })
      .eq("side", "sell")
      .eq("status", "open")
      .eq("currency", currency)
      .eq("payment_rail", rail)
      .eq("pool_type", pool);

    const { count: providerCount } = await supabase
      .from("provider_availability")
      .select("*", { count: "exact", head: true })
      .eq("online", true)
      .eq("currency", currency);

    const depth: MarketDepth = {
      currency,
      payment_rail: rail,
      pool_type: pool,
      buy_volume: buyVolume || 0,
      sell_volume: sellVolume || 0,
      provider_count: providerCount || 0,
      updated_at: new Date().toISOString(),
    };

    await cacheSet(cacheKey, depth, 60);
    return depth;
  }

  async getProviderAvailability(currency: Currency, rail: PaymentRail): Promise<ProviderAvailability[]> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("provider_availability")
      .select("*")
      .eq("online", true)
      .eq("currency", currency)
      .contains("payment_rails", [rail]);

    return (data || []) as ProviderAvailability[];
  }

  async cancelOrder(orderId: string, userId: string): Promise<void> {
    const supabase = await createSupabaseAdminClient();
    const { data: order } = await supabase
      .from("marketplace_orders")
      .select("user_id, status")
      .eq("id", orderId)
      .single();

    if (!order) throw new Error("Order not found");
    if (order.user_id !== userId) throw new Error("Not authorized to cancel this order");
    if (order.status !== "open") throw new Error("Only open orders can be cancelled");

    await supabase.from("marketplace_orders").update({ status: "cancelled" }).eq("id", orderId);
    await supabase.from("matching_queue").delete().eq("order_id", orderId);

    logger.info("Order cancelled", { orderId, userId });
  }

  async withdrawOffer(offerId: string, providerId: string): Promise<void> {
    const supabase = await createSupabaseAdminClient();
    const { data: offer } = await supabase
      .from("provider_offers")
      .select("provider_id, status")
      .eq("id", offerId)
      .single();

    if (!offer) throw new Error("Offer not found");
    if (offer.provider_id !== providerId) throw new Error("Not authorized");
    if (offer.status !== "pending") throw new Error("Only pending offers can be withdrawn");

    await supabase.from("provider_offers").update({ status: "withdrawn" }).eq("id", offerId);
    logger.info("Offer withdrawn", { offerId, providerId });
  }

  async getOrder(orderId: string): Promise<MarketplaceOrder | null> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("marketplace_orders")
      .select("*")
      .eq("id", orderId)
      .single();
    return data as MarketplaceOrder | null;
  }

  async getOffersForOrder(orderId: string): Promise<ProviderOffer[]> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("provider_offers")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    return (data || []) as ProviderOffer[];
  }
}

export const marketplaceService = new MarketplaceService();
