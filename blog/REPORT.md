# 簡易個人網誌系統技術報告

## 專案概述

本系統是一個基於 Node.js + Express + SQLite 的簡易個人部落格，採用極簡 UI/UX 設計，區分「訪客閱讀前台」與「管理員管理後台」。

---

## 技術棧

| 類別 | 技術 |
|------|------|
| 後端框架 | Express.js |
| 資料庫 | SQLite (sql.js) |
| 模板引擎 | EJS |
| 前端樣式 | 原生 CSS (自訂) |
| Markdown 解析 | marked |
| 程式碼高亮 | highlight.js |
| XSS 防護 | DOMPurify |
| 密碼雜湊 | bcryptjs |
| 會話管理 | express-session |

---

## 專案結構

```
blog/
├── database.js      # SQLite 資料庫操作模組
├── server.js        # Express 伺服器主程式
├── package.json     # 專案依賴配置
├── blog.db         # SQLite 資料庫檔案
├── public/
│   └── css/
│       └── style.css  # 全樣式表
└── views/
    ├── index.html    # 首頁 (文章列表)
    ├── post.html     # 文章詳情頁
    ├── admin.html    # 後台管理列表
    ├── editor.html   # 文章編輯器
    ├── login.html    # 登入頁
    └── register.html # 註冊頁
```

---

## 資料庫結構

### users 表
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵 (自動遞增) |
| username | TEXT | 用戶名 (唯一) |
| password | TEXT | 雜湊後的密碼 |

### posts 表
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵 (自動遞增) |
| title | TEXT | 文章標題 |
| slug | TEXT | 自動生成的網址別名 (唯一) |
| content | TEXT | Markdown 內容 |
| cover_image | TEXT | 封面圖片 URL |
| tags | TEXT | 標籤 (逗號分隔) |
| status | TEXT | 發布狀態 (draft/published) |
| user_id | INTEGER | 作者 ID |
| created_at | DATETIME | 建立時間 |
| updated_at | DATETIME | 更新時間 |

---

## API 路由設計

### 公開路由
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/` | 首頁，顯示已發布文章列表 |
| GET | `/post/:id` | 文章詳情頁 (支援 ID 或 Slug) |
| GET | `/?tag=xxx` | 按標籤篩選文章 |
| GET | `/login` | 登入頁面 |
| POST | `/login` | 處理登入 |
| GET | `/register` | 註冊頁面 |
| POST | `/register` | 處理註冊 |
| GET | `/logout` | 登出 |

### 管理後台路由 (需登入)
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/admin` | 後台文章列表 |
| GET | `/admin/new` | 新文章編輯頁 |
| GET | `/admin/edit/:id` | 編輯文章頁 |
| POST | `/admin/save` | 儲存文章 (新增/更新) |
| POST | `/admin/delete/:id` | 刪除文章 |
| POST | `/admin/publish/:id` | 發布文章 |
| POST | `/admin/draft/:id` | 設為草稿 |

---

## 核心功能詳解

### 1. Markdown 編輯與渲染

**後端渲染流程：**
```javascript
// server.js
const { marked } = require('marked');
const hljs = require('highlight.js');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// 程式碼高亮配置
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

// XSS 防護
function sanitizeHtml(dirty) {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target']
  });
}

function parseMarkdown(content) {
  return sanitizeHtml(marked(content));
}
```

**前端即時預覽：**
```javascript
// editor.html
const contentEl = document.getElementById('content');
const previewEl = document.getElementById('preview');

marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

function updatePreview() {
  const html = marked.parse(contentEl.value);
  previewEl.innerHTML = DOMPurify.sanitize(html);
  previewEl.querySelectorAll('pre code').forEach(block => {
    hljs.highlightElement(block);
  });
}

contentEl.addEventListener('input', updatePreview);
```

### 2. 標籤處理

**後端處理 (去除空白)：**
```javascript
// server.js - POST /admin/save
const processedTags = tags 
  ? tags.split(',').map(t => t.trim()).filter(t => t).join(',') 
  : '';
```

**前端視覺化標籤雲：**
```javascript
// editor.html
let tags = [];

function renderTags() {
  tagsDisplay.innerHTML = tags.map(tag => `
    <span class="tag-item">
      ${tag}
      <button type="button" class="tag-remove" data-tag="${tag}">&times;</button>
    </span>
  `).join('');
  tagsHidden.value = tags.join(',');
}

tagsInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const value = this.value.trim().replace(',', '');
    if (value && !tags.includes(value)) {
      tags.push(value);
      renderTags();
      this.value = '';
    }
  }
});
```

### 3. Slug 自動生成

```javascript
// server.js
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5\w\s-]/g, '')  // 移除非中文/英文/數字/空白/連字符號
    .replace(/\s+/g, '-')                    // 空白轉為連字符號
    .replace(/-+/g, '-')                      // 移除重複連字符號
    .trim();
}
```

### 4. 快捷鍵支援

