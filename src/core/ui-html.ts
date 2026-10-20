/**
 * Generador de la interfaz web para el Dashboard y Visualizador SDD.
 * Implementa diseño Rich Aesthetics, navegación reactiva, tabs y soporte de impresión (@media print).
 */

export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SDD Visualizer & Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #090d16;
      --bg-surface: #0f172a;
      --bg-card: #182238;
      --bg-card-hover: #1e2c48;
      --border: #263554;
      --border-accent: #3b82f6;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-sub: #64748b;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --primary-glow: rgba(99, 102, 241, 0.25);
      --success: #10b981;
      --success-glow: rgba(16, 185, 129, 0.2);
      --warning: #f59e0b;
      --warning-glow: rgba(245, 158, 11, 0.2);
      --danger: #ef4444;
      --info: #06b6d4;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
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
    }

    header {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 0.85rem 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand { display: flex; align-items: center; gap: 0.85rem; }
    .logo-badge {
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      color: white;
      font-weight: 800;
      font-size: 0.95rem;
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-sm);
      box-shadow: 0 0 15px var(--primary-glow);
    }

    .brand-title { font-size: 1.15rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    .project-name {
      color: var(--info);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      background: rgba(6, 182, 212, 0.12);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(6, 182, 212, 0.25);
    }

    .header-actions { display: flex; align-items: center; gap: 0.75rem; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.9rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-main);
      transition: all 0.2s ease;
    }
    .btn:hover { background: var(--bg-card-hover); border-color: var(--primary); }
    .btn-primary { background: var(--primary); border-color: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-hover); }

    .app-container { display: flex; flex: 1; }
    aside {
      width: 280px;
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      height: calc(100vh - 61px);
      position: sticky;
      top: 61px;
      overflow-y: auto;
    }

    .nav-section { padding: 1.25rem 1rem 0.5rem; }
    .nav-title { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-sub); font-weight: 700; margin-bottom: 0.5rem; }
    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.75rem;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.88rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    .nav-item:hover { background: rgba(255, 255, 255, 0.04); color: var(--text-main); }
    .nav-item.active { background: var(--primary-glow); color: var(--primary); font-weight: 600; border-left: 3px solid var(--primary); }
    .nav-badge { font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 999px; background: var(--bg-base); border: 1px solid var(--border); font-family: 'JetBrains Mono', monospace; }

    main { flex: 1; padding: 2rem 2.5rem; max-width: 1200px; margin: 0 auto; width: 100%; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
    .stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .stat-card:hover { transform: translateY(-2px); border-color: var(--border-accent); }
    .stat-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; }
    .stat-value { font-size: 2rem; font-weight: 800; margin-top: 0.25rem; display: flex; align-items: baseline; gap: 0.5rem; }
    .stat-sub { font-size: 0.8rem; color: var(--text-sub); }

    .progress-bar-container { background: var(--bg-base); height: 8px; border-radius: 999px; overflow: hidden; margin-top: 0.75rem; border: 1px solid var(--border); }
    .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #10b981, #06b6d4); border-radius: 999px; }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }
    .badge-approved { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-draft { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-blocked { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-done { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-pending { background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }

    .ears-ubiquitous { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); }
    .ears-event { background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
    .ears-state { background: rgba(245, 158, 11, 0.15); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); }
    .ears-unwanted { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
    .ears-optional { background: rgba(6, 182, 212, 0.15); color: #67e8f9; border: 1px solid rgba(6, 182, 212, 0.3); }

    .view-panel { display: none; }
    .view-panel.active { display: block; }

    .card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.75rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .card-title { font-size: 1.4rem; font-weight: 700; }
    .card-meta { display: flex; flex-wrap: wrap; gap: 1.25rem; font-size: 0.85rem; color: var(--text-muted); margin-top: 0.4rem; }

    .req-item {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-bottom: 1rem;
    }
    .req-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .req-id { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.95rem; color: var(--primary); }
    .req-declaration {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 0.85rem;
      border-left: 3px solid var(--primary);
      background: rgba(99, 102, 241, 0.05);
      padding: 0.6rem 0.85rem;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    }

    .criteria-box {
      background: var(--bg-base);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.85rem 1rem;
      font-size: 0.85rem;
      display: grid;
      gap: 0.4rem;
    }
    .criteria-line { display: flex; gap: 0.75rem; }
    .criteria-tag { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--info); min-width: 65px; }

    .task-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      margin-bottom: 0.5rem;
    }
    .task-left { display: flex; align-items: center; gap: 0.85rem; flex: 1; }
    .task-id { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); }
    .task-title { font-size: 0.92rem; font-weight: 500; }
    .task-verify {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      background: var(--bg-base);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      color: var(--text-sub);
    }

    @media print {
      body { background: white !important; color: black !important; font-size: 11pt; }
      header, aside, .header-actions, .nav-section, .btn, .no-print { display: none !important; }
      main { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
      .card { background: white !important; border: 1px solid #ccc !important; box-shadow: none !important; page-break-inside: avoid; }
      .req-item { background: #fbfbfb !important; border: 1px solid #ddd !important; page-break-inside: avoid; }
      .req-declaration { background: #f0f4ff !important; color: #1e3a8a !important; border-left: 3px solid #3b82f6 !important; }
      .criteria-box { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; color: #334155 !important; }
      .badge { border: 1px solid #999 !important; color: black !important; background: #eee !important; }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span class="logo-badge">SDD</span>
      <div class="brand-title">
        <span>Spec-Driven Development</span>
        <span class="project-name" id="headerProjectName">cargando...</span>
      </div>
    </div>
    <div class="header-actions">
      <button class="btn" onclick="fetchProjectData(true)" title="Recargar datos"><span>↻</span> Actualizar</button>
      <button class="btn btn-primary" onclick="window.print()" title="Imprimir o guardar como PDF"><span>🖨</span> Imprimir / PDF</button>
    </div>
  </header>

  <div class="app-container">
    <aside>
      <div class="nav-section">
        <div class="nav-title">Navegación</div>
        <div class="nav-item active" onclick="switchView('dashboard')"><span>📊 Resumen General</span></div>
        <div class="nav-item" onclick="switchView('specs')"><span>📄 Especificaciones</span><span class="nav-badge" id="navSpecsCount">0</span></div>
        <div class="nav-item" onclick="switchView('tasks')"><span>📋 Micro-Tareas</span><span class="nav-badge" id="navTasksCount">0</span></div>
        <div class="nav-item" onclick="switchView('graph')"><span>🗺 Grafo Arquitectura</span></div>
        <div class="nav-item" onclick="switchView('constitution')"><span>⚖ Constitución</span></div>
      </div>
      <div class="nav-section">
        <div class="nav-title">Especificaciones</div>
        <div id="sidebarSpecsList"></div>
      </div>
    </aside>

    <main>
      <section id="view-dashboard" class="view-panel active">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Especificaciones</div>
            <div class="stat-value" id="kpiSpecs">0</div>
            <div class="stat-sub" id="kpiSpecsSub">0 aprobadas · 0 borrador</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Requerimientos EARS</div>
            <div class="stat-value" id="kpiReqs">0</div>
            <div class="stat-sub" id="kpiReqsSub">100% formalizados</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Progreso Micro-Tareas</div>
            <div class="stat-value" id="kpiTasksPercent">0%</div>
            <div class="progress-bar-container"><div class="progress-bar-fill" id="kpiTasksBar" style="width: 0%"></div></div>
            <div class="stat-sub" id="kpiTasksSub" style="margin-top: 0.5rem">0 de 0 completadas</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Severidad del Árbitro</div>
            <div class="stat-value" id="kpiSeverity" style="color: var(--primary)">L2</div>
            <div class="stat-sub">Standard / Producción</div>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom: 1rem">Desglose EARS</div>
          <div id="earsBreakdownContainer" style="display: flex; gap: 1rem; flex-wrap: wrap;"></div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom: 1rem">Especificaciones del Proyecto</div>
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
              <div class="card-title">Micro-Tareas de Implementación</div>
              <div class="card-meta">Ejecución verificable y determinista para agentes</div>
            </div>
          </div>
          <div id="tasksListContainer"></div>
        </div>
      </section>

      <section id="view-graph" class="view-panel">
        <div class="card">
          <div class="card-title" style="margin-bottom: 0.5rem">Grafo de Arquitectura</div>
          <div class="card-meta" style="margin-bottom: 1.5rem">Ahorro de tokens y navegación indexada</div>
          <div style="background: var(--bg-base); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1.5rem; overflow-x: auto;">
            <pre id="graphContent" style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--text-muted); white-space: pre-wrap;"></pre>
          </div>
        </div>
      </section>

      <section id="view-constitution" class="view-panel">
        <div class="card">
          <div class="card-title" style="margin-bottom: 0.5rem">Constitución del Proyecto (AGENTS.md)</div>
          <div class="card-meta" style="margin-bottom: 1.5rem">Anti-Vibe Coding, Anti-Sycophancy y Auto-Grill</div>
          <div style="background: var(--bg-base); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1.5rem; overflow-x: auto;">
            <pre id="constitutionContent" style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--text-muted); white-space: pre-wrap;"></pre>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script>
    let appData = null;
    let selectedSpecId = null;

    async function fetchProjectData() {
      try {
        const res = await fetch('/api/data');
        appData = await res.json();
        renderDashboard(appData);
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

    function renderKpis(data) {
      document.getElementById('headerProjectName').textContent = data.projectName;
      document.getElementById('kpiSpecs').textContent = data.stats.totalSpecs;
      document.getElementById('kpiSpecsSub').textContent = data.stats.approvedSpecs + ' aprobadas · ' + data.stats.draftSpecs + ' borrador';
      document.getElementById('kpiReqs').textContent = data.stats.totalRequirements;
      document.getElementById('kpiTasksPercent').textContent = data.stats.overallProgress + '%';
      document.getElementById('kpiTasksBar').style.width = data.stats.overallProgress + '%';
      document.getElementById('kpiTasksSub').textContent = data.stats.completedMicroTasks + ' de ' + data.stats.totalMicroTasks + ' completadas';
      document.getElementById('kpiSeverity').textContent = data.severity;
      document.getElementById('navSpecsCount').textContent = data.stats.totalSpecs;
      document.getElementById('navTasksCount').textContent = data.stats.totalMicroTasks;
    }

    function renderEarsBreakdown(breakdown) {
      const container = document.getElementById('earsBreakdownContainer');
      container.innerHTML = '';
      for (const [type, count] of Object.entries(breakdown)) {
        const badge = document.createElement('div');
        badge.className = 'badge ' + getEarsClass(type);
        badge.style.padding = '0.5rem 0.85rem';
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

    function renderDashboardSpecs(specs, defaultSeverity) {
      const dashList = document.getElementById('dashboardSpecsCards');
      dashList.innerHTML = '';
      specs.forEach(spec => {
        const div = document.createElement('div');
        div.className = 'req-item';
        div.style.cursor = 'pointer';
        div.onclick = () => selectSpec(spec.id);
        const stCls = spec.status === 'APPROVED' ? 'badge-approved' : 'badge-draft';
        div.innerHTML = '<div class="req-header"><div><span class="req-id">' + spec.id + '</span>: <strong>' + spec.title + '</strong></div><span class="badge ' + stCls + '">' + spec.status + '</span></div><div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem">' + (spec.context ? spec.context.substring(0, 160) + '...' : 'Sin descripción') + '</div><div style="display:flex;gap:0.75rem;font-size:0.8rem;color:var(--text-sub)"><span>📌 Reqs: ' + spec.requirementsCount + '</span><span>📅 ' + (spec.date || 'Reciente') + '</span></div>';
        dashList.appendChild(div);
      });
    }

    function renderDashboard(data) {
      renderKpis(data);
      renderEarsBreakdown(data.stats.earsBreakdown);
      renderSidebarSpecs(data.specs);
      renderDashboardSpecs(data.specs, data.severity);
      renderTasks(data.tasks);
      document.getElementById('graphContent').textContent = data.graphMermaid || "No se generó grafo aún. Ejecuta 'sdd graph' para crearlo.";
      document.getElementById('constitutionContent').textContent = data.constitution || 'No se encontró AGENTS.md.';
      if (!selectedSpecId && data.specs.length > 0) {
        selectedSpecId = data.specs[0].id;
      }
      renderSelectedSpec();
    }

    function renderCriteriaBox(crit) {
      if (!crit || (!crit.given && !crit.when && !crit.then)) return '';
      let html = '<div class="criteria-box">';
      if (crit.given) html += '<div class="criteria-line"><span class="criteria-tag">DADO:</span><span>' + crit.given + '</span></div>';
      if (crit.when) html += '<div class="criteria-line"><span class="criteria-tag">CUANDO:</span><span>' + crit.when + '</span></div>';
      if (crit.then) html += '<div class="criteria-line"><span class="criteria-tag">ENTONCES:</span><span>' + crit.then + '</span></div>';
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

      const stCls = spec.status === 'APPROVED' ? 'badge-approved' : 'badge-draft';
      const container = document.getElementById('specsDetailedContainer');
      container.innerHTML = '<div class="card"><div class="card-header"><div><div class="card-title">' + spec.id + ': ' + spec.title + '</div><div class="card-meta"><span>Estado: <strong class="badge ' + stCls + '">' + spec.status + '</strong></span><span>Severidad: <strong>' + (spec.severity || appData.severity) + '</strong></span></div></div><button class="btn btn-primary no-print" onclick="window.print()"><span>🖨</span> Imprimir</button></div>' + (spec.context ? '<div style="margin-bottom: 1.5rem"><h4 style="font-size:0.85rem;text-transform:uppercase;color:var(--text-sub);margin-bottom:0.4rem">Contexto</h4><p style="background:var(--bg-card);padding:0.85rem;border-radius:var(--radius-sm)">' + spec.context + '</p></div>' : '') + '<div style="margin-bottom:1.5rem"><h4 style="font-size:0.85rem;text-transform:uppercase;color:var(--text-sub);margin-bottom:0.75rem">Requerimientos EARS</h4><div id="specReqsList"></div></div></div>';
      renderSpecRequirements(spec.requirements);
    }

    function renderTasks(taskLists) {
      const container = document.getElementById('tasksListContainer');
      container.innerHTML = '';
      if (!taskLists || taskLists.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted)">No hay tareas en .sdd/tasks/.</div>';
        return;
      }

      taskLists.forEach(tl => {
        const sec = document.createElement('div');
        sec.style.marginBottom = '2rem';
        sec.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:0.5rem"><h3 style="font-size:1.1rem">' + tl.id + ': ' + tl.title + '</h3><span class="badge badge-approved">' + tl.completedTasks + '/' + tl.totalTasks + ' (' + tl.progressPercent + '%)</span></div><div class="progress-bar-container" style="margin-bottom:1rem"><div class="progress-bar-fill" style="width:' + tl.progressPercent + '%"></div></div><div class="t-rows"></div>';
        const tRows = sec.querySelector('.t-rows');
        tl.tasks.forEach(t => {
          const row = document.createElement('div');
          row.className = 'task-row';
          const isDone = t.status === 'DONE';
          row.innerHTML = '<div class="task-left"><span>' + (isDone ? '✔' : '○') + '</span><span class="task-id">' + t.id + '</span><span class="task-title" style="' + (isDone ? 'text-decoration:line-through;opacity:0.7;' : '') + '">' + t.title + '</span></div><div><span class="badge badge-' + t.status.toLowerCase() + '">' + t.status + '</span></div>';
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
