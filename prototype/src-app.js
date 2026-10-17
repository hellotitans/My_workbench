var C = {
  dev:'#45d8ff', study:'#ff58b0', body:'#d9f05e', mind:'#7ae7ff',
  amber:'#EF9F27', goldHi:'#ecff77', cyanHi:'#7ae7ff',
  grid:'rgba(120,140,190,.13)', axis:'rgba(120,140,190,.28)',
  t3:'rgba(158,168,198,.9)', t2:'rgba(200,210,235,.95)'
};

function sq(n, seed){ var x = Math.sin(seed) * 10000; return x - Math.floor(x); }
function noise(i, s){ return Math.sin(i * 1.7 + s * 3.1) * 0.5 + Math.sin(i * 0.6 + s * 7.7) * 0.5; }
function series(n, base, amp, seed){
  var a = [], v = base;
  for (var i = 0; i < n; i++){
    v = v + (noise(i, seed) - v * 0.06) * 0.34 + 0.9;
    if (v < 4) v = 4 + Math.abs(v);
    if (v > 100) v = 100;
    a.push(Math.round(base + (v - base) * 0.72 + amp * noise(i, seed + 2.2)));
  }
  return a.map(function(x){ return Math.max(3, Math.min(100, x)); });
}
function days(n){
  var a = [], d = new Date(2026, 9, 17);
  for (var i = n - 1; i >= 0; i--){ var x = new Date(d.getTime() - i * 864e5); a.push((x.getMonth() + 1) + '.' + x.getDate()); }
  return a;
}

