<<<<<<< HEAD
# DevConnect - 開發者微型社群平台 (期中專案)

## ⚠️ 開發與 AI 使用聲明
* **AI 使用聲明**：本專案【有】使用 AI 輔助開發。
    * **使用的 AI 工具**：Gemini 1.5 Pro。
    * **AI 輔助範圍**：協助資料庫 Schema 設計建議、解決 Node.js 環境建置錯誤 (如 PowerShell 權限問題)、協助實作密碼加鹽加密與撰寫前端 Tailwind CSS 排版，以及本 README 文件之結構潤飾。
    * **對話紀錄連結**：[這裡請貼上你跟我的對話分享連結]
* **原創與參考聲明**：
    * 本專案為獨立實作開發，未使用其他同學之程式碼或市面現成之完整社群模板。
    * **個人貢獻**：規劃社群功能需求（發文、按讚、留言系統）、實作 Server 端 RESTful API 邏輯、設計 SQLite 多資料表關聯，並處理前後端資料串接與權限控管邏輯。

---

## 🚀 專案簡介與特色
DevConnect 是一個專為開發者設計的輕量級社群平台，以 **Node.js (Express)** 建置後端 Server，並搭配 **SQLite** 進行資料持久化儲存。

**本專案符合之課程要求：**
1. **建置伺服器**：使用 Node.js 獨立架設後端 Server。
2. **網誌/社群型專案**：實作了包含發文、按讚、留言的一對多/多對多動態牆。
3. **結合 AI 元素**：實作了發文內容解析機制，當使用者發布包含特定技術字眼（如 node, llm）的內容時，系統會在寫入資料庫前自動生成對應的 Hashtag 標籤進行分類。

## 🛠️ 核心技術與功能亮點
* **資訊安全 (Authentication)**：使用 `bcryptjs` 實作密碼雜湊加鹽 (Salt & Hash)，避免密碼明文外洩。
* **關聯式資料庫 (Database Design)**：
    * 實作 `users`, `posts`, `comments`, `likes` 四張關聯資料表。
    * 處理「一對多」(一篇文章多則留言) 與「多對多」(多使用者對多文章按讚) 之複雜查詢。
* **權限控管 (Authorization)**：在刪除貼文的 API 中，嚴格驗證「當前請求者」是否為「貼文原作者」，防止惡意刪除。

## 📚 學習筆記與踩坑紀錄 (Learning Notes)
在本次專案開發過程中，我遇到了許多挑戰並從中學習：
1. **環境建置的挑戰**：一開始在 Windows 環境執行 `npm` 時遇到 PowerShell 執行權限阻擋 (`UnauthorizedAccess`)，學會了使用 `Set-ExecutionPolicy` 指令解決。此外，也經歷了檔案放錯資料夾 (放在 `node_modules` 內) 導致 `MODULE_NOT_FOUND` 的錯誤，讓我對 Node.js 的模組載入機制有更深的體會。
2. **密碼不該存明文**：在實作註冊功能時，了解到不能直接將密碼寫入資料庫，並成功學會運用 Bcrypt 套件進行加密比對。
3. **資料庫連鎖刪除 (ON DELETE CASCADE)**：在設計資料表時，學到了設定外鍵的 CASCADE 特性，讓刪除貼文時，底下的留言和按讚紀錄能自動清理，避免產生孤兒資料 (Orphan Data)。

## 💻 系統啟動方式
1. 確認已安裝 Node.js。
2. 於專案目錄執行 `npm install` 安裝依賴套件。
3. 執行 `npm run dev` 啟動伺服器。
4. 開啟瀏覽器進入 `http://localhost:3000` 即可使用。
=======
# 課程：網頁設計 -- 筆記、習題與報告

欄位 | 內容
-----|--------
學期 | 114 學年下學期
學生 |  張鎧任
學號末兩碼 | 47
教師 | [陳鍾誠](https://www.nqu.edu.tw/educsie/index.php?act=blog&code=list&ids=4)
學校科系 | [金門大學資訊工程系](https://www.nqu.edu.tw/educsie/index.php)
課程教材 | https://github.com/ccc114b/html2server <br/> https://www.w3schools.com/
>>>>>>> 4316f276a6fac7e167d2ec0caeaa589332d55b0b
