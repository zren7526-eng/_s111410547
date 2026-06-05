const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./database');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// ==========================================
// 1. 註冊與登入 API
// ==========================================
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: '必須提供帳號與密碼' });

    try {
        const checkUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (checkUser) return res.status(400).json({ error: '此帳號已經被註冊過了' });

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
        res.status(201).json({ message: '註冊成功！' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: '必須提供帳號與密碼' });

    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: '帳號或密碼錯誤' });
        }
        res.json({ message: '登入成功！', username: user.username });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 2. 貼文、AI 標籤與讀取 API
// ==========================================
function generateAITags(content) {
    const text = content.toLowerCase();
    const tags = [];
    if (text.includes('node') || text.includes('javascript')) tags.push('#Nodejs');
    if (text.includes('ai') || text.includes('llm')) tags.push('#AI技術');
    if (text.includes('gpu') || text.includes('訓練')) tags.push('#高效能運算');
    if (tags.length === 0) tags.push('#開發日常');
    return tags.join(', ');
}

app.post('/api/posts', (req, res) => {
    const { username, content } = req.body;
    if (!username || !content) return res.status(400).json({ error: '缺少必填欄位' });

    const tags = generateAITags(content);
    const info = db.prepare('INSERT INTO posts (username, content, tags) VALUES (?, ?, ?)').run(username, content, tags);
    res.status(201).json({ message: '貼文發布成功！', post_id: info.lastInsertRowid });
});

app.get('/api/posts', (req, res) => {
    // 取得所有貼文與按讚數
    const posts = db.prepare(`
        SELECT p.*, (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count
        FROM posts p ORDER BY p.created_at DESC
    `).all();

    // 將留言陣列塞進貼文物件中
    const getComments = db.prepare('SELECT username, content FROM comments WHERE post_id = ? ORDER BY created_at ASC');
    posts.forEach(post => {
        post.comments = getComments.all(post.id); 
    });

    res.json(posts);
});

// ==========================================
// 3. 互動 API (按讚與留言)
// ==========================================
app.post('/api/posts/:id/like', (req, res) => {
    const postId = req.params.id;
    const { username } = req.body;
    
    const existing = db.prepare('SELECT * FROM likes WHERE post_id = ? AND username = ?').get(postId, username);
    if (existing) {
        db.prepare('DELETE FROM likes WHERE post_id = ? AND username = ?').run(postId, username);
        res.json({ message: '已收回讚', liked: false });
    } else {
        db.prepare('INSERT INTO likes (post_id, username) VALUES (?, ?)').run(postId, username);
        res.json({ message: '按讚成功！', liked: true });
    }
});

app.post('/api/posts/:id/comments', (req, res) => {
    const postId = req.params.id;
    const { username, content } = req.body;
    if (!username || !content) return res.status(400).json({ error: '必須提供留言內容' });
    
    db.prepare('INSERT INTO comments (post_id, username, content) VALUES (?, ?, ?)').run(postId, username, content);
    res.status(201).json({ message: '留言成功！' });
});

// ==========================================
// 4. ✨ 權限控管 API (刪除貼文)
// ==========================================
app.delete('/api/posts/:id', (req, res) => {
    const postId = req.params.id;
    const { username } = req.body; // 從前端傳來的當前登入者

    if (!username) return res.status(401).json({ error: '請先登入' });

    try {
        const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
        if (!post) return res.status(404).json({ error: '找不到該貼文' });

        // 核心防線：驗證登入者是不是作者
        if (post.username !== username) {
            return res.status(403).json({ error: '權限不足：你只能刪除自己的貼文！' });
        }

        db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
        res.json({ message: '貼文已成功刪除' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 啟動伺服器
// ==========================================
const PORT = 3000;
app.listen(PORT, () => console.log(`社群 Server 運行中：http://localhost:${PORT}`));