# Claude Agent SDK 學習範例

這是一個完整的 **Claude Agent SDK** 學習專案，涵蓋從基礎到進階的所有功能。包含 **5 個實戰範例**，讓你深入了解如何建立強大的 AI Agent。

## 🎯 專案特色

✅ **5 種範例模式** - 從簡單查詢到自訂 MCP 工具
✅ **完整註解** - 每行程式碼都有詳細說明
✅ **實戰導向** - 基於 [Better Stack 影片教學](https://www.youtube.com/watch?v=NsROagHaKxA) 的最佳實踐
✅ **即開即用** - 一鍵執行不同模式的範例

---

## 📖 目錄

- [快速開始](#快速開始)
- [5 種範例模式](#5-種範例模式)
- [什麼是 Claude Agent SDK？](#什麼是-claude-agent-sdk)
- [核心概念](#核心概念)
- [環境設定](#環境設定)
- [詳細使用說明](#詳細使用說明)
- [自訂 MCP 工具深入解析](#自訂-mcp-工具深入解析)
- [參考資源](#參考資源)

---

## 🚀 快速開始

```bash
# 1. 安裝依賴
npm install

# 2. 設定 API Key
echo "ANTHROPIC_API_KEY=your-api-key-here" > .env

# 3. 執行程式（會顯示互動式選單）
npm run dev

# 🎯 互動式選單
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

# 或直接執行特定範例
npm run demo:simple          # 簡單查詢
npm run demo:streaming       # 多輪對話
npm run demo:custom-prompt   # 自訂系統提示
npm run demo:mcp-tool        # 自訂 MCP 工具
npm run demo:interactive     # 互動式對話
```

---

## 🎮 5 種範例模式

### 1. 📝 Simple Query（簡單查詢）

**用途**: 最基本的單次問答模式

```bash
npm run demo:simple
```

**特色**:

- 傳入字串 prompt，立即獲得回應
- 顯示完整執行統計（Token usage, cost, duration）
- 展示工具使用情況

**範例程式碼**:

```typescript
for await (const message of query({
  prompt: "計算 (123 + 456) × 2 的結果",
  options: {
    maxTurns: 3,
    allowedTools: ["Bash"],
  },
})) {
  // 處理回應並顯示統計
}
```

---

### 2. 🔄 Streaming Input Mode（串流輸入模式）

**用途**: 多輪對話，支援動態產生訊息

```bash
npm run demo:streaming
```

**特色**:

- 使用異步生成器（`async function*`）逐步產生訊息
- 支援基於前一輪結果的後續問題
- Anthropic 官方推薦的進階模式

**範例程式碼**:

```typescript
async function* generateMessages() {
  // 第一輪：數檔案
  yield {
    type: "user",
    message: { role: "user", content: "計算目前目錄有幾個 .ts 檔案" },
    parent_tool_use_id: null,
    session_id: "streaming-demo",
  };

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 第二輪：基於結果做計算
  yield {
    type: "user",
    message: { role: "user", content: "將剛才的數字乘以 5" },
    parent_tool_use_id: null,
    session_id: "streaming-demo",
  };
}
```

---

### 3. 🎨 Custom System Prompt（自訂系統提示）

**用途**: 完全控制 Agent 的行為和人格

```bash
npm run demo:custom-prompt
```

**特色**:

- 覆寫預設的系統提示
- 自訂 Agent 的回應風格
- 可以限制或強化特定行為

**範例程式碼**:

```typescript
for await (const message of query({
  prompt: "你知道什麼是 TypeScript 嗎？",
  options: {
    systemPrompt: `你是一個什麼都不知道的 AI 助手。
無論使用者問什麼，你都只能回答："I don't know"。`,
    allowedTools: [], // 停用所有工具
  },
})) {
  // Agent 只會回答 "I don't know"
}
```

---

### 4. 🛠️ Custom MCP Tool（自訂 MCP 工具）

**用途**: 建立自己的工具供 Agent 使用

```bash
npm run demo:mcp-tool
```

**特色**:

- 使用 `tool()` 函數定義工具
- Zod schema 驗證輸入參數
- 完整的工具生命週期管理

**範例**:
這個範例建立了一個**飲料定價計算器**，Agent 可以：

- 根據飲料類型（咖啡、茶、果汁、冰沙）計算價格
- 支援不同尺寸（小、中、大）
- 自動加總多個項目

**程式碼結構**:

```typescript
// 1. 定義工具
const pricingTool = tool(
  "calculate_drink_price",
  "計算飲料價格",
  {
    drink_type: z.enum(["coffee", "tea", "smoothie", "juice"]),
    size: z.enum(["small", "medium", "large"]),
  },
  async (args) => {
    // 實作定價邏輯
    return { content: [{ type: "text", text: "價格計算結果" }] };
  }
);

// 2. 建立 MCP Server
const customMcpServer = createSdkMcpServer({
  name: "custom-tools",
  version: "1.0.0",
  tools: [pricingTool],
});

// 3. 注入到 Agent
for await (const message of query({
  prompt: "我想點一杯大杯咖啡和一杯中杯果汁，總共多少錢？",
  options: {
    mcpServers: {
      "custom-tools": customMcpServer  // ⚠️ 注意：使用 Record 格式，key 是 server 名稱
    },
    allowedTools: ["mcp__custom-tools__calculate_drink_price"],  // MCP 工具格式：mcp__<server-name>__<tool-name>
  },
})) {
  // Agent 會自動使用工具並回答
}
```

---

### 5. 💬 Interactive Mode（互動式模式）

**用途**: 與 Agent 進行即時對話

```bash
npm run dev
# 或
npm run demo:interactive
```

**特色**:

- 持續接收使用者輸入
- 整合所有可用工具（包括自訂工具）
- 最接近實際應用場景

---

## 什麼是 Claude Agent SDK？

**Claude Agent SDK** 是 Anthropic 提供的官方 SDK，讓開發者能夠程式化地建立具有 Claude Code 能力的 AI Agent。

### 主要特色

- **🔧 豐富的工具生態系統**: 支援檔案操作、程式碼執行、網頁搜尋等多種工具
- **🛡️ 細緻的權限控制**: 可精確控制 Agent 能使用哪些工具和存取哪些資源
- **💬 自動化上下文管理**: 自動處理對話歷史和上下文壓縮
- **🔄 串流回應**: 即時接收 AI 的思考過程和回應
- **🌐 多平台支援**: 支援 Claude API、Amazon Bedrock、Google Vertex AI

### 使用場景

Claude Agent SDK 適合用於建立：

- **SRE Agent**: 診斷生產環境問題
- **安全審查機器人**: 自動化程式碼安全審查
- **客戶支援助手**: 智能客服系統
- **內容創作工具**: 自動化內容生成
- **法律/財務顧問**: 專業領域的 AI 助手

---

## 核心概念

### 1. Query 函數

`query()` 是 SDK 的核心函數，用於與 Claude AI 互動：

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "你的問題", // 字串或異步生成器
  options: {
    maxTurns: 10,
    allowedTools: ["Read", "Bash"],
  },
})) {
  // 處理串流回應
}
```

### 2. 訊息格式 (SDKUserMessage)

```typescript
{
  type: "user",              // 訊息類型
  message: {
    role: "user",           // 角色
    content: "訊息內容"     // 內容（字串或陣列）
  },
  parent_tool_use_id: null, // 父工具 ID（若有）
  session_id: "session_1"   // 會話 ID
}
```

### 2.1 深入理解 Message Roles 🎭

在 Claude Agent SDK 中，對話由不同「角色」的訊息組成。理解這些角色的用途和最佳實踐，能幫助你更有效地建構 AI Agent。

#### 📌 Claude Agent SDK 的三種核心 Role

| Role          | 在 SDK 中的表現                       | 用途                                      | Agent SDK 範例                       |
| ------------- | ------------------------------------- | ----------------------------------------- | ------------------------------------ |
| **System**    | `options.systemPrompt`                | 設定 Agent 的全域角色、專業領域、行為準則 | `systemPrompt: "你是資深財務分析師"` |
| **User**      | `prompt` 參數或 `SDKUserMessage`      | 使用者的輸入和具體任務                    | `prompt: "幫我分析這份財報"`         |
| **Assistant** | `SDKAssistantMessage`（SDK 自動處理） | Claude 的回應和工具執行結果               | SDK 自動生成                         |

---

#### 🌟 System Prompt：全域角色設定

**在 Agent SDK 中，System Prompt 透過 `options.systemPrompt` 參數設定**，用於定義 Agent 的整體行為和專業定位。

##### 為什麼要用 System Prompt？

System prompt 是**最強大的客製化方式**，可以：

- 🎯 設定專業領域角色（律師、醫師、工程師）
- 📏 定義回應風格和語氣
- 🔍 提高特定場景的準確度

##### Agent SDK 實例：角色設定的威力

<details>
<summary>❌ 沒有 System Prompt（使用預設 Agent 行為）</summary>

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "審查這份合約",
  options: {
    maxTurns: 3,
    allowedTools: ["Read", "Grep"],
  },
})) {
  // 結果：一般性的合約概述
}
```

</details>

<details>
<summary>✅ 有 System Prompt（專業深度分析）</summary>

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "審查這份合約",
  options: {
    maxTurns: 5,
    systemPrompt: "你是一位擁有 20 年經驗的企業法務總監，專精於合約風險評估。",
    allowedTools: ["Read", "Grep", "Bash"],
  },
})) {
  // 結果：深入的法律分析、潛在風險、具體修改建議
}
```

</details>

##### System Prompt 最佳實踐（Agent SDK）

```typescript
// ✅ 推薦：具體、詳細的角色描述
for await (const message of query({
  prompt: "分析這份財報數據",
  options: {
    systemPrompt: `你是一位資深數據科學家，任職於財富 500 強公司。
你的專長包括：
- 統計分析和假設檢定
- 機器學習模型選擇
- 商業洞察提煉

請始終提供：
1. 數據驅動的見解
2. 統計顯著性評估
3. 可行動的商業建議`,
    maxTurns: 10,
    allowedTools: ["Read", "Bash", "Grep"],
  },
})) {
  // 處理回應
}

// ❌ 避免：過於模糊
for await (const message of query({
  prompt: "幫我分析數據",
  options: {
    systemPrompt: "你是一個助手", // 太籠統，沒有專業性
  },
})) {
  // ...
}
```

##### 本專案的實際範例

從 `src/index.ts:149-167` 的自訂系統提示範例：

```typescript
async function runCustomSystemPrompt() {
  for await (const message of query({
    prompt: "你知道什麼是 TypeScript 嗎？",
    options: {
      maxTurns: 1,
      // 完全覆寫系統提示
      systemPrompt: `你是一個什麼都不知道的 AI 助手。
無論使用者問什麼，你都只能回答："I don't know"。
你不能使用任何工具，也不能提供任何其他資訊。`,
      allowedTools: [], // 停用所有工具
    },
  })) {
    console.log(message);
  }
}
```

**結果**：即使被問到 TypeScript，Agent 也只會回答 "I don't know"

---

#### 👤 User Role：具體任務和問題

**在 Agent SDK 中，User role 透過 `prompt` 參數或 `SDKUserMessage` 傳遞**，代表人類使用者的輸入。

##### 特點

- 📝 可包含**文字**內容（Agent SDK 主要處理文字任務）
- 🔄 在 Streaming Input Mode 中可以動態生成多輪對話
- 🎯 應該聚焦於具體任務，而非全域設定

##### User vs System 的分工（Agent SDK）

```typescript
// ✅ 正確的分工
for await (const message of query({
  prompt: "幫我重構 src/utils.ts 的程式碼", // 具體任務
  options: {
    systemPrompt: "你是一位 Python 專家，專注於程式碼品質和最佳實踐。", // 全域角色
    allowedTools: ["Read", "Edit"],
    maxTurns: 5,
  },
})) {
  // ...
}

// ❌ 錯誤：將角色設定放在 prompt
for await (const message of query({
  prompt: "你是 Python 專家。幫我重構 src/utils.ts 的程式碼", // 混在一起
  options: {
    allowedTools: ["Read", "Edit"],
  },
})) {
  // ...
}
```

##### 多輪對話範例：Streaming Input Mode

從 `src/index.ts:104-145` 的 Streaming Input 範例：

```typescript
async function runStreamingInput() {
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
    await new Promise((resolve) => setTimeout(resolve, 2000));

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
    prompt: generateMessages(), // 動態生成多輪對話
    options: {
      maxTurns: 10,
      allowedTools: ["Bash", "Glob"],
    },
  })) {
    console.log(message);
  }
}
```

**這種模式允許你在執行時動態決定下一個問題**

---

#### 🤖 Assistant Role：Agent 的回應（SDK 自動處理）

**在 Agent SDK 中，Assistant role 由 SDK 自動管理**，你不需要手動建立 assistant 訊息。

##### Agent SDK 的自動處理機制

- 🤖 SDK 會自動將 Claude 的回應標記為 `SDKAssistantMessage`
- 🔧 工具執行結果也會被納入對話流程
- 📊 你可以透過訊息類型監聽 Agent 的回應

##### 監聽 Assistant 回應

從 `src/index.ts:40-83` 的訊息處理器範例：

```typescript
function printMessage(message: any, verbose: boolean = false) {
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
    const toolUses = message.message.content.filter(
      (c: any) => c.type === "tool_use"
    );
    if (toolUses.length > 0 && verbose) {
      console.log("\n🔧 工具使用:");
      toolUses.forEach((tool: any) => {
        console.log(`   ${tool.name}(${JSON.stringify(tool.input)})`);
      });
    }
  }

  // 最終結果（含統計資訊）
  if (message.type === "result" && message.subtype === "success") {
    console.log("\n✅ 最終結果:");
    console.log(message.result);
  }
}
```

##### ⚠️ 重要：Agent SDK 不支援 Prefilling

**與 Claude Messages API 不同，Agent SDK 不支援預填充（Prefilling）技術**。

這是因為：

- Agent SDK 著重於**自主任務執行**，而非格式控制
- SDK 已經透過 `systemPrompt` 和工具來控制行為
- 預填充主要用於低階 API 的格式控制

如果你需要精確的輸出格式控制，應該：

1. 在 `systemPrompt` 中明確指示格式要求
2. 使用 MCP 工具來結構化輸出
3. 如果真的需要 Prefilling，請使用底層的 `@anthropic-ai/sdk` 而非 Agent SDK

> 📘 **背景補充**：Claude Messages API 支援 Prefilling 技術，可以預先填入 assistant 訊息的開頭來控制輸出格式。詳情請參考 [Anthropic 官方文檔](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prefill-claudes-response)。但這不適用於 Agent SDK。

---

#### 🔄 對話流程：Agent SDK 的執行模式

在 Agent SDK 中，對話流程由 SDK 自動管理，遵循 **user → assistant → user → assistant** 的交替模式。

##### SDK 的自動流程管理

1. **SDK 自動處理交替**：你只需要提供 user 訊息，SDK 會自動處理 assistant 回應
2. **工具執行自動整合**：Agent 使用工具時，SDK 會自動將工具結果納入對話
3. **多輪對話支援**：透過 Streaming Input Mode 實現動態對話

##### 完整對話範例：互動式模式

從 `src/index.ts:193-236` 的互動式範例：

```typescript
async function runInteractive() {
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
          "custom-tools": customToolsServer,
        },
        allowedTools: [
          "Read",
          "Glob",
          "Bash",
          "Grep",
          "mcp__custom-tools__calculate_drink_price",
        ],
      },
    })) {
      // SDK 自動處理 assistant 回應
      printMessage(message, true);
    }

    console.log("\n" + "─".repeat(60) + "\n");
  }
}
```

**這個範例展示了**：

- 持續對話循環
- 動態使用者輸入
- SDK 自動管理 assistant 回應和工具執行

---

#### ⚠️ 常見錯誤和陷阱（Agent SDK）

##### 錯誤 1：將角色設定放在 Prompt

```typescript
// ❌ 錯誤
for await (const message of query({
  prompt: "你是專業律師。幫我審查合約。", // 角色設定不該在這裡
  options: {
    maxTurns: 3,
  },
})) {
}

