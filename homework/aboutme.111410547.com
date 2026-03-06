https://www.w3schools.com/html/tryit.asp?filename=tryhtml_formatting_intro
https://gemini.google.com/share/89ed755c866e
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>張鎧任 | 個人網站</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-color: #0f172a;
            --secondary-color: #3b82f6;
            --bg-color: #f8fafc;
            --text-color: #334155;
            --card-bg: #ffffff;
        }

        body {
            font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            background-color: var(--bg-color);
            color: var(--text-color);
        }

        header {
            background: linear-gradient(135deg, var(--primary-color) 0%, #1e3a8a 100%);
            color: white;
            padding: 80px 20px;
            text-align: center;
        }

        header h1 {
            margin: 0;
            font-size: 2.8rem;
            letter-spacing: 2px;
        }

        header p {
            font-size: 1.2rem;
            color: #93c5fd;
            margin-top: 10px;
        }

        .container {
            max-width: 900px;
            margin: -40px auto 40px;
            padding: 0 20px;
        }

        .card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 25px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            transition: transform 0.2s ease;
        }

        .card:hover {
            transform: translateY(-2px);
        }

        h2 {
            color: var(--primary-color);
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
            margin-top: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .profile-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            font-size: 1.1rem;
        }

        .skill-section {
            margin-bottom: 20px;
        }

        .skill-tag {
            display: inline-block;
            background: #eff6ff;
            color: var(--secondary-color);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.95rem;
            margin: 5px 5px 5px 0;
            font-weight: 600;
            border: 1px solid #bfdbfe;
        }

        .soft-skill-tag {
            background: #f1f5f9;
            color: #475569;
            border: 1px solid #cbd5e1;
        }

        .project-item {
            margin-bottom: 20px;
            padding: 20px;
            background: #f8fafc;
            border-left: 4px solid var(--secondary-color);
            border-radius: 0 8px 8px 0;
        }

        .project-item h3 {
            margin: 0 0 10px 0;
            color: var(--primary-color);
        }

        .highlight-text {
            color: var(--secondary-color);
            font-weight: bold;
        }

        footer {
            text-align: center;
            padding: 30px;
            color: #64748b;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>

<header>
    <h1>張鎧任</h1>
    <p>金門大學資工系 | 致力於成為 AI 伺服器維護工程師</p>
</header>

<div class="container">
    <section class="card">
        <h2><i class="fas fa-id-card"></i> 基本資料</h2>
        <div class="profile-info">
            <div>
                <p><strong><i class="fas fa-graduation-cap"></i> 學歷：</strong> 金門大學資工系 (大一)</p>
            </div>
            <div>
                <p><strong><i class="fas fa-phone-alt"></i> 聯絡方式：</strong> 729279279</p>
            </div>
        </div>
    </section>

    <section class="card">
        <h2><i class="fas fa-rocket"></i> 目標與關注領域</h2>
        <p><strong>職涯發展目標：</strong> 未來期望成為一名專業的 <span class="highlight-text">AI 伺服器維護相關工程師</span>。</p>
        <div class="skill-section">
            <p><strong>科技與產業趨勢：</strong></p>
            <span class="skill-tag soft-skill-tag"><i class="fas fa-server"></i> AI 伺服器產業</span>
            <span class="skill-tag soft-skill-tag"><i class="fas fa-satellite"></i> 低軌衛星技術</span>
        </div>
        <div class="skill-section">
            <p><strong>個人興趣：</strong></p>
            <span class="skill-tag soft-skill-tag"><i class="fas fa-chart-line"></i> 撰寫投資心得</span>
        </div>
    </section>

    <section class="card">
        <h2><i class="fas fa-laptop-code"></i> 專業技能與特質</h2>
        <div class="skill-section">
            <strong>程式語言：</strong><br>
            <span class="skill-tag">C</span>
            <span class="skill-tag">C++</span>
            <span class="skill-tag">Python</span>
        </div>
        <div class="skill-section" style="margin-top: 15px;">
            <strong>個人軟實力：</strong><br>
            <span class="skill-tag soft-skill-tag">良好的介紹及溝通能力</span>
            <span class="skill-tag soft-skill-tag">具創意及想像力</span>
        </div>
    </section>

    <section class="card">
        <h2><i class="fas fa-project-diagram"></i> 實作與專案經驗</h2>
        
        <div class="project-item">
            <h3>利用衛星影像觀察新竹南寮漁港海岸線變化</h3>
            <p>透過衛星影像資料的蒐集與分析，觀察並記錄特定區域的地形演變與海岸線推移狀況。</p>
        </div>

        <div class="project-item">
            <h3>利用衛星照及 QGIS 量測海岸線變化</h3>
            <p>結合地理資訊系統 (QGIS) 軟體工具，對衛星照片進行精確的疊圖與數據量測，將環境變化數據化呈現。</p>
        </div>
    </section>
</div>

<footer>
    <p>&copy; 2026 張鎧任 Kairen Zhang. All rights reserved.</p>
</footer>

</body>
</html>