```javascript
// editor.html
contentEl.addEventListener('keydown', function(e) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'b') {
      e.preventDefault();
      insertMarkdown('**', '**');  // 粗體
    } else if (e.key === 'i') {
      e.preventDefault();
      insertMarkdown('*', '*');   // 斜體
    } else if (e.key === 'k') {
      e.preventDefault();
      insertMarkdown('[', '](url)');  // 連結
    }
  }
});

function insertMarkdown(before, after = '') {
  const start = contentEl.selectionStart;
  const end = contentEl.selectionEnd;
  const text = contentEl.value;
  const selected = text.substring(start, end);
  
  contentEl.value = text.substring(0, start) + before + selected + after + text.substring(end);
  contentEl.focus();
  contentEl.selectionStart = start + before.length;
  contentEl.selectionEnd = start + before.length + selected.length;
  updatePreview();
}
```

### 5. 自動儲存草稿 (localStorage)

```javascript
// editor.html
const STORAGE_KEY = 'blog_draft_<%= post ? post.id : "new" %>';

function updatePreview() {
  // ... 渲染邏輯
  
  // 儲存到 localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    title: titleEl.value,
    content: contentEl.value,
    cover_image: coverInput.value,
    tags: tags.join(','),
    savedAt: new Date().toISOString()
  }));
}

// 進入頁面時檢查草稿
const savedDraft = localStorage.getItem(STORAGE_KEY);
if (savedDraft && !<%= post ? 'true' : 'false' %>) {
  const draft = JSON.parse(savedDraft);
  if (draft.content && draft.content !== originalContent) {
    if (confirm('偵測到未儲存的草稿，是否恢復？')) {
      // 恢復草稿內容
    }
  }
}
```

### 6. 離開警告

```javascript
// editor.html
window.addEventListener('beforeunload', function(e) {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});

document.getElementById('cancelBtn').addEventListener('click', function(e) {
  if (hasUnsavedChanges) {
    if (!confirm('內容尚未儲存，確定要離開嗎？')) {
      e.preventDefault();
    }
  }
});
```

### 7. 封面圖即時預覽

```javascript
// editor.html
coverInput.addEventListener('input', function() {
  if (this.value) {
    coverImage.src = this.value;
    coverImage.onload = () => coverPreview.style.display = 'block';
    coverImage.onerror = () => coverPreview.style.display = 'none';
  } else {
    coverPreview.style.display = 'none';
  }
});
```

---

## CSS 樣式重點

### 設計系統變數
```css
:root {
  --bg: #fafafa;           /* 背景色 */
  --bg-card: #ffffff;      /* 卡片背景 */
  --text: #1a1a1a;         /* 主文字 */
  --text-muted: #6b7280;   /* 次要文字 */
  --primary: #2563eb;      /* 主色調 */
  --primary-hover: #1d4ed8;
  --border: #e5e7eb;       /* 邊框 */
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
  --radius: 12px;          /* 圓角 */
  --max-width: 720px;      /* 內容最大寬度 */
}
```

### 動畫效果
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.post-card {
  animation: fadeIn 0.4s ease-out;
}
```

---

## 安裝與啟動

```bash
# 進入專案目錄
cd blog

# 安裝依賴
npm install

# 啟動伺服器
npm start
```

伺服器啟動後訪問：http://127.0.0.1:3000

---

## 功能對照表

| 需求項目 | 狀態 | 實作位置 |
|---------|------|----------|
| Markdown 編輯器 | ✅ | editor.html |
| 分欄預覽 | ✅ | editor.html (CSS grid) |
| 程式碼高亮 | ✅ | highlight.js |
| 封面圖支援 | ✅ | posts.cover_image |
| 分類標籤 | ✅ | posts.tags |
| 草稿/發布狀態 | ✅ | posts.status |
| 文章 CRUD | ✅ | server.js 路由 |
| 標籤篩選 | ✅ | server.js / |
| Admin 登入驗證 | ✅ | express-session |
| 響應式設計 | ✅ | style.css @media |
| 快捷鍵 (Ctrl+B/K) | ✅ | editor.html |
| 標籤視覺化 | ✅ | editor.html JS |
| 封面圖預覽 | ✅ | editor.html JS |
| XSS 防護 | ✅ | DOMPurify |
| 自動儲存草稿 | ✅ | localStorage |
| Slug 生成 | ✅ | generateSlug() |
| 離開警告 | ✅ | beforeunload |
| 發布按鈕區分 | ✅ | style.css |

---

## 總結

本系統完整實現了簡易個人部落格的所有核心需求，包括：

1. **內容管理** - 完整的 CRUD 功能，支援 Markdown
2. **前台展示** - 極簡設計，響應式排版，程式碼高亮
3. **後台管理** - 視覺化編輯器，即時預覽，自動儲存
4. **安全機制** - 密碼雜湊、XSS 防護、會話管理
5. **使用者體驗** - 快捷鍵、標籤雲、離開警告

系統採用模組化設計，易於擴展和維護。