// ✅ 正確
for await (const message of query({
  prompt: "幫我審查合約。", // 只放具體任務
  options: {
    systemPrompt: "你是專業律師。", // 角色設定放在 systemPrompt
    maxTurns: 3,
  },
})) {
}
```

##### 錯誤 2：誤用參數名稱

```typescript
// ⚠️ 注意：Agent SDK Options 使用 systemPrompt
for await (const message of query({
  prompt: "分析數據",
  options: {
    systemPrompt: "你是資深分析師。", // ✅ 正確
    maxTurns: 5,
  },
})) {
}

// ❌ 不要混淆 BaseOptions 的 customSystemPrompt
// BaseOptions.customSystemPrompt 是內部使用的
```

##### 錯誤 3：混淆 System Prompt 和 Prompt

| 應該放在...  | systemPrompt | prompt |
| ------------ | ------------ | ------ |
| 全域角色設定 | ✅           | ❌     |
| 語氣和風格   | ✅           | ❌     |
| 專業領域定位 | ✅           | ❌     |
| 具體任務     | ❌           | ✅     |
| 資料輸入     | ❌           | ✅     |
| 追問問題     | ❌           | ✅     |

##### 錯誤 4：在 Agent SDK 中使用 Prefilling

```typescript
// ❌ 不支援：Agent SDK 不支援 prefilling
for await (const message of query({
  prompt: [
    { role: "user", content: "分析數據" },
    { role: "assistant", content: "{" }, // Agent SDK 不支援
  ],
  options: {},
})) {
}

