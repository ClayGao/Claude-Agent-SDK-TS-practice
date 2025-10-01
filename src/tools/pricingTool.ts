/**
 * 飲料定價工具
 *
 * 這是一個自訂 MCP 工具的範例，展示如何：
 * 1. 使用 Zod 定義輸入 schema
 * 2. 實作工具邏輯
 * 3. 回傳格式化結果
 */

import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

/**
 * 飲料定價計算工具
 *
 * 支援計算單杯飲料的價格
 */
export const pricingTool = tool(
  "calculate_drink_price",
  "計算飲料價格。根據飲料類型和尺寸計算總價。必須提供 drink_type (coffee/tea/smoothie/juice) 和 size (small/medium/large) 參數。",
  // 使用 Zod 定義輸入 schema
  {
    drink_type: z.enum(["coffee", "tea", "smoothie", "juice"]).describe("飲料類型：coffee, tea, smoothie, juice"),
    size: z.enum(["small", "medium", "large"]).describe("尺寸：small, medium, large"),
    currency: z.enum(["USD", "TWD", "EUR", "JPY"]).optional().default("USD").describe("貨幣：USD, TWD, EUR, JPY（預設 USD）"),
    ice_level: z.enum(["no-ice", "less-ice", "normal", "extra-ice"]).optional().describe("冰量（可選）：no-ice, less-ice, normal, extra-ice"),
  },
  // Handler 函數：實際執行的邏輯
  async (args) => {
    try {
      // 定價表（USD 基礎價格）
      const basePrices = {
        coffee: { small: 3.5, medium: 4.5, large: 5.5 },
        tea: { small: 3.0, medium: 4.0, large: 5.0 },
        smoothie: { small: 5.0, medium: 6.5, large: 8.0 },
        juice: { small: 4.0, medium: 5.0, large: 6.0 },
      };

      // 匯率轉換
      const exchangeRates = {
        USD: 1,
        TWD: 31.5,
        EUR: 0.92,
        JPY: 149.5,
      };

      // 貨幣符號
      const currencySymbols = {
        USD: "$",
        TWD: "NT$",
        EUR: "€",
        JPY: "¥",
      };

      const currency = args.currency || "USD";
      const basePrice = basePrices[args.drink_type][args.size];
      const convertedPrice = basePrice * exchangeRates[currency];
      const symbol = currencySymbols[currency];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              drink: args.drink_type,
              size: args.size,
              currency: currency,
              ice_level: args.ice_level || "normal",
              price: `${symbol}${convertedPrice.toFixed(2)}`,
              message: `您點的 ${args.size} ${args.drink_type} 價格為 ${symbol}${convertedPrice.toFixed(2)} ${currency}`
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `錯誤: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);
