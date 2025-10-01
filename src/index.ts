/**
 * Claude Agent SDK 互動式範例
 *
 * 這個範例展示如何使用 Claude Agent SDK 建立一個可以接收使用者輸入的 AI Agent。
 * Agent 可以使用多種工具來回答問題，例如讀取檔案、執行命令等。
 */

// 1. 載入環境變數配置
// dotenv/config 會自動讀取 .env 檔案並將其中的變數（如 ANTHROPIC_API_KEY）載入到 process.env
import "dotenv/config";

// 2. 導入 Claude Agent SDK 核心函數
// query 是 SDK 的主要函數，用於與 Claude AI 進行對話和互動
import { query } from "@anthropic-ai/claude-agent-sdk";

// 3. 導入 Node.js 內建的 readline 模組（Promise 版本）
// 用於在終端機中讀取使用者的輸入
import * as readline from "readline/promises";

// 4. 建立 readline 介面
// 設定標準輸入（stdin）和標準輸出（stdout），讓程式能與使用者互動
const rl = readline.createInterface({
  input: process.stdin,  // 從終端機讀取輸入
  output: process.stdout, // 輸出到終端機
});

/**
 * 異步生成器函數：產生使用者訊息
 *
 * 為什麼使用 async function*？
 * - async: 因為需要等待使用者輸入（非同步操作）
 * - function*: 生成器可以 yield 多個訊息，支援多輪對話
 *
 * 這個函數會：
 * 1. 等待使用者輸入問題
 * 2. 將輸入包裝成符合 SDK 要求的 SDKUserMessage 格式
 * 3. yield 出去給 query 函數使用
 */
async function* generateMessages() {
  // 等待使用者輸入（這是一個 Promise，會暫停直到使用者按下 Enter）
  const userInput = await rl.question("請輸入你的問題: ");

  // 產生符合 SDK 格式的使用者訊息
  yield {
    type: "user" as const,  // 訊息類型：使用者訊息
    message: {
      role: "user" as const,  // 角色：使用者
      content: userInput,      // 訊息內容：使用者輸入的文字
    },
    // parent_tool_use_id: 如果這個訊息是回應某個工具的執行結果，則填入該工具的 ID
    // 這裡是 null 因為這是主動的使用者輸入，不是回應工具
    parent_tool_use_id: null,

    // session_id: 會話 ID，用於追蹤同一個對話
    // 在實際應用中，可以用 UUID 或其他方式生成唯一 ID
    session_id: "session_1",
  };
}

console.log("Starting Claude Agent SDK interactive example...\n");

/**
 * 主要執行流程：處理串流回應
 *
 * for await...of 語法說明：
 * - query() 會回傳一個異步迭代器（AsyncIterator）
 * - 每當 AI 產生新的訊息（如思考、工具使用、回應等），都會產生一個 message
 * - for await 會自動處理這些異步訊息，逐一處理
 */
for await (const message of query({
  // prompt: 可以是字串或異步訊息生成器
  // 使用生成器的好處是可以動態產生訊息，支援多輪對話
  prompt: generateMessages(),

  // options: 配置 Agent 的行為
  options: {
    // maxTurns: 限制最多執行幾輪對話
    // 為什麼需要限制？防止 AI 進入無限循環，控制成本和執行時間
    maxTurns: 10,

    // allowedTools: 限制 AI 可以使用哪些工具
    // 為什麼要限制？安全性考量，只開放必要的工具
    // - Read: 讀取檔案
    // - Glob: 搜尋檔案（使用 glob 模式）
    // - Bash: 執行 shell 命令
    // - Grep: 在檔案中搜尋內容
    allowedTools: ["Read", "Glob", "Bash", "Grep"],
  },
})) {
  /**
   * 處理不同類型的訊息
   *
   * message.type 可能的值：
   * - "system": 系統訊息
   * - "user": 使用者訊息
   * - "assistant": AI 助手的訊息
   * - "result": 最終結果
   */

  // 處理最終結果
  if (message.type === "result" && message.subtype === "success") {
    console.log("\n=== 最終結果 ===");
    console.log(message.result);
  }
  // 處理 AI 助手的回應
  else if (message.type === "assistant") {
    // message.content 是一個陣列，可能包含多種類型：
    // - { type: "text", text: "..." }: 純文字內容
    // - { type: "tool_use", ... }: 工具使用請求
    // 這裡我們只提取並顯示文字內容
    const textContent = message.message.content
      .filter((c: any) => c.type === "text")  // 只保留文字類型的內容
      .map((c: any) => c.text)                // 提取文字
      .join("\n");                            // 合併成一個字串

    // 只有在有文字內容時才顯示
    if (textContent) {
      console.log("\n助手:", textContent);
    }
  }
}

// 關閉 readline 介面，釋放資源
rl.close();