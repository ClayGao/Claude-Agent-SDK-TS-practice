# Claude Agent SDK 學習範例

這是一個使用 **Claude Agent SDK** 建立互動式 AI Agent 的學習專案。透過這個範例，你可以學習如何讓 Claude AI 讀取檔案、執行命令，並回答你的問題。

## 📖 目錄

- [什麼是 Claude Agent SDK？](#什麼是-claude-agent-sdk)
- [核心概念](#核心概念)
- [環境設定](#環境設定)
- [安裝與執行](#安裝與執行)
- [程式碼結構說明](#程式碼結構說明)
- [進階功能](#進階功能)
- [參考資源](#參考資源)

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
  prompt: "你的問題",
  options: {
    maxTurns: 10,
    allowedTools: ["Read", "Bash"]
  }
})) {
  // 處理回應
}
```

### 2. 訊息格式 (SDKUserMessage)

與 AI 溝通時需要使用特定格式：

```typescript
{
  type: "user",              // 訊息類型
  message: {
    role: "user",           // 角色
    content: "訊息內容"     // 內容
  },
  parent_tool_use_id: null, // 父工具 ID（若有）
  session_id: "session_1"   // 會話 ID
}
```

### 3. 工具系統 (Tools)

Claude Agent 可以使用多種工具來完成任務：

- **Read**: 讀取檔案內容
- **Write**: 寫入檔案
- **Edit**: 編輯檔案
- **Glob**: 搜尋檔案（支援 glob 模式）
- **Grep**: 在檔案中搜尋特定內容
- **Bash**: 執行 shell 命令
- **WebSearch**: 網頁搜尋
- **WebFetch**: 獲取網頁內容

透過 `allowedTools` 選項可以限制 Agent 能使用的工具，提升安全性。

### 4. 會話管理 (Session)

每個對話都有一個 `session_id`，用於追蹤對話歷史和上下文。SDK 會自動管理：

- 對話歷史
- 上下文壓縮（當對話過長時）
- 工具使用記錄

### 5. 串流處理

`query()` 回傳一個異步迭代器，會產生多種類型的訊息：

- **system**: 系統訊息
- **user**: 使用者訊息
- **assistant**: AI 助手的回應
- **result**: 最終結果

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

**注意**: `.env` 檔案已被加入 `.gitignore`，不會被提交到 Git，保護你的 API Key 安全。

---

## 安裝與執行

### 1. 安裝依賴套件

```bash
npm install
```

### 2. 設定環境變數

建立 `.env` 檔案並填入你的 API Key（參考上方說明）。

### 3. 執行範例程式

```bash
npm run dev
```

### 4. 互動使用

程式啟動後會顯示：

```
Starting Claude Agent SDK interactive example...

請輸入你的問題:
```

你可以輸入任何問題，例如：

- "列出目前目錄的檔案"
- "讀取 package.json 的內容"
- "分析 src/index.ts 並告訴我它的功能"
- "查詢目前有哪些 npm 套件"

AI 會使用適當的工具來回答你的問題，並顯示最終結果。

---

## 程式碼結構說明

### 檔案結構

```
agent-sandbox/
├── src/
│   └── index.ts          # 主程式
├── .env                  # 環境變數（需自行建立）
├── .gitignore           # Git 忽略清單
├── package.json         # 專案配置
├── package-lock.json    # 依賴鎖定檔
└── README.md            # 專案說明文件（本檔案）
```

### 主程式流程 (src/index.ts)

```typescript
// 1. 載入環境變數
import "dotenv/config";

// 2. 導入必要模組
import { query } from "@anthropic-ai/claude-agent-sdk";
import * as readline from "readline/promises";

// 3. 建立 readline 介面（讀取使用者輸入）
const rl = readline.createInterface({ ... });

// 4. 定義訊息生成器（支援多輪對話）
async function* generateMessages() {
  const userInput = await rl.question("請輸入你的問題: ");
  yield { type: "user", message: { ... } };
}

// 5. 執行查詢並處理串流回應
for await (const message of query({
  prompt: generateMessages(),
  options: { maxTurns: 10, allowedTools: [...] }
})) {
  // 處理不同類型的訊息
}
```

### 關鍵設計選擇

#### 為什麼使用異步生成器 (`async function*`)？

```typescript
async function* generateMessages() {
  const userInput = await rl.question("請輸入你的問題: ");
  yield { ... };
}
```

- **async**: 需要等待使用者輸入（非同步操作）
- **function\***: 生成器可以 yield 多個訊息，支援持續對話
- 未來可以擴展為多輪對話，不斷 yield 新訊息

#### 為什麼限制 `maxTurns`？

```typescript
options: {
  maxTurns: 10,  // 最多 10 輪對話
}
```

- 防止 AI 進入無限循環
- 控制 API 使用成本
- 設定合理的執行時間上限

#### 為什麼限制 `allowedTools`？

```typescript
options: {
  allowedTools: ["Read", "Glob", "Bash", "Grep"],  // 只允許這些工具
}
```

- **安全性**: 避免 AI 執行危險操作（如刪除檔案）
- **權限控制**: 只開放必要的工具
- **成本控制**: 減少不必要的工具呼叫

---

## 進階功能

### 1. 多輪對話範例

```typescript
async function* generateMessages() {
  // 第一個問題
  yield {
    type: "user",
    message: { role: "user", content: "列出所有 TypeScript 檔案" },
    parent_tool_use_id: null,
    session_id: "session_1",
  };

  // 等待 2 秒後的後續問題
  await new Promise(resolve => setTimeout(resolve, 2000));

  yield {
    type: "user",
    message: { role: "user", content: "分析第一個檔案的內容" },
    parent_tool_use_id: null,
    session_id: "session_1",
  };
}
```

### 2. 支援圖片輸入

```typescript
import { readFileSync } from "fs";

async function* generateMessages() {
  yield {
    type: "user",
    message: {
      role: "user",
      content: [
        {
          type: "text",
          text: "請分析這張架構圖"
        },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: readFileSync("diagram.png", "base64")
          }
        }
      ]
    },
    parent_tool_use_id: null,
    session_id: "session_1",
  };
}
```

### 3. 自訂系統提示詞

```typescript
for await (const message of query({
  prompt: "你的問題",
  options: {
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append: "你是一個專業的程式碼審查助手，請特別注意安全性問題。"
    }
  }
})) {
  // ...
}
```

### 4. 使用 Subagents（子代理）

```typescript
for await (const message of query({
  prompt: "分析這個專案的架構",
  options: {
    agents: {
      "security-reviewer": {
        description: "專門審查安全性問題的 Agent",
        tools: ["Read", "Grep"],
        prompt: "你是一個安全專家，專注於發現潛在的安全漏洞"
      }
    }
  }
})) {
  // ...
}
```

### 5. 權限控制

```typescript
for await (const message of query({
  prompt: "執行某些操作",
  options: {
    permissionMode: "ask",  // "allow" | "deny" | "ask"
    canUseTool: async (toolName, input, options) => {
      // 自訂權限邏輯
      if (toolName === "Bash" && input.command.includes("rm")) {
        return {
          behavior: "deny",
          message: "不允許執行刪除操作"
        };
      }
      return { behavior: "allow", updatedInput: input };
    }
  }
})) {
  // ...
}
```

---

## 參考資源

### 官方文件

- [Claude Agent SDK 官方文件](https://docs.claude.com/en/api/agent-sdk/overview)
- [API 參考文件](https://docs.claude.com/en/api/agent-sdk/reference)
- [遷移指南](https://docs.claude.com/en/docs/claude-code/sdk/migration-guide)

### 社群資源

- [GitHub Repository](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Discord 社群](https://anthropic.com/discord)
- [回報問題](https://github.com/anthropics/claude-agent-sdk-typescript/issues)

### 相關工具

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) - 擴展 Agent 能力的協議
- [Anthropic Console](https://console.anthropic.com/) - 管理 API Keys 和使用量

### 學習資源

- [Claude API 文件](https://docs.anthropic.com/)
- [Claude Code 使用指南](https://docs.claude.com/en/docs/claude-code)
- [數據使用政策](https://docs.anthropic.com/en/docs/claude-code/data-usage)

---

## 常見問題

### Q: 執行時出現 "API key not found" 錯誤？

A: 請確認：
1. `.env` 檔案已建立且位於專案根目錄
2. API Key 格式正確（以 `sk-ant-` 開頭）
3. 環境變數名稱為 `ANTHROPIC_API_KEY`

### Q: 如何查看 API 使用量？

A: 前往 [Anthropic Console](https://console.anthropic.com/) 的 Usage 頁面查看。

### Q: 可以使用哪些模型？

A: 預設使用 Claude 3.5 Sonnet。可透過 `options.model` 指定：
- `sonnet`: Claude 3.5 Sonnet（預設，平衡性能與成本）
- `opus`: Claude 3 Opus（最強大但較貴）
- `haiku`: Claude 3 Haiku（快速且便宜）

### Q: 如何除錯？

A: 可以印出所有訊息類型來了解執行流程：

```typescript
for await (const message of query({ ... })) {
  console.log("Message type:", message.type);
  console.log("Message content:", JSON.stringify(message, null, 2));
}
```

---

## 授權條款

本專案採用與 Claude Agent SDK 相同的授權條款。詳見 [LICENSE](./node_modules/@anthropic-ai/claude-agent-sdk/LICENSE.md)。

## 貢獻

這是一個學習專案，歡迎提出改進建議或問題回報！

---

**Happy Coding! 🚀**

如有任何問題，歡迎加入 [Claude Developers Discord](https://anthropic.com/discord) 討論。