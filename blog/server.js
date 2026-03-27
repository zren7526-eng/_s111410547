const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { marked } = require('marked');
const hljs = require('highlight.js');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);
const db = require('./database');

marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function sanitizeHtml(dirty) {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target']
  });
}

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'blog-secret-key-12345',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

function parseMarkdown(content) {
  return sanitizeHtml(marked(content));
}

function getExcerpt(content, length = 150) {
  const text = content.replace(/[#*`\[\]]/g, '').replace(/\n/g, ' ');
  return text.length > length ? text.substring(0, length) + '...' : text;
}

app.use((req, res, next) => {
  res.locals.userId = req.session.userId;
  res.locals.username = req.session.username;
  next();
});

app.get('/', (req, res) => {
  const tag = req.query.tag;
  let sql = 'SELECT posts.*, users.username FROM posts LEFT JOIN users ON posts.user_id = users.id WHERE posts.status = ?';
  const params = ['published'];
  
  if (tag) {
    sql += ' AND posts.tags LIKE ?';
    params.push(`%${tag}%`);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const posts = db.all(sql, params).map(post => ({
    ...post,
    excerpt: getExcerpt(post.content),
    html: parseMarkdown(post.content)
  }));
  
  const allTags = db.all("SELECT DISTINCT tags FROM posts WHERE tags != '' AND status = 'published'");
  let tags = [];
  if (allTags && allTags.length > 0) {
    tags = [...new Set(allTags.flatMap(t => (t.tags || '').split(',').map(x => x.trim()).filter(x => x)))];
  }
  
  res.render('index', { posts, tags, selectedTag: tag, userId: req.session.userId, username: req.session.username });
});

app.get('/post/:id', (req, res) => {
  const { id } = req.params;
  let post;
  
  if (isNaN(id)) {
    post = db.get('SELECT posts.*, users.username FROM posts LEFT JOIN users ON posts.user_id = users.id WHERE posts.slug = ?', [id]);
  } else {
    post = db.get('SELECT posts.*, users.username FROM posts LEFT JOIN users ON posts.user_id = users.id WHERE posts.id = ?', [id]);
  }
  
  if (!post) return res.status(404).send('Post not found');
  
  post.html = parseMarkdown(post.content);
  post.tagsList = post.tags ? post.tags.split(',').map(t => t.trim()).filter(t => t) : [];
  
  res.render('post', { post, userId: req.session.userId, username: req.session.username });
});

app.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) {
    return res.render('login', { error: '用戶不存在' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.render('login', { error: '密碼錯誤' });
  }
  req.session.userId = user.id;
  req.session.username = user.username;
  res.redirect('/admin');
});

app.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render('register', { error: '請填寫所有欄位' });
  }
  const existing = db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (existing) {
    return res.render('register', { error: '用戶名已存在' });
  }
  const hashed = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed]);
  res.redirect('/login');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/admin', requireAuth, (req, res) => {
  const posts = db.all('SELECT posts.*, users.username FROM posts LEFT JOIN users ON posts.user_id = users.id ORDER BY created_at DESC');
  res.render('admin', { posts, userId: req.session.userId, username: req.session.username });
});

app.get('/admin/new', requireAuth, (req, res) => {
  res.render('editor', { post: null, userId: req.session.userId, username: req.session.username });
});

app.get('/admin/edit/:id', requireAuth, (req, res) => {
  const post = db.get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
  if (!post) return res.redirect('/admin');
  res.render('editor', { post, userId: req.session.userId, username: req.session.username });
});

app.post('/admin/save', requireAuth, (req, res) => {
  const { id, title, content, cover_image, tags, status } = req.body;
  
  if (!title || !content) {
    return res.status(400).send('標題和內容為必填');
  }
  
  const processedTags = tags ? tags.split(',').map(t => t.trim()).filter(t => t).join(',') : '';
  const slug = generateSlug(title);
  
  if (id) {
    db.run('UPDATE posts SET title = ?, slug = ?, content = ?, cover_image = ?, tags = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [title, slug, content, cover_image || '', processedTags, status || 'draft', id]);
  } else {
    db.run('INSERT INTO posts (title, slug, content, cover_image, tags, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [title, slug, content, cover_image || '', processedTags, status || 'draft', req.session.userId]);
  }
  
  res.redirect('/admin');
});

app.post('/admin/delete/:id', requireAuth, (req, res) => {
  const post = db.get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
  if (!post) return res.status(404).send('Post not found');
  if (post.user_id !== req.session.userId) {
    return res.status(403).send('沒有權限');
  }
  db.run('DELETE FROM posts WHERE id = ?', [req.params.id]);
  res.redirect('/admin');
});

app.post('/admin/publish/:id', requireAuth, (req, res) => {
  db.run('UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['published', req.params.id]);
  res.redirect('/admin');
});

app.post('/admin/draft/:id', requireAuth, (req, res) => {
  db.run('UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['draft', req.params.id]);
  res.redirect('/admin');
});

async function start() {
  await db.initDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Blog running at http://127.0.0.1:${PORT}`);
  });
}

start();