function W(w, h, inner){ return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto">' + inner + '</svg>'; }
function pathOf(pts){ return pts.map(function(p, i){ return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '); }
function areaOf(pts, y0){ return pathOf(pts) + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + y0 + ' L' + pts[0][0].toFixed(1) + ' ' + y0 + ' Z'; }

function plotFrame(w, h, pad, rows, cols, labels){
  var x0 = pad.l, x1 = w - pad.r, y0 = pad.t, y1 = h - pad.b, s = '';
  for (var r = 0; r <= rows; r++){
    var y = y0 + (y1 - y0) * r / rows;
    s += '<line x1="' + x0 + '" y1="' + y.toFixed(1) + '" x2="' + x1 + '" y2="' + y.toFixed(1) + '" stroke="' + (r === rows ? C.axis : C.grid) + '" stroke-width="1"/>';
  }
  if (labels && labels.length){
    for (var c = 0; c < labels.length; c++){
      if (labels[c] === '') continue;
      var x = x0 + (x1 - x0) * c / (labels.length - 1);
      s += '<text x="' + x.toFixed(1) + '" y="' + (y1 + 15) + '" font-size="9.5" fill="' + C.t3 + '" text-anchor="middle" font-family="var(--mono)">' + labels[c] + '</text>';
    }
  }
  return s;
}

function lineChart(w, h, sets, labels, opts){
  opts = opts || {};
  var pad = { l: 34, r: 12, t: 12, b: 24 }, n = sets[0].d.length;
  var x0 = pad.l, x1 = w - pad.r, y0 = pad.t, y1 = h - pad.b;
  var mx = opts.max || 100, mn = opts.min || 0;
  var s = plotFrame(w, h, pad, 4, n - 1, labels);
  var fmt = function(v){ return (Math.round(v * 10) / 10).toString(); };
  [mn, (mn + mx) / 2, mx].forEach(function(tv){
    s += '<text x="' + (x0 - 6) + '" y="' + (y1 - (y1 - y0) * (tv - mn) / (mx - mn) + 3.5) + '" font-size="9.5" fill="' + C.t3 + '" text-anchor="end" font-family="var(--mono)">' + fmt(tv) + '</text>';
  });
  if (opts.target != null && opts.target > mn && opts.target < mx){
    var ty = y1 - (y1 - y0) * (opts.target - mn) / (mx - mn);
    s += '<line x1="' + x0 + '" y1="' + ty.toFixed(1) + '" x2="' + x1 + '" y2="' + ty.toFixed(1) + '" stroke="' + C.body + '" stroke-width="1.2" stroke-dasharray="5 4" opacity=".78"/>';
    s += '<text x="' + (x1 - 4) + '" y="' + (ty - 5).toFixed(1) + '" text-anchor="end" font-size="9.5" fill="' + C.body + '" font-family="var(--mono)">目标 ' + opts.target.toFixed(1) + '</text>';
  }
  sets.forEach(function(se){
    var pts = se.d.map(function(v, i){
      return [x0 + (x1 - x0) * i / (n - 1), y1 - (y1 - y0) * (Math.min(v, mx) - mn) / (mx - mn)];
    });
    if (opts.area){ s += '<path d="' + areaOf(pts, y1) + '" fill="' + se.c + '" opacity=".10"/>'; }
    s += '<path d="' + pathOf(pts) + '" fill="none" stroke="' + se.c + '" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"' + (se.dash ? ' stroke-dasharray="4 3"' : '') + '/>';
    s += '<circle cx="' + pts[pts.length - 1][0].toFixed(1) + '" cy="' + pts[pts.length - 1][1].toFixed(1) + '" r="3.2" fill="' + se.c + '"/>';
  });
  return W(w, h, s);
}

// 三层同心计划环：内=今日清单 / 中=短期计划 / 外=长期计划
function ringChart(w, h, rings, centerLabel){
  var cx = 138, cy = h / 2;
  var rs = [{ r: 50, wd: 12 }, { r: 78, wd: 12 }, { r: 106, wd: 12 }];
  var s = '';
  rings.forEach(function(rg, i){
    var r = rs[i].r, wd = rs[i].wd, circ = 2 * Math.PI * r;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="rgba(120,140,190,.16)" stroke-width="' + wd + '"/>';
    var pct = Math.max(0, Math.min(100, rg.pct));
    var dash = circ * pct / 100;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + rg.c + '" stroke-width="' + wd + '" stroke-linecap="round" stroke-dasharray="' + dash.toFixed(1) + ' ' + circ.toFixed(1) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
  });
  s += '<text x="' + cx + '" y="' + (cy + 1) + '" text-anchor="middle" font-size="29" font-weight="700" fill="' + rings[0].c + '" font-family="var(--mono)">' + rings[0].pct + '%</text>';
  s += '<text x="' + cx + '" y="' + (cy + 21) + '" text-anchor="middle" font-size="10" fill="' + C.t3 + '" font-family="var(--mono)">' + centerLabel + '</text>';
  var lx = 280, ly = cy - 52;
  rings.forEach(function(rg, i){
    var y = ly + i * 44;
    s += '<circle cx="' + lx + '" cy="' + (y - 4) + '" r="4.5" fill="' + rg.c + '"/>';
    s += '<text x="' + (lx + 15) + '" y="' + y + '" font-size="12.5" fill="' + C.t2 + '" font-weight="700" font-family="var(--mono)">' + rg.pct + '%</text>';
    s += '<text x="' + (lx + 62) + '" y="' + y + '" font-size="12" fill="' + C.t2 + '">' + rg.label + '</text>';
    s += '<text x="' + (lx + 15) + '" y="' + (y + 15) + '" font-size="10" fill="' + C.t3 + '" font-family="var(--mono)">' + rg.sub + '</text>';
  });
  return W(w, h, s);
}

function barChart(w, h, vals, labels, colors){
  var pad = { l: 30, r: 10, t: 12, b: 24 }, n = vals.length;
  var x0 = pad.l, x1 = w - pad.r, y0 = pad.t, y1 = h - pad.b;
  var mx = Math.max.apply(null, vals) * 1.18;
  var s = plotFrame(w, h, pad, 4, n - 1, labels);
  var bw = Math.min(26, (x1 - x0) / n * 0.56);
  vals.forEach(function(v, i){
    var cx = x0 + (x1 - x0) * (i + 0.5) / n, bh = (y1 - y0) * v / mx;
    s += '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + (y1 - bh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="3" fill="' + colors[i % colors.length] + '" opacity=".82"/>';
    s += '<text x="' + cx.toFixed(1) + '" y="' + (y1 - bh - 5).toFixed(1) + '" font-size="9.5" fill="' + C.t2 + '" text-anchor="middle" font-family="var(--mono)">' + v + '</text>';
  });
  return W(w, h, s);
}

function dualBar(w, h, openC, solveC, labels){
  var pad = { l: 30, r: 10, t: 12, b: 24 }, n = openC.length;
  var x0 = pad.l, x1 = w - pad.r, y0 = pad.t, y1 = h - pad.b;
  var mx = Math.max.apply(null, openC.concat(solveC)) * 1.25 || 1;
  var s = plotFrame(w, h, pad, 4, n - 1, labels);
  var bw = Math.min(9, (x1 - x0) / n * 0.3);
  openC.forEach(function(v, i){
    var cx = x0 + (x1 - x0) * (i + 0.5) / n, h1 = (y1 - y0) * v / mx, h2 = (y1 - y0) * solveC[i] / mx;
    s += '<rect x="' + (cx - bw - 1).toFixed(1) + '" y="' + (y1 - h1).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h1.toFixed(1) + '" rx="2" fill="' + C.amber + '" opacity=".8"/>';
    s += '<rect x="' + (cx + 1).toFixed(1) + '" y="' + (y1 - h2).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h2.toFixed(1) + '" rx="2" fill="' + C.goldHi + '" opacity=".9"/>';
  });
  s += '<text x="' + x0 + '" y="' + (y0 - 1) + '" font-size="9.5" fill="' + C.amber + '" font-family="var(--mono)">■ 新增</text>';
  s += '<text x="' + (x0 + 52) + '" y="' + (y0 - 1) + '" font-size="9.5" fill="' + C.goldHi + '" font-family="var(--mono)">■ 解决</text>';
  return W(w, h, s);
}

function heatStrip(w, h, arr, labels){
  var pad = { l: 34, r: 8, t: 8, b: 20 }, n = arr.length;
  var x0 = pad.l, x1 = w - pad.r, y0 = pad.t, y1 = h - pad.b;
  var bw = (x1 - x0) / n, s = '';
  arr.forEach(function(v, i){
    var x = x0 + bw * i, op = 0.1 + v * 0.9;
    s += '<rect x="' + (x + 1).toFixed(1) + '" y="' + y0 + '" width="' + (bw - 2).toFixed(1) + '" height="' + (y1 - y0) + '" rx="2" fill="' + C.cyanHi + '" opacity="' + op.toFixed(2) + '"/>';
    if (labels && labels[i]) s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (y1 + 13) + '" font-size="8.5" fill="' + C.t3 + '" text-anchor="middle" font-family="var(--mono)">' + labels[i] + '</text>';
  });
  ['灵', '训', '睡'].forEach(function(t, i){
    s += '<text x="' + (x0 - 5) + '" y="' + (y0 + 11 + i * (y1 - y0) / 3) + '" font-size="9" fill="' + C.t3 + '" text-anchor="end">' + t + '</text>';
  });
  return W(w, h, s);
}

function partsBar(w, h, parts){
  var s = '', x = 0, total = parts.reduce(function(a, b){ return a + b.v; }, 0);
  var cols = [C.body, C.dev, C.study, C.mind, C.cyanHi, '#ff9ed2'];
  parts.forEach(function(p, i){
    var bw = (w - 8) * p.v / total;
    s += '<rect x="' + (4 + x).toFixed(1) + '" y="4" width="' + Math.max(0, bw - 2).toFixed(1) + '" height="16" rx="3" fill="' + cols[i % cols.length] + '" opacity=".85"/>';
    s += '<text x="' + (4 + x + bw / 2).toFixed(1) + '" y="16" font-size="9.5" fill="#08111a" text-anchor="middle" font-weight="700" font-family="var(--mono)">' + p.k + ' ' + p.v + '</text>';
    x += bw;
  });
  return W(w, h, s);
}

var LBL30 = days(30), LBL7 = days(7);
var OPENC = [2, 1, 3, 1, 2, 0, 3], SOLVEC = [1, 2, 0, 2, 1, 3, 4];
var OUT7 = [5, 3, 7, 2, 6, 8, 4];
var BODYFLAG = (function(){ var a = []; for (var i = 0; i < 30; i++){ a.push(Math.abs(noise(i, 5)) > 0.42 ? 0 : Math.min(1, 0.45 + Math.abs(noise(i, 11)) * 0.75)); } return a; })();
var HABITF = (function(){ var a = []; for (var i = 0; i < 30; i++){ a.push(Math.min(1, 0.3 + Math.abs(noise(i, 17)) * 1.1)); } return a; })();
var WEIGHT = series(30, 62, 1.1, 29).map(function(v){ return 60 + v * 0.032; });
var W_GOAL = 60.0;

var RING_TODAY = [
  { pct: 40, c: '#45d8ff', label: '今日清单', sub: '今日 2 / 5 件 · 来自各领域计划链' },
  { pct: 56, c: '#d9f05e', label: '短期计划', sub: '4 条进行中 · 按条目进度均值' },
  { pct: 23, c: '#ff58b0', label: '长期计划', sub: '3 个目标 · 按里程碑折算' }
];
var RING_WEEK = [
  { pct: 63, c: '#45d8ff', label: '本周待办完成率', sub: '37 / 59 件 · 较上周 +6%' },
  { pct: 71, c: '#d9f05e', label: '短期计划推进', sub: '按里程碑折算 · 较上周 +6%' },
  { pct: 28, c: '#ff58b0', label: '长期计划推进', sub: '按里程碑折算 · 较上周 +3%' }
];

function renderFocus(kind){
  var box = document.getElementById('chartBox');
  if (!box) return;
  if (kind === 'open'){ box.innerHTML = dualBar(680, 250, OPENC, SOLVEC, LBL7); return; }
  if (kind === 'out'){ box.innerHTML = barChart(680, 250, OUT7, LBL7, [C.dev, C.study, C.body, C.mind]); return; }
  box.innerHTML = ringChart(680, 250, RING_TODAY, '今日');
}

function renderWeight(){
  var el = document.getElementById('chartWeight');
  if (!el) return;
  var cur = WEIGHT[WEIGHT.length - 1];
  el.innerHTML = lineChart(360, 150, [{ d: WEIGHT, c: C.body }], LBL30, { max: 64, min: 58, target: W_GOAL, area: true });
  var e1 = document.getElementById('wCur'); if (e1) e1.textContent = cur.toFixed(1);
  var e2 = document.getElementById('wGoalV'); if (e2) e2.textContent = W_GOAL.toFixed(1);
  var e3 = document.getElementById('wGap');
  if (e3){ var gap = cur - W_GOAL; e3.textContent = '距目标 ' + (gap >= 0 ? '+' : '−') + Math.abs(gap).toFixed(1); }
}

function renderOnce(id, html){
  var el = document.getElementById(id);
  if (el && !el.dataset.done){ el.innerHTML = html; el.dataset.done = '1'; }
}

/* ===== 开发领域：阶段 → 条目 / 沉淀 ===== */
var DEV_DATA = {
  s1: { name: '阶段一 · 检索链路打通', items: [
    { t: '文档入库解析（PDF / Word / Markdown）', done: true },
    { t: '按段落边界切分 + 标题继承', done: true },
    { t: 'bge-large 向量化入库', done: true },
    { t: '检索接口封装（top-k + 相似度阈值）', done: true },
    { t: '端到端问答串起来，跑通完整一条', done: true }
  ] },
  s2: { name: '阶段二 · 效果调优与评测', items: [
    { t: '语义切分按段落边界 + 标题继承', done: true },
    { t: '换 bge-large embedding', done: true },
    { t: '建 200 条评测集（按难度分三档）', done: false, today: true },
    { t: 'rerank 参数扫描，确认收益上限', done: false, today: true },
    { t: '写评测脚本：召回率 / 延迟 / 可读率 三列输出', done: false }
  ] },
  s3: { name: '阶段三 · 工程化与上线', items: [
    { t: '拆模块：解析 / 切分 / 检索 / 生成 四层', done: false },
    { t: '加结果缓存，把延迟压到 3s 内', done: false },
    { t: '模型可切换配置化', done: false },
    { t: '一条命令起本地服务', done: false }
  ] },
  s4: { name: '阶段一 · 工具抽象与注册', items: [
    { t: '定工具描述格式（名称 / 入参 / 出参 / 幂等标记）', done: true },
    { t: '实现自动注册与校验', done: true },
    { t: '写一个示例工具并跑通注册流程', done: true },
    { t: '工具描述的版本管理', done: false }
  ] },
  s5: { name: '阶段二 · 编排与失败恢复', items: [
    { t: '串行编排执行器', done: false },
    { t: '并行分支与结果汇聚', done: false },
    { t: '失败重试策略（次数 / 退避 / 幂等）', done: false },
    { t: '每步快照，断点可单步重跑', done: false },
    { t: '执行轨迹落库，可回放排查', done: false }
  ] }
};
var devCurStage = 's2';
var SED_COLOR = { '灵感': '#ff58b0', '心得': '#d9f05e', '规范': '#45d8ff' };
var SED = [
  { tag: '灵感', t: '把评测集按难度分三档，先跑简单档定位上限，再决定值不值得继续调参', d: '10.17' },
  { tag: '心得', t: 'rerank 只带来 0.02 —— 瓶颈在召回不在排序。先测上限再调参，别在排序上耗', d: '10.16' },
  { tag: '规范', t: '新模块先写评测再写实现；评测集与代码同目录，改动即跑', d: '10.14' },
  { tag: '心得', t: 'Embedding 换 bge-large 后相似度分布明显分离 —— 选错模型比调参大一个量级', d: '10.12' }
];
var sedFilter = 'all';

function hexa(h, a){
  var n = parseInt(h.slice(1), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}
function renderDevItems(){
  var st = DEV_DATA[devCurStage];
  if (!st) return;
  var h = document.getElementById('devStageName');
  if (h) h.textContent = st.name;
  var el = document.getElementById('devItems');
  if (!el) return;
  el.innerHTML = st.items.map(function(it, i){
    return '<div class="it-row' + (it.done ? ' done' : '') + '">' +
      '<span class="seq">' + (i + 1) + '</span>' +
      '<span class="tx">' + it.t + '</span>' +
      '<span class="ops">' +
      (it.done ? '<span class="done-pill">已完成</span>' : '<button class="ck2" data-ck="' + i + '">完成</button>') +
      '<button class="mini' + (it.today ? ' on' : '') + '" data-today="' + i + '">' + (it.today ? '已在今日' : '加入今日') + '</button>' +
      '</span></div>';
  }).join('');
}
function renderSed(){
  var el = document.getElementById('sedList');
  if (!el) return;
  var arr = SED.filter(function(x){ return sedFilter === 'all' || x.tag === sedFilter; });
  el.innerHTML = arr.length ? arr.map(function(x){
    return '<div class="sed"><span class="tp" style="background:' + hexa(SED_COLOR[x.tag], .16) + ';color:' + SED_COLOR[x.tag] + '">' + x.tag + '</span>' +
      '<span class="st">' + x.t + '</span><span class="dt">' + x.d + '</span></div>';
  }).join('') : '<div class="empty-tip">这个标签下还没有内容</div>';
}

function paintCharts(key){
  if (key === 'home') renderFocus(document.querySelector('.ctab.on') ? document.querySelector('.ctab.on').dataset.chart : 'rings');
  if (key === 'dev'){ renderDevItems(); renderSed(); }
  if (key === 'body'){
    renderOnce('chartBody', partsBar(640, 26, [{ k: '背', v: 7 }, { k: '腿', v: 6 }, { k: '胸', v: 3 }, { k: '肩', v: 2 }, { k: '核心', v: 4 }, { k: '有氧', v: 2 }]) + heatStrip(640, 92, BODYFLAG, []));
    renderWeight();
  }
  if (key === 'mind') renderOnce('chartHabit', heatStrip(640, 92, HABITF, []));
  if (key === 'review') renderOnce('chartWeek', ringChart(680, 250, RING_WEEK, '本周'));
}

var SUBS = {
  home: '观察 → 行动。今天是你陪伴自己的第 28 天。',
  dev: '独立 AI 项目的推进状态整理 · 今天解锁一个卡点',
  study: '技术与理论的学习与应用状态 · 学了不算，用上才算',
  body: '身体状态整理 · 健身五件套，知识与执行分开',
  mind: '心理与习惯状态 · 在修课题在这个领域被追踪',
  wrap: '一天结束前，四类目各一句 · 收工是仪式不是顺手',
  review: '系统摊数据并提初步观察 · 判断权在你'
};

function go(key){
  ['home', 'dev', 'study', 'body', 'mind', 'wrap', 'review'].forEach(function(k){
    var el = document.getElementById('page-' + k);
    if (el) el.style.display = (k === key) ? '' : 'none';
  });
  document.querySelectorAll('.nav-item').forEach(function(b){ b.classList.toggle('active', b.dataset.go === key); });
  var t = document.getElementById('pgTitle');
  if (t) t.textContent = { home: '今日', dev: '开发', study: '学习', body: '身体', mind: '心智', wrap: '收尾', review: '周复盘' }[key] || '';
  var s = document.getElementById('pgSub');
  if (s) s.textContent = SUBS[key] || '';
  paintCharts(key);
  window.scrollTo(0, 0);
}

document.addEventListener('click', function(e){
  var navTarget = e.target.closest('.nav-item');
  var goTarget = e.target.closest('[data-go]');
  var target = navTarget || goTarget;
  if (target && target.dataset.go){ go(target.dataset.go); return; }
  var tab = e.target.closest('.ctab');
  if (tab){
    document.querySelectorAll('.ctab').forEach(function(b){ b.classList.toggle('on', b === tab); });
    renderFocus(tab.dataset.chart);
    return;
  }
  var pt = e.target.closest('.pj-tog');
  if (pt){ var pj = pt.closest('.dv-pj'); if (pj) pj.classList.toggle('collapsed'); return; }
  var sg = e.target.closest('.stg');
  if (sg){
    document.querySelectorAll('.stg').forEach(function(x){ x.classList.toggle('on', x === sg); });
    devCurStage = sg.dataset.stage;
    renderDevItems();
    return;
  }
  var ck2 = e.target.closest('[data-ck]');
  if (ck2){ DEV_DATA[devCurStage].items[+ck2.dataset.ck].done = true; renderDevItems(); return; }
  var tdb = e.target.closest('[data-today]');
  if (tdb){ var it = DEV_DATA[devCurStage].items[+tdb.dataset.today]; it.today = !it.today; renderDevItems(); return; }
  var atb = e.target.closest('[data-addtoday]');
  if (atb){ atb.classList.add('on'); atb.textContent = '已在今日'; return; }
  var tib = e.target.closest('[data-todayitem]');
  if (tib){ var on = !tib.classList.contains('on'); tib.classList.toggle('on', on); tib.textContent = on ? '已在今日' : '加入今日'; return; }
  var tgb = e.target.closest('[data-tag]');
  if (tgb){
    document.querySelectorAll('[data-tag]').forEach(function(x){ x.classList.toggle('on', x === tgb); });
    sedFilter = tgb.dataset.tag;
    renderSed();
    return;
  }
  if (e.target.closest('#devItemAdd')){
    var di = document.getElementById('devItemIn');
    var dv = (di && di.value || '').trim();
    if (dv){ DEV_DATA[devCurStage].items.push({ t: dv, done: false }); di.value = ''; renderDevItems(); }
    return;
  }
  if (e.target.closest('#sedAdd')){
    var si = document.getElementById('sedIn');
    var sv = (si && si.value || '').trim();
    if (sv){
      var tg = document.getElementById('sedTag').value;
      SED.unshift({ tag: tg, t: sv, d: '今天' });
      si.value = '';
      if (sedFilter !== 'all' && sedFilter !== tg){
        sedFilter = 'all';
        document.querySelectorAll('[data-tag]').forEach(function(x){ x.classList.toggle('on', x.dataset.tag === 'all'); });
      }
      renderSed();
    }
    return;
  }
  var ck = e.target.closest('.ti .ck');
  if (ck){ ck.parentNode.classList.toggle('done'); return; }
  if (e.target.closest('#wSave')){
    var inp = document.getElementById('wIn');
    var v = parseFloat(inp && inp.value);
    if (v >= 40 && v <= 120){ WEIGHT[WEIGHT.length - 1] = v; renderWeight(); inp.value = ''; }
    else if (inp) inp.placeholder = '请输入 40~120 之间的数字';
    return;
  }
  if (e.target.closest('#wGoal')){
    var g = prompt('设定目标体重 (kg)', W_GOAL.toFixed(1));
    var gv = parseFloat(g);
    if (gv >= 40 && gv <= 120){ W_GOAL = gv; renderWeight(); }
  }
});

go('home');
