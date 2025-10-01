/**
 * Claude Agent SDK 進階互動範例
 *
 * 包含以下功能：
 * 1. 基本查詢 - 單次問答
 * 2. Streaming Input Mode - 多輪對話（生成器模式）
 * 3. 自訂系統提示 - 完全控制 Agent 行為
 * 4. 自訂 MCP 工具 - 建立自己的工具供 Agent 使用
 * 5. 互動式對話 - 持續對話模式
 */

import "dotenv/config";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { customToolsServer } from "./mcpServers/customToolsServer.js";

// ============================================
// 輔助函數
// ============================================

/**
 * 讀取使用者輸入
 */
async function getInput(prompt: string = "請輸入: "): Promise<string> {
  process.stdout.write(prompt);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  return new Promise<string>((resolve) => {
    process.stdin.once("data", (data) => {
      const input = data.toString().trim();
      process.stdin.pause();
      resolve(input);
    });
  });
}

/**
 * 印出訊息處理器（統一處理所有訊息類型）
 */
function printMessage(message: any, verbose: boolean = false) {
  if (verbose) {
    console.log(`\n[訊息類型: ${message.type}]`);
  }

  // 助手回應
  if (message.type === "assistant") {
    const textContent = message.message.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");

    if (textContent) {
      console.log("\n🤖 助手:", textContent);
    }

    // 顯示工具使用
    const toolUses = message.message.content.filter((c: any) => c.type === "tool_use");
    if (toolUses.length > 0 && verbose) {
      console.log("\n🔧 工具使用:");
      toolUses.forEach((tool: any) => {
        console.log(`   ${tool.name}(${JSON.stringify(tool.input)})`);
      });
    }
  }

  // 最終結果（含統計資訊）
  if (message.type === "result" && message.subtype === "success") {
    console.log("\n" + "=".repeat(60));
    console.log("📊 執行統計");
    console.log("=".repeat(60));
    console.log(`⏱️  執行時間: ${message.duration_ms}ms (API: ${message.duration_api_ms}ms)`);
    console.log(`🔄 對話輪數: ${message.num_turns}`);
    console.log(`💰 總成本: $${message.total_cost_usd.toFixed(4)}`);
    console.log(`📝 Token 使用: ${message.usage.input_tokens} in / ${message.usage.output_tokens} out`);
    console.log("\n✅ 最終結果:");
    console.log(message.result);
  }

  // 錯誤處理
  if (message.type === "result" && message.subtype === "error") {
    console.error("\n❌ 執行錯誤:", message.error);
  }
}

// ============================================
// 範例 1: 簡單查詢
// ============================================
async function runSimpleQuery() {
  console.log("\n▶️  執行: 簡單查詢範例\n");

  for await (const message of query({
    prompt: "計算 (123 + 456) × 2 的結果",
    options: {
      maxTurns: 3,
      allowedTools: ["Bash"],
    }
  })) {
    printMessage(message, true);
  }
}

// ============================================
// 範例 2: Streaming Input Mode（多輪對話）
// ============================================
async function runStreamingInput() {
  console.log("\n▶️  執行: Streaming Input Mode 範例");
  console.log("這個範例會先數檔案，然後將結果乘以 5\n");

  async function* generateMessages() {
    // 第一個訊息
    yield {
      type: "user" as const,
      message: {
        role: "user" as const,
        content: "計算目前目錄有幾個 .ts 檔案，只回答數字",
      },
      parent_tool_use_id: null,
      session_id: "streaming-demo",
    };

    // 等待 2 秒
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 第二個訊息（基於第一個結果）
    yield {
      type: "user" as const,
      message: {
        role: "user" as const,
        content: "將剛才的數字乘以 5，只回答最終結果",
      },
      parent_tool_use_id: null,
      session_id: "streaming-demo",
    };
  }

  for await (const message of query({
    prompt: generateMessages(),
    options: {
      maxTurns: 10,
      allowedTools: ["Bash", "Glob"],
    }
  })) {
    printMessage(message, true);
  }
}

