/**
 * 自訂工具 MCP Server
 *
 * 這個 MCP Server 整合所有自訂工具
 * 可以輕鬆新增更多工具到這個 server
 */

import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { pricingTool } from "../tools/pricingTool.js";

/**
 * 建立包含所有自訂工具的 MCP Server
 */
export const customToolsServer = createSdkMcpServer({
  name: "custom-tools",
  version: "1.0.0",
  tools: [
    pricingTool,
    // 未來可以在這裡新增更多工具
    // weatherTool,
    // calculatorTool,
    // etc...
  ],
});
