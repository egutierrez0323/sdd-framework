/**
 * Generador de la interfaz web para el Dashboard y Visualizador SDD.
 * Implementa soporte multi-lenguaje (i18n: EN/ES), renderizado visual Markdown,
 * navegación reactiva, iconos SVG vectoriales y soporte de impresión (@media print).
 */

export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SDD Visualizer & Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #090a0f;
      --bg-surface: #0f121a;
      --bg-card: #151926;
      --bg-card-hover: #1c2233;
      --border: #222838;
      --border-accent: #3b82f6;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-sub: #64748b;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --primary-glow: rgba(59, 130, 246, 0.15);
      --success: #10b981;
      --success-glow: rgba(16, 185, 129, 0.15);
      --warning: #f59e0b;
      --warning-glow: rgba(245, 158, 11, 0.15);
      --danger: #ef4444;
      --info: #06b6d4;
      --radius-sm: 5px;
      --radius-md: 8px;
      --radius-lg: 12px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-base);
      color: var(--text-main);
      line-height: 1.5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }

    header {
      background: rgba(15, 18, 26, 0.9);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .logo-badge {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #fff;
      font-weight: 700;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      padding: 0.25rem 0.55rem;
      border-radius: var(--radius-sm);
      font-family: 'JetBrains Mono', monospace;
    }

    .brand-title { font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 0.6rem; color: #e2e8f0; }
    .project-name {
      color: var(--info);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      background: rgba(6, 182, 212, 0.08);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(6, 182, 212, 0.2);
    }

    .header-actions { display: flex; align-items: center; gap: 0.6rem; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.4rem 0.8rem;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-main);
      transition: all 0.15s ease;
    }
    .btn:hover { background: var(--bg-card-hover); border-color: #334155; }
    .btn-primary { background: #2563eb; border-color: #3b82f6; color: white; font-weight: 600; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-sm { padding: 0.25rem 0.6rem; font-size: 0.78rem; }

    .btn-group { display: inline-flex; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
    .btn-group .btn { border-radius: 0; border: none; border-right: 1px solid var(--border); }
    .btn-group .btn:last-child { border-right: none; }
    .btn-group .btn.active { background: #2563eb; color: white; font-weight: 600; }

    .lang-switch {
      display: inline-flex;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: var(--bg-card);
    }
    .lang-btn {
      border: none;
      background: transparent;
      color: var(--text-sub);
      padding: 0.35rem 0.55rem;
      font-size: 0.72rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .lang-btn:hover { color: var(--text-main); }
    .lang-btn.active { background: var(--primary); color: white; }

    .doc-toolbar { display: flex; align-items: center; gap: 0.5rem; }

    .app-container { display: flex; flex: 1; }
    aside {
      width: 270px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      height: calc(100vh - 53px);
      position: sticky;
      top: 53px;
      overflow-y: auto;
    }

    .nav-section { padding: 1.25rem 0.85rem 0.5rem; }
    .nav-title { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-sub); font-weight: 700; margin-bottom: 0.4rem; padding-left: 0.5rem; }
    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.15rem;
      transition: background 0.12s ease, color 0.12s ease;
    }
    .nav-item-content { display: flex; align-items: center; gap: 0.6rem; }
    .nav-item:hover { background: rgba(255, 255, 255, 0.04); color: var(--text-main); }
    .nav-item.active { background: rgba(59, 130, 246, 0.1); color: #60a5fa; font-weight: 600; }
    .nav-badge { font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 999px; background: var(--bg-base); border: 1px solid var(--border); font-family: 'JetBrains Mono', monospace; }

    main { flex: 1; padding: 1.75rem 2.25rem; max-width: 1200px; margin: 0 auto; width: 100%; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 1.15rem 1.35rem;
      transition: border-color 0.15s ease;
    }
    .stat-card:hover { border-color: #334155; }
    .stat-label { font-size: 0.72rem; color: var(--text-sub); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
    .stat-value { font-size: 1.85rem; font-weight: 700; margin-top: 0.2rem; display: flex; align-items: baseline; gap: 0.4rem; font-variant-numeric: tabular-nums; }
    .stat-sub { font-size: 0.78rem; color: var(--text-sub); margin-top: 0.15rem; }

    .progress-bar-container { background: var(--bg-base); height: 6px; border-radius: 999px; overflow: hidden; margin-top: 0.6rem; border: 1px solid var(--border); }
    .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #10b981, #06b6d4); border-radius: 999px; }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.72rem;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.02em;
    }
    .badge-approved { background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); }
    .badge-draft { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.25); }
    .badge-blocked { background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25); }
    .badge-done { background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); }
    .badge-pending { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); }

    .ears-ubiquitous { background: rgba(16, 185, 129, 0.1); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.25); }
    .ears-event { background: rgba(59, 130, 246, 0.1); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.25); }
    .ears-state { background: rgba(245, 158, 11, 0.1); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.25); }
    .ears-unwanted { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.25); }
    .ears-optional { background: rgba(6, 182, 212, 0.1); color: #67e8f9; border: 1px solid rgba(6, 182, 212, 0.25); }

    .view-panel { display: none; }
    .view-panel.active { display: block; }

    .card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      margin-bottom: 1.25rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--border);
    }
    .card-title { font-size: 1.2rem; font-weight: 700; color: #f8fafc; }
    .card-meta { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.82rem; color: var(--text-muted); margin-top: 0.35rem; }

    .req-item {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 1.15rem;
      margin-bottom: 0.85rem;
    }
    .req-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.65rem; }
    .req-id { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.88rem; color: #60a5fa; }
    .req-declaration {
      font-size: 0.94rem;
      font-weight: 500;
      margin-bottom: 0.75rem;
      border-left: 3px solid #3b82f6;
      background: rgba(59, 130, 246, 0.05);
      padding: 0.55rem 0.8rem;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      color: #e2e8f0;
    }

    .criteria-box {
      background: var(--bg-base);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.75rem 0.85rem;
      font-size: 0.82rem;
      display: grid;
      gap: 0.35rem;
    }
    .criteria-line { display: flex; gap: 0.65rem; }
    .criteria-tag { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--info); min-width: 60px; font-size: 0.75rem; }

    .task-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0.9rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      margin-bottom: 0.45rem;
    }
    .task-left { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
    .task-id { font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; font-weight: 600; color: var(--text-muted); }
    .task-title { font-size: 0.88rem; font-weight: 500; }

    .markdown-body {
      color: #cbd5e1;
      line-height: 1.7;
      font-size: 0.92rem;
    }
    .markdown-body .doc-h1 {
      font-size: 1.4rem;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 1.25rem;
      letter-spacing: -0.02em;
    }
    .markdown-body .doc-h2 {
      font-size: 1.12rem;
      font-weight: 600;
      color: #60a5fa;
      margin-top: 1.75rem;
      margin-bottom: 0.75rem;
      padding-bottom: 0.4rem;
      border-bottom: 1px solid var(--border);
      letter-spacing: -0.01em;
    }
    .markdown-body .doc-h3 {
      font-size: 0.95rem;
      font-weight: 600;
      color: #e2e8f0;
      margin-top: 1.25rem;
      margin-bottom: 0.45rem;
    }
    .markdown-body .doc-p {
      margin-bottom: 0.85rem;
      color: #94a3b8;
    }
    .markdown-body .doc-quote {
      background: rgba(59, 130, 246, 0.06);
      border-left: 3px solid #3b82f6;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      padding: 0.85rem 1.15rem;
      margin: 1.25rem 0;
      color: #e2e8f0;
      font-size: 0.88rem;
      line-height: 1.6;
    }
    .markdown-body .doc-quote strong {
      color: #60a5fa;
    }
    .markdown-body .doc-hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 1.75rem 0;
    }
    .markdown-body .table-container {
      width: 100%;
      overflow-x: auto;
      margin: 1.25rem 0;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--bg-card);
    }
    .markdown-body table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .markdown-body th {
      background: rgba(255, 255, 255, 0.04);
      padding: 0.65rem 0.85rem;
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-sub);
      border-bottom: 1px solid var(--border);
      font-weight: 600;
    }
    .markdown-body td {
      padding: 0.75rem 0.85rem;
      font-size: 0.84rem;
      border-bottom: 1px solid var(--border);
      color: #cbd5e1;
    }
    .markdown-body tr:last-child td {
      border-bottom: none;
    }
    .markdown-body tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }
    .markdown-body .doc-list {
      padding-left: 1.4rem;
      margin: 0.85rem 0;
    }
    .markdown-body .doc-list li {
      margin-bottom: 0.5rem;
      font-size: 0.88rem;
      color: #94a3b8;
    }
    .markdown-body .doc-list li strong {
      color: #f1f5f9;
    }
    .markdown-body .doc-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      background: rgba(255, 255, 255, 0.06);
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      border: 1px solid var(--border);
      color: #38bdf8;
    }
    .markdown-body .doc-link {
      color: #60a5fa;
      text-decoration: none;
      border-bottom: 1px dashed rgba(96, 165, 250, 0.5);
    }
    .markdown-body .doc-link:hover {
      color: #93c5fd;
      border-bottom-style: solid;
    }

    @media print {
      body { background: white !important; color: black !important; font-size: 10pt; }
      header, aside, .header-actions, .nav-section, .btn, .doc-toolbar, .lang-switch, .no-print { display: none !important; }
      main { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
      .card { background: white !important; border: 1px solid #ddd !important; box-shadow: none !important; page-break-inside: avoid; }
      .req-item { background: #fafafa !important; border: 1px solid #e0e0e0 !important; page-break-inside: avoid; }
      .req-declaration { background: #f1f5f9 !important; color: #0f172a !important; border-left: 3px solid #0284c7 !important; }
      .criteria-box { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; color: #334155 !important; }
      .badge { border: 1px solid #aaa !important; color: black !important; background: #f1f5f9 !important; }
      .markdown-body { color: black !important; }
      .markdown-body .doc-h1, .markdown-body .doc-h2, .markdown-body .doc-h3 { color: black !important; border-bottom: 1px solid #ddd !important; }
      .markdown-body .doc-p, .markdown-body .doc-list li { color: #333 !important; }
      .markdown-body .doc-quote { background: #f8fafc !important; color: #1e293b !important; border-left: 3px solid #0284c7 !important; }
      .markdown-body table { border: 1px solid #ccc !important; }
      .markdown-body th { background: #f1f5f9 !important; color: #000 !important; }
      .markdown-body td { border-bottom: 1px solid #eee !important; color: #000 !important; }
      .markdown-body .doc-code { background: #f1f5f9 !important; border: 1px solid #ddd !important; color: #0f172a !important; }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span class="logo-badge">SDD</span>
      <div class="brand-title">
        <span>Spec-Driven Development</span>
        <span class="project-name" id="headerProjectName">loading...</span>
      </div>
    </div>
    <div class="header-actions">
      <div class="lang-switch" title="Change Language / Cambiar Idioma">
        <button id="langBtnEn" class="lang-btn active" onclick="setLanguage('en')">EN</button>
        <button id="langBtnEs" class="lang-btn" onclick="setLanguage('es')">ES</button>
      </div>
      <button class="btn" onclick="fetchProjectData(true)" title="Refresh Data">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
        <span data-i18n="refresh">Refresh</span>
      </button>
      <button class="btn btn-primary" onclick="window.print()" title="Print / PDF Export">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        <span data-i18n="printPdf">Print / PDF</span>
      </button>
    </div>
  </header>

  <div class="app-container">
    <aside>
      <div class="nav-section">
        <div class="nav-title" data-i18n="navSection">Navigation</div>
        <div class="nav-item active" onclick="switchView('dashboard')">
          <div class="nav-item-content">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            <span data-i18n="overview">Overview</span>
          </div>
        </div>
        <div class="nav-item" onclick="switchView('specs')">
          <div class="nav-item-content">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            <span data-i18n="specs">Specifications</span>
          </div>
          <span class="nav-badge" id="navSpecsCount">0</span>
        </div>
        <div class="nav-item" onclick="switchView('tasks')">
          <div class="nav-item-content">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            <span data-i18n="tasks">Micro-Tasks</span>
          </div>
          <span class="nav-badge" id="navTasksCount">0</span>
        </div>
        <div class="nav-item" onclick="switchView('graph')">
          <div class="nav-item-content">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            <span data-i18n="graph">Architecture Graph</span>
          </div>
        </div>
        <div class="nav-item" onclick="switchView('constitution')">
          <div class="nav-item-content">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span data-i18n="constitution">Constitution</span>
          </div>
        </div>
      </div>
      <div class="nav-section">
        <div class="nav-title" data-i18n="navDocs">Documents</div>
        <div id="sidebarSpecsList"></div>
      </div>
    </aside>

    <main>
      <section id="view-dashboard" class="view-panel active">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label" data-i18n="kpiSpecs">Specifications</div>
            <div class="stat-value" id="kpiSpecs">0</div>
            <div class="stat-sub" id="kpiSpecsSub">0 approved · 0 draft</div>
          </div>
          <div class="stat-card">
            <div class="stat-label" data-i18n="kpiReqs">EARS Requirements</div>
            <div class="stat-value" id="kpiReqs">0</div>
            <div class="stat-sub" id="kpiReqsSub">100% formalized</div>
          </div>
          <div class="stat-card">
            <div class="stat-label" data-i18n="kpiTasks">Task Progress</div>
            <div class="stat-value" id="kpiTasksPercent">0%</div>
            <div class="progress-bar-container"><div class="progress-bar-fill" id="kpiTasksBar" style="width: 0%"></div></div>
            <div class="stat-sub" id="kpiTasksSub" style="margin-top: 0.5rem">0 of 0 completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-label" data-i18n="kpiSeverity">Arbiter Severity</div>
            <div class="stat-value" id="kpiSeverity" style="color: #60a5fa">L2</div>
            <div class="stat-sub" id="kpiSeveritySub">Standard / Production</div>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom: 0.75rem; font-size: 1.05rem;" data-i18n="earsBreakdownTitle">EARS Requirements Breakdown</div>
          <div id="earsBreakdownContainer" style="display: flex; gap: 0.65rem; flex-wrap: wrap;"></div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom: 0.75rem; font-size: 1.05rem;" data-i18n="projectSpecsTitle">Project Specifications</div>
          <div id="dashboardSpecsCards"></div>
        </div>
      </section>

      <section id="view-specs" class="view-panel">
        <div id="specsDetailedContainer"></div>
      </section>

      <section id="view-tasks" class="view-panel">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title" data-i18n="tasksTitle">Implementation Micro-Tasks</div>
              <div class="card-meta" data-i18n="tasksMeta">Sequential verifiable execution (≤ 30 min per task)</div>
            </div>
          </div>
          <div id="tasksListContainer"></div>
        </div>
      </section>

      <section id="view-graph" class="view-panel">
        <div class="card">
          <div class="card-title" style="margin-bottom: 0.35rem" data-i18n="graphTitle">Architecture Graph</div>
          <div class="card-meta" style="margin-bottom: 1.25rem" data-i18n="graphMeta">Indexed structure for context optimization and token savings</div>
          <div style="background: var(--bg-base); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1.25rem; overflow-x: auto;">
            <pre id="graphContent" style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; color: var(--text-muted); white-space: pre-wrap;"></pre>
          </div>
        </div>
      </section>

      <section id="view-constitution" class="view-panel">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title"><span data-i18n="constitutionTitle">Project Constitution</span> <span id="constitutionSource"></span></div>
              <div class="card-meta" data-i18n="constitutionMeta">Architectural invariants, anti-sycophancy and quality gates</div>
            </div>
            <div class="doc-toolbar no-print">
              <div class="btn-group">
                <button id="btnModeRendered" class="btn btn-sm active" onclick="toggleConstitutionMode('rendered')" data-i18n="documentMode">Document</button>
                <button id="btnModeRaw" class="btn btn-sm" onclick="toggleConstitutionMode('raw')" data-i18n="rawMode">Markdown</button>
              </div>
              <button id="btnCopyConstitution" class="btn btn-sm" onclick="copyConstitution()" data-i18n="copyBtn">Copy</button>
              <button class="btn btn-sm btn-primary" onclick="window.print()" data-i18n="printBtn">Print</button>
            </div>
          </div>
          <div id="constitutionRendered" class="markdown-body"></div>
          <div id="constitutionRaw" style="display: none; background: var(--bg-base); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1.25rem; overflow-x: auto;">
            <pre id="constitutionRawPre" style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; color: var(--text-muted); white-space: pre-wrap;"></pre>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script>
    const I18N = {
      en: {
        refresh: 'Refresh',
        printPdf: 'Print / PDF',
        navSection: 'Navigation',
        navDocs: 'Documents',
        overview: 'Overview',
        specs: 'Specifications',
        tasks: 'Micro-Tasks',
        graph: 'Architecture Graph',
        constitution: 'Constitution',
        kpiSpecs: 'Specifications',
        kpiReqs: 'EARS Requirements',
        kpiTasks: 'Task Progress',
        kpiSeverity: 'Arbiter Severity',
        approved: 'approved',
        draft: 'draft',
        formalized: '100% formalized',
        completedOf: 'completed of',
        severitySub: 'Standard / Production',
        earsBreakdownTitle: 'EARS Requirements Breakdown',
        projectSpecsTitle: 'Project Specifications',
        tasksTitle: 'Implementation Micro-Tasks',
        tasksMeta: 'Sequential verifiable execution (≤ 30 min per task)',
        noTasks: 'No tasks registered in .sdd/tasks/.',
        graphTitle: 'Architecture Graph',
        graphMeta: 'Indexed structure for context optimization and token savings',
        constitutionTitle: 'Project Constitution',
        constitutionMeta: 'Architectural invariants, anti-sycophancy and quality gates',
        documentMode: 'Document',
        rawMode: 'Markdown',
        copyBtn: 'Copy',
        copiedBtn: 'Copied!',
        printBtn: 'Print',
        context: 'Context',
        requirements: 'EARS Requirements',
        status: 'Status',
        severity: 'Severity',
        given: 'GIVEN:',
        when: 'WHEN:',
        then: 'THEN:',
        noGraph: 'No graph generated yet. Run \\'sdd graph\\' to create it.',
        noConstitution: 'No constitution found (.sdd/constitution.md or AGENTS.md). Run sdd init.'
      },
      es: {
        refresh: 'Actualizar',
        printPdf: 'Imprimir / PDF',
        navSection: 'Navegación',
        navDocs: 'Documentos',
        overview: 'Resumen',
        specs: 'Especificaciones',
        tasks: 'Micro-Tareas',
        graph: 'Grafo Arquitectura',
        constitution: 'Constitución',
        kpiSpecs: 'Especificaciones',
        kpiReqs: 'Requerimientos EARS',
        kpiTasks: 'Progreso Tareas',
        kpiSeverity: 'Severidad del Árbitro',
        approved: 'aprobadas',
        draft: 'borrador',
        formalized: '100% formalizados',
        completedOf: 'completadas de',
        severitySub: 'Standard / Producción',
        earsBreakdownTitle: 'Desglose de Requerimientos EARS',
        projectSpecsTitle: 'Especificaciones del Proyecto',
        tasksTitle: 'Micro-Tareas de Implementación',
        tasksMeta: 'Ejecución secuencial verificable (≤ 30 min por tarea)',
        noTasks: 'No hay tareas registradas en .sdd/tasks/.',
        graphTitle: 'Grafo de Arquitectura',
        graphMeta: 'Estructura indexada para optimización de contexto y ahorro de tokens',
        constitutionTitle: 'Constitución del Proyecto',
        constitutionMeta: 'Invariantes arquitectónicas, anti-complacencia y compuertas de calidad',
        documentMode: 'Documento',
        rawMode: 'Markdown',
        copyBtn: 'Copiar',
        copiedBtn: '¡Copiado!',
        printBtn: 'Imprimir',
        context: 'Contexto',
        requirements: 'Requerimientos EARS',
        status: 'Estado',
        severity: 'Severidad',
        given: 'DADO:',
        when: 'CUANDO:',
        then: 'ENTONCES:',
        noGraph: 'No se generó grafo aún. Ejecuta \\'sdd graph\\' para crearlo.',
        noConstitution: 'No se encontró la constitución (.sdd/constitution.md ni AGENTS.md). Ejecuta sdd init.'
      }
    };

    let appData = null;
    let selectedSpecId = null;
    let currentLang = 'en';

    function setLanguage(lang) {
      currentLang = lang;
      localStorage.setItem('sdd_lang', lang);
      document.getElementById('langBtnEn')?.classList.toggle('active', lang === 'en');
      document.getElementById('langBtnEs')?.classList.toggle('active', lang === 'es');
      applyI18nLabels();
      if (appData) {
        renderDashboard(appData);
      }
    }

    function applyI18nLabels() {
      const t = I18N[currentLang];
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
      });
    }

    async function fetchProjectData() {
      try {
        const res = await fetch('/api/data');
        appData = await res.json();
        const savedLang = localStorage.getItem('sdd_lang') || appData.locale || 'en';
        setLanguage(savedLang);
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
    }

    function switchView(viewName) {
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      const targetPanel = document.getElementById('view-' + viewName);
      if (targetPanel) targetPanel.classList.add('active');
      const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(i => i.getAttribute('onclick')?.includes(viewName));
      if (activeNav) activeNav.classList.add('active');
    }

    function selectSpec(specId) {
      selectedSpecId = specId;
      renderSelectedSpec();
      switchView('specs');
    }

    function getEarsClass(type) {
      if (!type) return 'badge-pending';
      const t = type.toLowerCase();
      if (t.includes('ubiquitous') || t.includes('ubicuo')) return 'ears-ubiquitous';
      if (t.includes('event')) return 'ears-event';
      if (t.includes('state')) return 'ears-state';
      if (t.includes('unwanted')) return 'ears-unwanted';
      if (t.includes('optional')) return 'ears-optional';
      return 'badge-pending';
    }

    function renderInlineMarkdown(text) {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\*([^\\*]+)\\*/g, '<em>$1</em>')
        .replace(/\`([^\`]+)\`/g, '<code class="doc-code">$1</code>')
        .replace(/\\[([^\\]]+)\\]\\(([^\\)]+)\\)/g, '<a href="$2" target="_blank" class="doc-link">$1</a>');
    }

    function renderTableMarkdown(lines, startIndex) {
      let i = startIndex;
      const headerLine = lines[i];
      i += 2;
      const headers = headerLine.split('|').filter(c => c.trim().length > 0).map(c => c.trim());
      let html = '<div class="table-container"><table><thead><tr>';
      headers.forEach(h => { html += '<th>' + renderInlineMarkdown(h) + '</th>'; });
      html += '</tr></thead><tbody>';
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cols = lines[i].split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        html += '<tr>';
        cols.forEach(c => { html += '<td>' + renderInlineMarkdown(c.trim()) + '</td>'; });
        html += '</tr>';
        i++;
      }
      html += '</tbody></table></div>';
      return { html, nextIndex: i - 1 };
    }

    function renderListMarkdown(lines, startIndex, isOrdered) {
      let i = startIndex;
      const tag = isOrdered ? 'ol' : 'ul';
      let html = '<' + tag + ' class="doc-list">';
      const regex = isOrdered ? /^(\\s*)\\d+\\.\\s+(.*)/ : /^(\\s*)[-*]\\s+(.*)/;
      while (i < lines.length) {
        const match = regex.exec(lines[i]);
        if (!match) break;
        html += '<li>' + renderInlineMarkdown(match[2]) + '</li>';
        i++;
      }
      html += '</' + tag + '>';
      return { html, nextIndex: i - 1 };
    }

    function renderMarkdownToHtml(md) {
      if (!md) return '<div class="doc-empty">Documento vacío.</div>';
      const lines = md.split(/\\r?\\n/);
      let html = '';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (line.startsWith('# ')) html += '<h1 class="doc-h1">' + renderInlineMarkdown(line.slice(2)) + '</h1>';
        else if (line.startsWith('## ')) html += '<h2 class="doc-h2">' + renderInlineMarkdown(line.slice(3)) + '</h2>';
        else if (line.startsWith('### ')) html += '<h3 class="doc-h3">' + renderInlineMarkdown(line.slice(4)) + '</h3>';
        else if (line === '---' || line === '***') html += '<hr class="doc-hr">';
        else if (line.startsWith('>')) html += '<blockquote class="doc-quote">' + renderInlineMarkdown(line.replace(/^>\\s*/, '')) + '</blockquote>';
        else if (line.startsWith('|') && lines[i + 1]?.includes('---')) {
          const res = renderTableMarkdown(lines, i);
          html += res.html;
          i = res.nextIndex;
        } else if (/^\\d+\\.\\s+/.test(line)) {
          const res = renderListMarkdown(lines, i, true);
          html += res.html;
          i = res.nextIndex;
        } else if (/^[-*]\\s+/.test(line)) {
          const res = renderListMarkdown(lines, i, false);
          html += res.html;
          i = res.nextIndex;
        } else html += '<p class="doc-p">' + renderInlineMarkdown(line) + '</p>';
      }
      return html;
    }

    function toggleConstitutionMode(mode) {
      const rendered = document.getElementById('constitutionRendered');
      const raw = document.getElementById('constitutionRaw');
      const btnRendered = document.getElementById('btnModeRendered');
      const btnRaw = document.getElementById('btnModeRaw');
      if (mode === 'raw') {
        rendered.style.display = 'none';
        raw.style.display = 'block';
        btnRendered?.classList.remove('active');
        btnRaw?.classList.add('active');
      } else {
        rendered.style.display = 'block';
        raw.style.display = 'none';
        btnRaw?.classList.remove('active');
        btnRendered?.classList.add('active');
      }
    }

    function copyConstitution() {
      if (!appData?.constitution) return;
      navigator.clipboard.writeText(appData.constitution);
      const btn = document.getElementById('btnCopyConstitution');
      if (btn) {
        const oldText = btn.textContent;
        btn.textContent = I18N[currentLang].copiedBtn;
        setTimeout(() => { btn.textContent = oldText; }, 2000);
      }
    }

    function renderKpis(data) {
      const t = I18N[currentLang];
      document.getElementById('headerProjectName').textContent = data.projectName;
      document.getElementById('kpiSpecs').textContent = data.stats.totalSpecs;
      document.getElementById('kpiSpecsSub').textContent = data.stats.approvedSpecs + ' ' + t.approved + ' · ' + data.stats.draftSpecs + ' ' + t.draft;
      document.getElementById('kpiReqs').textContent = data.stats.totalRequirements;
      document.getElementById('kpiReqsSub').textContent = t.formalized;
      document.getElementById('kpiTasksPercent').textContent = data.stats.overallProgress + '%';
      document.getElementById('kpiTasksBar').style.width = data.stats.overallProgress + '%';
      document.getElementById('kpiTasksSub').textContent = data.stats.completedMicroTasks + ' ' + t.completedOf + ' ' + data.stats.totalMicroTasks;
      document.getElementById('kpiSeverity').textContent = data.severity;
      document.getElementById('kpiSeveritySub').textContent = t.severitySub;
      document.getElementById('navSpecsCount').textContent = data.stats.totalSpecs;
      document.getElementById('navTasksCount').textContent = data.stats.totalMicroTasks;
    }

    function renderEarsBreakdown(breakdown) {
      const container = document.getElementById('earsBreakdownContainer');
      container.innerHTML = '';
      for (const [type, count] of Object.entries(breakdown)) {
        const badge = document.createElement('div');
        badge.className = 'badge ' + getEarsClass(type);
        badge.style.padding = '0.35rem 0.65rem';
        badge.textContent = type + ': ' + count;
        container.appendChild(badge);
      }
    }

    function renderSidebarSpecs(specs) {
      const sidebarList = document.getElementById('sidebarSpecsList');
      sidebarList.innerHTML = '';
      specs.forEach(spec => {
        const item = document.createElement('div');
        item.className = 'nav-item';
        const stCls = spec.status === 'APPROVED' ? 'badge-approved' : 'badge-draft';
        item.innerHTML = '<span>' + spec.id + '</span><span class="badge ' + stCls + '">' + spec.status + '</span>';
        item.onclick = () => selectSpec(spec.id);
        sidebarList.appendChild(item);
      });
    }

    function renderDashboardSpecs(specs) {
      const dashList = document.getElementById('dashboardSpecsCards');
      dashList.innerHTML = '';
      specs.forEach(spec => {
        const div = document.createElement('div');
        div.className = 'req-item';
        div.style.cursor = 'pointer';
        div.onclick = () => selectSpec(spec.id);
        const stCls = spec.status === 'APPROVED' ? 'badge-approved' : 'badge-draft';
        div.innerHTML = '<div class="req-header"><div><span class="req-id">' + spec.id + '</span>: <strong>' + spec.title + '</strong></div><span class="badge ' + stCls + '">' + spec.status + '</span></div><div style="font-size: 0.83rem; color: var(--text-muted); margin-bottom: 0.45rem">' + (spec.context ? spec.context.substring(0, 160) + '...' : '') + '</div><div style="display:flex;gap:0.85rem;font-size:0.78rem;color:var(--text-sub)"><span>Reqs: ' + spec.requirementsCount + '</span><span>' + (spec.date || '') + '</span></div>';
        dashList.appendChild(div);
      });
    }

    function renderDashboard(data) {
      renderKpis(data);
      renderEarsBreakdown(data.stats.earsBreakdown);
      renderSidebarSpecs(data.specs);
      renderDashboardSpecs(data.specs);
      renderTasks(data.tasks);
      const t = I18N[currentLang];
      document.getElementById('graphContent').textContent = data.graphMermaid || t.noGraph;
      const constMd = data.constitution || t.noConstitution;
      document.getElementById('constitutionRendered').innerHTML = renderMarkdownToHtml(constMd);
      document.getElementById('constitutionRawPre').textContent = constMd;
      document.getElementById('constitutionSource').textContent = data.constitutionPath ? '(' + data.constitutionPath + ')' : '';
      if (!selectedSpecId && data.specs.length > 0) {
        selectedSpecId = data.specs[0].id;
      }
      renderSelectedSpec();
    }

    function renderCriteriaBox(crit) {
      if (!crit || (!crit.given && !crit.when && !crit.then)) return '';
      const t = I18N[currentLang];
      let html = '<div class="criteria-box">';
      if (crit.given) html += '<div class="criteria-line"><span class="criteria-tag">' + t.given + '</span><span>' + crit.given + '</span></div>';
      if (crit.when) html += '<div class="criteria-line"><span class="criteria-tag">' + t.when + '</span><span>' + crit.when + '</span></div>';
      if (crit.then) html += '<div class="criteria-line"><span class="criteria-tag">' + t.then + '</span><span>' + crit.then + '</span></div>';
      html += '</div>';
      return html;
    }

    function renderSpecRequirements(reqs) {
      const reqsList = document.getElementById('specReqsList');
      reqsList.innerHTML = '';
      reqs.forEach(req => {
        const reqEl = document.createElement('div');
        reqEl.className = 'req-item';
        reqEl.innerHTML = '<div class="req-header"><span class="req-id">' + req.id + ': ' + req.name + '</span><span class="badge ' + getEarsClass(req.type) + '">' + (req.type || 'Standard') + '</span></div><div class="req-declaration">' + req.declaration + '</div>' + renderCriteriaBox(req.acceptanceCriteria);
        reqsList.appendChild(reqEl);
      });
    }

    function renderSelectedSpec() {
      if (!appData || !selectedSpecId) return;
      const spec = appData.specs.find(s => s.id === selectedSpecId);
      if (!spec) return;

      const t = I18N[currentLang];
      const stCls = spec.status === 'APPROVED' ? 'badge-approved' : 'badge-draft';
      const container = document.getElementById('specsDetailedContainer');
      const printBtn = '<button class="btn btn-primary no-print" onclick="window.print()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> ' + t.printBtn + '</button>';
      const contextSection = spec.context ? '<div style="margin-bottom: 1.25rem"><h4 style="font-size:0.75rem;text-transform:uppercase;color:var(--text-sub);margin-bottom:0.45rem;letter-spacing:0.05em">' + t.context + '</h4><div class="markdown-body" style="background:var(--bg-card);padding:0.9rem;border-radius:var(--radius-sm)">' + renderMarkdownToHtml(spec.context) + '</div></div>' : '';

      container.innerHTML = '<div class="card"><div class="card-header"><div><div class="card-title">' + spec.id + ': ' + spec.title + '</div><div class="card-meta"><span>' + t.status + ': <strong class="badge ' + stCls + '">' + spec.status + '</strong></span><span>' + t.severity + ': <strong>' + (spec.severity || appData.severity) + '</strong></span></div></div>' + printBtn + '</div>' + contextSection + '<div style="margin-bottom:1.25rem"><h4 style="font-size:0.75rem;text-transform:uppercase;color:var(--text-sub);margin-bottom:0.6rem;letter-spacing:0.05em">' + t.requirements + '</h4><div id="specReqsList"></div></div></div>';
      renderSpecRequirements(spec.requirements);
    }

    function renderTasks(taskLists) {
      const container = document.getElementById('tasksListContainer');
      container.innerHTML = '';
      const t = I18N[currentLang];
      if (!taskLists || taskLists.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted); font-size:0.88rem;">' + t.noTasks + '</div>';
        return;
      }

      const checkSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      const emptySvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle></svg>';

      taskLists.forEach(tl => {
        const sec = document.createElement('div');
        sec.style.marginBottom = '1.75rem';
        sec.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:0.4rem"><h3 style="font-size:1rem;font-weight:600">' + tl.id + ': ' + tl.title + '</h3><span class="badge badge-approved">' + tl.completedTasks + '/' + tl.totalTasks + ' (' + tl.progressPercent + '%)</span></div><div class="progress-bar-container" style="margin-bottom:0.85rem"><div class="progress-bar-fill" style="width:' + tl.progressPercent + '%"></div></div><div class="t-rows"></div>';
        const tRows = sec.querySelector('.t-rows');
        tl.tasks.forEach(task => {
          const row = document.createElement('div');
          row.className = 'task-row';
          const isDone = task.status === 'DONE';
          row.innerHTML = '<div class="task-left">' + (isDone ? checkSvg : emptySvg) + '<span class="task-id">' + task.id + '</span><span class="task-title" style="' + (isDone ? 'text-decoration:line-through;color:var(--text-sub);' : '') + '">' + task.title + '</span></div><div><span class="badge badge-' + task.status.toLowerCase() + '">' + task.status + '</span></div>';
          tRows.appendChild(row);
        });
        container.appendChild(sec);
      });
    }

    fetchProjectData();
  </script>
</body>
</html>`;

export function generateDashboardHtml(): string {
  return DASHBOARD_HTML;
}