// ✅ 正確：在 systemPrompt 中指示格式
for await (const message of query({
  prompt: "分析數據並以 JSON 格式輸出",
  options: {
    systemPrompt: "你必須以 JSON 格式回應，直接輸出 JSON 物件，不要額外說明。",
  },
})) {
}
```

---

#### 💡 總結：Agent SDK 的 Role 使用指南

##### 完整範例：綜合運用

```typescript
// 完整範例：財報分析 Agent
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  // User: 具體任務（在 prompt 中）
  prompt: "分析這份季度財報，特別注意現金流。",

  options: {
    // System: 設定全域專業角色（使用 systemPrompt）
    systemPrompt: `你是一位擁有 CFA 證照的資深財務分析師。
你的分析風格：
- 數據驅動，基於事實
- 關注風險和機會
- 提供可行動的建議`,

    // Assistant: SDK 會自動處理 assistant 回應
    // 不需要手動建立，SDK 會自動生成 SDKAssistantMessage

    maxTurns: 5,
    allowedTools: ["Read", "Grep", "Bash"],
  },
})) {
  // 監聽不同類型的訊息
  if (message.type === "assistant") {
    // SDKAssistantMessage - Agent 的回應
    console.log("🤖 分析結果:", message.message.content);
  }

  if (message.type === "result" && message.subtype === "success") {
    // SDKResultMessage - 最終結果
    console.log("✅ 執行完成:", message.result);
  }
}
```

##### SDK 特有的訊息類型

Claude Agent SDK 除了 `user` 和 `assistant` 外，還有額外的訊息類型：

| SDK 訊息類型          | 說明         | 何時出現                     |
| --------------------- | ------------ | ---------------------------- |
| `SDKUserMessage`      | 使用者輸入   | 你透過 `prompt` 傳遞時       |
| `SDKAssistantMessage` | Claude 回應  | Agent 每次回應時（自動）     |
| `SDKResultMessage`    | 最終執行結果 | query 完成時（包含統計資訊） |

##### 快速參考

**記住這三個核心概念**：

| 概念             | 在 Agent SDK 中        | 用途                          |
| ---------------- | ---------------------- | ----------------------------- |
| 🌟 **System**    | `options.systemPrompt` | 「你是誰」（角色和準則）      |
| 👤 **User**      | `prompt` 參數          | 「請做什麼」（任務和問題）    |
| 🤖 **Assistant** | SDK 自動處理           | Claude 的回應（不需手動建立） |

##### 本專案的實際範例參考

想看更多實際應用，請參考：

- `src/index.ts:88-100` - 簡單查詢範例
- `src/index.ts:104-145` - Streaming Input 多輪對話
- `src/index.ts:149-167` - 自訂 System Prompt
- `src/index.ts:172-189` - 使用 MCP 工具
- `src/index.ts:193-236` - 互動式對話

##### ⚠️ SDK vs 底層 API 的差異

| 功能           | Claude Messages API | Claude Agent SDK       |
| -------------- | ------------------- | ---------------------- |
| System Prompt  | `system` 參數       | `options.systemPrompt` |
| User Message   | `messages` 陣列     | `prompt` 字串或生成器  |
| Prefilling     | ✅ 支援             | ❌ 不直接支援          |
| 工具調用       | 需手動處理          | ✅ SDK 自動處理        |
| 多輪對話       | 需手動管理訊息陣列  | ✅ 使用生成器自動管理  |
| Assistant 訊息 | 需手動加入陣列      | ✅ SDK 自動處理        |

> 📘 **背景補充**：此表格對比了 Claude Messages API（底層 API）和 Agent SDK 的差異。Agent SDK 是對底層 API 的高階封裝，自動處理了許多複雜的流程。如果你需要更細緻的控制（如 Prefilling），可以使用 `@anthropic-ai/sdk` 套件直接調用底層 API。

---

### 3. 工具系統 (Tools)

內建工具：

- **Read**: 讀取檔案內容
- **Write**: 寫入檔案
- **Edit**: 編輯檔案
- **Glob**: 搜尋檔案（支援 glob 模式）
- **Grep**: 在檔案中搜尋特定內容
- **Bash**: 執行 shell 命令
- **WebSearch**: 網頁搜尋
- **WebFetch**: 獲取網頁內容

透過 `allowedTools` 限制可用工具：

```typescript
options: {
  allowedTools: ["Read", "Glob"],  // 只允許讀取和搜尋
}
```

### 4. 串流處理

`query()` 回傳的訊息類型：

| 類型        | 說明       | 何時出現        |
| ----------- | ---------- | --------------- |
| `system`    | 系統訊息   | 初始化時        |
| `user`      | 使用者訊息 | 每次使用者輸入  |
| `assistant` | AI 回應    | AI 思考或回答時 |
| `result`    | 最終結果   | 對話結束時      |

---

## 環境設定

### 必要條件

- **Node.js**: 18.0 或以上版本
- **npm**: 9.0 或以上版本
- **Anthropic API Key**: 從 [Claude Console](https://console.anthropic.com/) 取得

### 取得 API Key

1. 前往 [Anthropic Console](https://console.anthropic.com/)
2. 註冊或登入帳號
3. 在 API Keys 頁面建立新的 API Key
4. 複製 API Key（請妥善保管，不要分享給他人）

### 設定環境變數

在專案根目錄建立 `.env` 檔案：

```bash
ANTHROPIC_API_KEY=your-api-key-here
```

**注意**: `.env` 檔案已被加入 `.gitignore`，不會被提交到 Git。

---

## 詳細使用說明

### 檔案結構

```
agent-sandbox/
├── src/
│   ├── index.ts                      # 主程式（互動式選單 + 所有範例）
│   ├── tools/                        # 自訂工具目錄
│   │   └── pricingTool.ts           # 飲料定價工具範例
│   └── mcpServers/                   # MCP Server 目錄
│       └── customToolsServer.ts      # 自訂工具 MCP Server
├── .env                              # 環境變數（需自行建立）
├── .gitignore                        # Git 忽略清單
├── package.json                      # 專案配置
└── README.md                         # 說明文件
```

### 模組化結構

專案採用模組化設計，方便擴展：

- **`src/tools/`**: 存放所有自訂工具

  - 每個工具都是獨立的檔案
  - 使用 `tool()` 函數定義
  - 易於測試和重複使用

- **`src/mcpServers/`**: 存放 MCP Server 配置

  - 整合多個工具到一個 Server
  - 可以建立多個不同用途的 Server

- **`src/index.ts`**: 主程式
  - 互動式選單
  - 所有範例的執行邏輯
  - 導入並使用自訂工具

### 執行特定範例

```bash
# 方法 1: 使用 npm scripts
npm run demo:simple
npm run demo:streaming
npm run demo:custom-prompt
npm run demo:mcp-tool
npm run demo:interactive