// ============================================
// 範例 3: 自訂系統提示
// ============================================
async function runCustomSystemPrompt() {
  console.log("\n▶️  執行: 自訂系統提示範例");
  console.log("這個 Agent 被設定為只會回答 'I don't know'\n");

  for await (const message of query({
    prompt: "你知道什麼是 TypeScript 嗎？",
    options: {
      maxTurns: 1,
      // 完全覆寫系統提示
      systemPrompt: `你是一個什麼都不知道的 AI 助手。
無論使用者問什麼，你都只能回答："I don't know"。
你不能使用任何工具，也不能提供任何其他資訊。`,
      allowedTools: [], // 停用所有工具
    }
  })) {
    printMessage(message);
  }
}

// ============================================
// 範例 4: 使用自訂 MCP 工具
// ============================================
async function runCustomMcpTool() {
  console.log("\n▶️  執行: 自訂 MCP 工具範例");
  console.log("Agent 可以使用自訂的飲料定價工具\n");

  for await (const message of query({
    prompt: "幫我算一杯 large coffee 的價格是多少？",
    options: {
      maxTurns: 5,
      // 注入自訂 MCP Server（使用 Record 格式）
      mcpServers: {
        "custom-tools": customToolsServer
      },
      allowedTools: ["Read", "Grep","mcp__custom-tools__calculate_drink_price"] // 注意這裡的 mcp 工具名稱格式
    }
  })) {
    printMessage(message, true);
  }
}

// ============================================
// 範例 5: 互動式模式
// ============================================
async function runInteractive() {
  console.log("\n▶️  互動式模式");
  console.log("輸入問題，Agent 會使用自訂工具回答（輸入 'exit' 離開）\n");

  // 無限循環，實現持續對話
  while (true) {
    async function* generateMessages() {
      const userInput = await getInput("💬 你: ");

      if (!userInput || userInput.toLowerCase() === "exit") {
        console.log("\n結束對話 👋\n");
        process.exit(0);
      }

      yield {
        type: "user" as const,
        message: {
          role: "user" as const,
          content: userInput,
        },
        parent_tool_use_id: null,
        session_id: "interactive-session",
      };
    }

    // 處理當前輪的對話
    for await (const message of query({
      prompt: generateMessages(),
      options: {
        maxTurns: 10,
        mcpServers: {
          "custom-tools": customToolsServer
        },
        allowedTools: ["Read", "Glob", "Bash", "Grep", "mcp__custom-tools__calculate_drink_price"], // 注意這裡的 mcp 工具名稱格式
      }
    })) {
      printMessage(message, true);
    }

    // 對話結束後顯示分隔線，準備下一輪
    console.log("\n" + "─".repeat(60) + "\n");
  }
}

// ============================================
// 互動式選單
// ============================================
async function showMenu() {
  console.log(`
╔════════════════════════════════════════════╗
║   Claude Agent SDK 進階範例              ║
╚════════════════════════════════════════════╝

請選擇要執行的範例：

  1. Simple Query         - 基本查詢範例
  2. Streaming Input      - Streaming Input 多輪對話
  3. Custom Prompt        - 自訂系統提示
  4. MCP Tool             - 自訂 MCP 工具
  5. Interactive Mode     - 互動式對話
  0. Exit                 - 離開

提示：你也可以直接執行 npm run demo:<模式>
`);

  const choice = await getInput("請輸入選項 (0-5): ");

  switch (choice) {
    case "1":
      await runSimpleQuery();
      break;
    case "2":
      await runStreamingInput();
      break;
    case "3":
      await runCustomSystemPrompt();
      break;
    case "4":
      await runCustomMcpTool();
      break;
    case "5":
      await runInteractive();
      break;
    case "0":
      console.log("\n再見！👋\n");
      process.exit(0);
    default:
      console.log("\n⚠️  無效的選項，請重新選擇\n");
      await showMenu();
  }
}

// ============================================
// 主程式
// ============================================
(async () => {
  try {
    // 如果有命令列參數，直接執行對應範例
    const mode = process.argv[2];

    if (mode) {
      switch (mode) {
        case "simple":
          await runSimpleQuery();
          break;
        case "streaming":
          await runStreamingInput();
          break;
        case "custom-prompt":
          await runCustomSystemPrompt();
          break;
        case "mcp-tool":
          await runCustomMcpTool();
          break;
        case "interactive":
          await runInteractive();
          break;
        default:
          console.log(`\n⚠️  未知模式: ${mode}\n`);
          await showMenu();
      }
    } else {
      // 沒有參數，顯示互動式選單
      await showMenu();
    }
  } catch (error) {
    console.error("\n❌ 發生錯誤:", error);
    process.exit(1);
  }
})();
