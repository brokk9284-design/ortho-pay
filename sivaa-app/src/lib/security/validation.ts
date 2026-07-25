import { z } from "zod";

export const schemas = {
  createOrder: z.object({
    side: z.enum(["buy", "sell"]),
    amount: z.number().positive().max(1000000),
    currency: z.enum(["USD", "EUR", "GBP", "CAD"]),
    payment_rail: z.enum(["faster_payments", "sepa", "sepa_instant", "ach", "interac", "internal"]),
    pool_type: z.enum(["instant", "standard", "business", "merchant", "premium", "institutional"]).optional(),
    description: z.string().max(500).optional(),
  }),

  createOffer: z.object({
    order_id: z.string().uuid(),
    fee_percentage: z.number().min(0).max(100),
    fee_fixed: z.number().min(0).optional().default(0),
    settlement_time_hours: z.number().positive().max(168),
    amount_offered: z.number().positive(),
    message: z.string().max(1000).optional(),
  }),

  createEscrow: z.object({
    provider_id: z.string().uuid().optional().nullable(),
    type: z.enum(["manual", "automatic", "delivery", "digital_goods", "milestone", "subscription", "multi_party"]).optional(),
    gross_amount: z.number().positive().max(10000000),
    fee_amount: z.number().min(0).optional().default(0),
    currency: z.enum(["USD", "EUR", "GBP", "CAD"]),
    payment_rail: z.enum(["faster_payments", "sepa", "sepa_instant", "ach", "interac", "internal"]),
  }),

  escrowAction: z.object({
    action: z.enum(["release", "refund", "fund"]),
  }),

  createDispute: z.object({
    escrow_id: z.string().uuid(),
    reason: z.string().min(1).max(200),
    description: z.string().min(1).max(5000),
    initiated_by: z.enum(["buyer", "provider", "merchant", "business", "administrator"]).optional(),
  }),

  disputeMessage: z.object({
    action: z.literal("message"),
    message: z.string().min(1).max(5000),
  }),

  disputeEvidence: z.object({
    action: z.literal("evidence"),
    file_url: z.string().url(),
    file_type: z.enum(["image", "pdf", "video", "receipt", "tracking", "log", "other"]),
    description: z.string().max(2000).optional(),
  }),

  calculateFee: z.object({
    amount: z.number().positive().max(10000000),
    currency: z.enum(["USD", "EUR", "GBP", "CAD"]),
    payment_rail: z.enum(["faster_payments", "sepa", "sepa_instant", "ach", "interac", "internal"]),
    pool_type: z.enum(["instant", "standard", "business", "merchant", "premium", "institutional"]).optional(),
    requested_priority: z.boolean().optional(),
  }),
};

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validationErrorResponse(error: z.ZodError) {
  return Response.json(
    {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
        details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        retryable: false,
      },
    },
    { status: 400 }
  );
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

export function validateAmount(amount: number): boolean {
  return amount > 0 && amount <= 10000000 && Number.isFinite(amount);
}

export function validateCurrency(currency: string): boolean {
  return ["USD", "EUR", "GBP", "CAD"].includes(currency);
}

export async function validateIdempotencyKey(key: string): Promise<boolean> {
  return /^[a-zA-Z0-9\-_]{1,128}$/.test(key);
}