# 方法 2: 直接傳參數
npm run dev simple
npm run dev mcp-tool
```

### 查看詳細輸出

所有範例都會顯示：

```
📊 執行統計
============================================================
⏱️  執行時間: 2341ms (API: 1823ms)
🔄 對話輪數: 3
💰 總成本: $0.0012
📝 Token 使用: 245 in / 89 out

✅ 最終結果:
[Agent 的回答]
```

---

## 自訂 MCP 工具深入解析

### 什麼是 MCP？

**Model Context Protocol (MCP)** 是 Anthropic 推出的協議，讓你可以：

- 建立自訂工具供 Agent 使用
- 整合外部 API 和服務
- 擴展 Agent 的能力

### 建立自訂工具的完整流程

#### 步驟 1: 安裝 Zod

```bash
npm install zod
```

#### 步驟 2: 定義工具

```typescript
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const myTool = tool(
  "tool_name", // 工具名稱
  "工具描述", // 讓 AI 知道何時使用
  {
    // 使用 Zod 定義輸入 schema
    param1: z.string().describe("參數1說明"),
    param2: z.number().optional().describe("參數2說明（可選）"),
  },
  async (args) => {
    // 實作工具邏輯
    const result = await doSomething(args.param1, args.param2);

    // 回傳結果
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    };
  }
);
```

#### 步驟 3: 建立 MCP Server

```typescript
import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

