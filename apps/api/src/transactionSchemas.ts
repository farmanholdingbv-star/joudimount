import { z } from "zod";

const emptyToUndef = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v);

export const optionalPositiveNumber = z.preprocess(emptyToUndef, z.coerce.number().positive().optional());

/** Optional number ≥ 0 (quantity, weight after rounding, etc.). */
export const optionalNonNegativeNumber = z.preprocess(emptyToUndef, z.coerce.number().nonnegative().optional());

export const optionalNonNegativeInt = z.preprocess(emptyToUndef, z.coerce.number().int().nonnegative().optional());

export const optionalDateIso = z.preprocess(emptyToUndef, z.string().optional());

export const optionalPostal = z.preprocess(emptyToUndef, z.string().max(120).optional());

export const goodsQualityEnum = z.enum(["new", "like_new", "used", "refurbished", "damaged", "mixed"]);

export const goodsUnitEnum = z.enum(["kg", "ton", "piece", "carton", "pallet", "cbm", "liter", "set"]);

export const optionalGoodsQuality = z.preprocess(emptyToUndef, goodsQualityEnum.optional());

export const optionalGoodsUnit = z.preprocess(emptyToUndef, goodsUnitEnum.optional());

export const createTransactionPayloadSchema = z.object({
  clientName: z.string().min(2),
  clientId: z.preprocess(emptyToUndef, z.string().optional()),
  shippingCompanyId: z.preprocess(emptyToUndef, z.string().optional()),
  shippingCompanyName: z.string().min(2),
  airwayBill: z.string().min(1),
  hsCode: z.string().min(2),
  goodsDescription: z.string().min(2),
  invoiceValue: z.coerce.number().positive(),
  originCountry: z.string().length(2),
  containerCount: optionalNonNegativeInt,
  goodsWeightKg: optionalNonNegativeNumber,
  invoiceToWeightRateAedPerKg: optionalPositiveNumber,
  containerArrivalDate: optionalDateIso,
  documentArrivalDate: optionalDateIso,
  documentPostalNumber: optionalPostal,
  goodsQuantity: optionalNonNegativeNumber,
  goodsQuality: optionalGoodsQuality,
  goodsUnit: optionalGoodsUnit,
});

export const updateTransactionPayloadSchema = z
  .object({
    clientName: z.string().min(2).optional(),
    clientId: z.preprocess(emptyToUndef, z.string().optional()),
    shippingCompanyId: z.preprocess(emptyToUndef, z.string().optional()),
    shippingCompanyName: z.string().min(2).optional(),
    airwayBill: z.string().min(1).optional(),
    hsCode: z.string().min(2).optional(),
    goodsDescription: z.string().min(2).optional(),
    invoiceValue: z.coerce.number().positive().optional(),
    originCountry: z.string().length(2).optional(),
    documentStatus: z.enum(["copy_received", "original_received", "telex_release"]).optional(),
    clearanceStatus: z
      .enum([
        "DRAFT",
        "SUBMITTED_TO_CUSTOMS",
        "RISK_ASSESSMENT",
        "GREEN_CHANNEL",
        "YELLOW_CHANNEL",
        "RED_CHANNEL",
        "XRAY_QUEUED",
        "XRAY_PASSED",
        "MANUAL_INSPECTION_REQUIRED",
        "PAYMENT_PENDING",
        "PAID",
        "E_RELEASE_ISSUED",
        "DELIVERED",
      ])
      .optional(),
    paymentStatus: z.enum(["pending", "paid"]).optional(),
    containerCount: optionalNonNegativeInt,
    goodsWeightKg: optionalNonNegativeNumber,
    invoiceToWeightRateAedPerKg: optionalPositiveNumber,
    containerArrivalDate: optionalDateIso,
    documentArrivalDate: optionalDateIso,
    documentPostalNumber: optionalPostal,
    goodsQuantity: optionalNonNegativeNumber,
    goodsQuality: optionalGoodsQuality,
    goodsUnit: optionalGoodsUnit,
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");