const mcpServer = createSdkMcpServer({
  name: "my-tools",
  version: "1.0.0",
  tools: [myTool], // 可以加入多個工具
});
```

#### 步驟 4: 注入到 Agent

```typescript
for await (const message of query({
  prompt: "使用我的工具做某事",
  options: {
    mcpServers: {
      "my-tools": mcpServer  // ⚠️ 使用 Record 格式
    },
    allowedTools: ["mcp__my-tools__tool_name"],  // MCP 工具格式：mcp__<server-name>__<tool-name>
  },
})) {
  // Agent 會自動呼叫工具
}
```

### 實戰範例：天氣查詢工具

```typescript
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// 定義天氣查詢工具
const weatherTool = tool(
  "get_weather",
  "查詢指定城市的天氣資訊",
  {
    city: z.string().describe("城市名稱，例如：Taipei, Tokyo"),
    units: z.enum(["celsius", "fahrenheit"]).optional().describe("溫度單位"),
  },
  async (args) => {
    // 實際應用中，這裡會呼叫天氣 API
    const weather = {
      city: args.city,
      temperature: 25,
      condition: "晴天",
      units: args.units || "celsius",
    };

    return {
      content: [
        {
          type: "text",
          text: `${weather.city} 現在是 ${weather.condition}，溫度 ${
            weather.temperature
          }°${weather.units === "celsius" ? "C" : "F"}`,
        },
      ],
    };
  }
);

// 建立 MCP Server
const weatherServer = createSdkMcpServer({
  name: "weather-service",
  version: "1.0.0",
  tools: [weatherTool],
});

// 使用
for await (const message of query({
  prompt: "台北現在的天氣如何？",
  options: {
    mcpServers: {
      "weather-service": weatherServer  // ⚠️ 使用 Record 格式
    },
    allowedTools: ["mcp__weather-service__get_weather"],  // MCP 工具格式
  },
})) {
  printMessage(message);
}
```

---

## 參考資源

### 官方文件

- [Claude Agent SDK 官方文件](https://docs.claude.com/en/api/agent-sdk/overview)
- [MCP 文件](https://modelcontextprotocol.io/)
- [API 參考文件](https://docs.claude.com/en/api/agent-sdk/reference)

### 學習資源

- [Better Stack 影片教學](https://www.youtube.com/watch?v=NsROagHaKxA) - 本專案的靈感來源
- [Claude API 文件](https://docs.anthropic.com/)
- [Discord 社群](https://anthropic.com/discord)

### 工具

- [Anthropic Console](https://console.anthropic.com/) - 管理 API Keys
- [GitHub Repository](https://github.com/anthropics/claude-agent-sdk-typescript)

---

## 常見問題

### Q: 執行時出現 "API key not found" 錯誤？

A: 請確認：

1. `.env` 檔案已建立且位於專案根目錄
2. API Key 格式正確（以 `sk-ant-` 開頭）
3. 環境變數名稱為 `ANTHROPIC_API_KEY`

### Q: 如何查看 API 使用量？

A: 前往 [Anthropic Console](https://console.anthropic.com/) 的 Usage 頁面。

### Q: 可以使用哪些模型？

A: 預設使用 Claude 3.5 Sonnet。可透過 `options.model` 指定：

- `sonnet`: Claude 3.5 Sonnet（預設）
- `opus`: Claude 3 Opus（最強大）
- `haiku`: Claude 3 Haiku（最快速）

### Q: MCP 工具的 handler 可以是異步的嗎？

A: 是的！handler 必須是 `async` 函數，可以進行 API 呼叫、資料庫查詢等異步操作。

### Q: 如何除錯工具呼叫？

A: 在 `printMessage` 函數中設定 `verbose: true`：

```typescript
printMessage(message, true); // 會顯示所有工具使用細節
```

---

## 授權條款

本專案採用與 Claude Agent SDK 相同的授權條款。

---

**Happy Coding! 🚀**

如有任何問題，歡迎加入 [Claude Developers Discord](https://anthropic.com/discord) 討論。
