var JPE_TITLES = {
  "a1-grammar.html": "A1 Grammar - johnplusenglish",
  "a2-grammar.html": "A2 Grammar - johnplusenglish",
  "accent-challenge.html": "Accent Challenge - johnplusenglish",
  "adjectives.html": "Adjectives - johnplusenglish",
  "alibi.html": "Alibi - johnplusenglish",
  "b1-grammar.html": "B1 Grammar - johnplusenglish",
  "b1-reading-test.html": "B1 Preliminary Reading (Parts 1 to 4) · johnplusenglish",
  "b2-grammar.html": "B2 Grammar - johnplusenglish",
  "b2-reading-test.html": "B2 First Reading (Parts 5 to 7) · johnplusenglish",
  "b2-writing.html": "B2 Writing - johnplusenglish",
  "c1-grammar.html": "C1 Grammar - johnplusenglish",
  "c1-reading-test.html": "C1 Advanced Reading (Parts 5 to 8) · johnplusenglish",
  "c1-writing.html": "C1 Writing - johnplusenglish",
  "c2-reading-test.html": "C2 Proficiency Reading (Parts 5 to 7) · johnplusenglish",
  "c2-writing.html": "C2 Writing - johnplusenglish",
  "chat-activity.html": "Chat Activity - johnplusenglish",
  "collaborative-tasks.html": "Collaborative Tasks - johnplusenglish",
  "collocations.html": "Collocations - johnplusenglish",
  "conversation-roulette.html": "Conversation Roulette - johnplusenglish",
  "creative-writing.html": "Creative Writing - johnplusenglish",
  "everyday-phrases.html": "Say It in English - johnplusenglish",
  "exam-photos-speaking.html": "Exam Photos Speaking - johnplusenglish",
  "fixed-expressions.html": "Fixed Expressions - johnplusenglish",
  "grammar-guides.html": "Grammar Guides - johnplusenglish",
  "hot-takes.html": "Hot Takes - johnplusenglish",
  "idioms.html": "Idioms - johnplusenglish",
  "ielts-reading-test.html": "IELTS Academic Reading · johnplusenglish",
  "ielts-listening.html": "IELTS Listening · johnplusenglish",
  "ielts-reading.html": "IELTS Reading · johnplusenglish",
  "ielts-speaking.html": "IELTS Speaking - johnplusenglish",
  "ielts-writing.html": "IELTS Writing - johnplusenglish",
  "index.html": "johnplusenglish - Online English Classes - johnplusenglish",
  "interview-questions.html": "Interview Questions - johnplusenglish",
  "odd-one-out.html": "Odd One Out - johnplusenglish",
  "oet-listening.html": "OET Listening · johnplusenglish",
  "oet-reading.html": "OET Reading (Parts A to C) · johnplusenglish",
  "oet-speaking.html": "OET Speaking · johnplusenglish",
  "oet-writing.html": "OET Writing · johnplusenglish",
  "phrasal-verbs.html": "Phrasal Verbs - johnplusenglish",
  "prepositions.html": "Prepositions - johnplusenglish",
  "quick-debates.html": "Quick Debates - johnplusenglish",
  "reading.html": "Reading · johnplusenglish",
  "resources.html": "Resources - johnplusenglish",
  "role-play-cards.html": "Role Play Cards - johnplusenglish",
  "shrink-it.html": "Shrink It - johnplusenglish",
  "speaking-by-grammar.html": "Speaking by Grammar - johnplusenglish",
  "speaking-questions.html": "Speaking Topics - johnplusenglish",
  "story-dice.html": "Story Dice - johnplusenglish",
  "taboo.html": "Taboo Cards - johnplusenglish",
  "uoe-b1.html": "B1 Preliminary - johnplusenglish",
  "uoe-b2.html": "B2 First - johnplusenglish",
  "uoe-c1.html": "C1 Advanced - johnplusenglish",
  "uoe-c2.html": "C2 Proficiency - johnplusenglish",
  "word-banks.html": "Word Banks - johnplusenglish",
  "word-formation.html": "Word Formation - johnplusenglish",
  "would-you-rather.html": "Would You Rather...? - johnplusenglish",
  "writing-skills.html": "Writing Skills - johnplusenglish"
};
function toggleSidebar(){
  var sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
  sidebar.classList.toggle('collapsed');
  document.getElementById('sidebarBackdrop').classList.toggle('open');
  try { localStorage.setItem('jpe-sidebar-collapsed', sidebar.classList.contains('collapsed') ? '1' : '0'); } catch(e) {}
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('open');
}
// Animate a collapsible (.cat-rows/.level-rows) to its exact content height so
// there is no dead space to crawl through - open/close stays tight regardless of
// how many items the menu holds. After opening we release to 'none' so nested
// menus can grow the parent without clipping.
// Animate a collapsible (.cat-rows/.level-rows) to its exact content height so
// there is no dead space to crawl through - open/close stays tight regardless of
// how many items the menu holds. The 'open' class carries the padding/border, so
// on OPEN we add it up front and on CLOSE we keep it until the collapse finishes
// (removing it early would drop the padding and jump the content).
function jpeRows(group, el, open){
  if (!group) return;
  if (el && el._jpeT){ clearTimeout(el._jpeT); el._jpeT = null; }
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}
  if (open){
    group.classList.add('open');
    if (!el) return;
    if (reduce){ el.style.maxHeight = 'none'; return; }
    // Measure the TRUE open height with transitions off - read live it comes back
    // ~5px short (the padding is still animating in), which would make the pill
    // below jump when we later release to 'none'. Snapping padding to final here
    // gives an exact target, so open lands clean and the release is seamless.
    var tr = el.style.transition;
    el.style.transition = 'none';
    el.style.maxHeight = 'none';
    var target = el.scrollHeight;
    el.style.maxHeight = '0px';
    void el.offsetHeight;
    el.style.transition = tr;
    void el.offsetHeight;
    el.style.maxHeight = target + 'px';
    // release to 'none' after the open finishes so nested menus can grow freely
    el._jpeT = setTimeout(function(){ el.style.maxHeight = 'none'; el._jpeT = null; }, 90);
  } else {
    if (!el){ group.classList.remove('open'); return; }
    if (reduce){ el.style.maxHeight = '0px'; group.classList.remove('open'); return; }
    // freeze the open height, then drive height AND padding to 0 together so the
    // container never floors on its padding (which would snap the row below it).
    el.style.maxHeight = el.scrollHeight + 'px';
    void el.offsetHeight;
    group.classList.remove('open');
    el.style.maxHeight = '0px';
  }
}
function toggleCatGroup(btn){
  var group = btn.closest('.cat-group');
  var willOpen = !group.classList.contains('open');
  group.parentElement.querySelectorAll(':scope > .cat-group.open').forEach(function(g){
    if (g !== group) jpeRows(g, g.querySelector(':scope > .cat-rows'), false);
  });
  jpeRows(group, group.querySelector(':scope > .cat-rows'), willOpen);
}
function toggleLevelGroup(btn){
  var group = btn.closest('.level-group');
  var willOpen = !group.classList.contains('open');
  group.parentElement.querySelectorAll(':scope > .level-group.open').forEach(function(g){
    if (g !== group) jpeRows(g, g.querySelector(':scope > .level-rows'), false);
  });
  // keep the enclosing category free to grow so the level grid isn't clipped
  var catRows = group.closest('.cat-rows');
  if (catRows){ if (catRows._jpeT){ clearTimeout(catRows._jpeT); catRows._jpeT = null; } catRows.style.maxHeight = 'none'; }
  jpeRows(group, group.querySelector(':scope > .level-rows'), willOpen);
}
function jpeContentSrc(href){
  if (href === 'index.html' || href === '') return 'home-content.html';
  var qi = href.indexOf('?');
  var base = qi === -1 ? href : href.slice(0, qi);
  var qs = qi === -1 ? '' : href.slice(qi);
  return base.replace(/\.html$/i, '-content.html') + qs;
}
function jpeEnsureFrame(){
  var frame = document.querySelector('.embed-frame');
  if (frame) return frame;
  var pane = document.querySelector('.content-pane');
  if (!pane) return null;
  var empty = document.getElementById('emptyPane');
  if (empty) empty.style.display = 'none';
  frame = document.createElement('iframe');
  frame.className = 'embed-frame';
  frame.style.cssText = 'width:100%;height:calc(100vh - 52px);border:none;display:block;background:var(--cream);opacity:0;transition:opacity .06s linear';
  pane.appendChild(frame);
  return frame;
}
function jpeActivate(href){
  var rows = document.querySelectorAll('.sidebar a.row');
  for (var i=0;i<rows.length;i++){ rows[i].classList.remove('active'); }
  var groups = document.querySelectorAll('.sidebar .cat-group');
  for (var j=0;j<groups.length;j++){
    groups[j].classList.remove('open');
    var cr = groups[j].querySelector(':scope > .cat-rows');
    if (cr){ if (cr._jpeT){ clearTimeout(cr._jpeT); cr._jpeT = null; } cr.style.maxHeight = ''; }
  }
  var levels = document.querySelectorAll('.sidebar .level-group');
  for (var k=0;k<levels.length;k++){
    levels[k].classList.remove('open');
    var lr = levels[k].querySelector(':scope > .level-rows');
    if (lr){ if (lr._jpeT){ clearTimeout(lr._jpeT); lr._jpeT = null; } lr.style.maxHeight = ''; }
  }
  var link = document.querySelector('.sidebar a.row[href="' + href + '"]');
  if (link) {
    link.classList.add('active');
    var group = link.closest('.cat-group');
    if (group){ group.classList.add('open'); var gr = group.querySelector(':scope > .cat-rows'); if (gr) gr.style.maxHeight = 'none'; }
    var lg = link.closest('.level-group');
    if (lg){ lg.classList.add('open'); var lgr = lg.querySelector(':scope > .level-rows'); if (lgr) lgr.style.maxHeight = 'none'; }
  }
}
function jpeNavigate(href, push){
  var frame = jpeEnsureFrame();
  if (!frame) { location.href = href; return; }
  frame.style.opacity = '0';
  frame.onload = function(){ frame.style.opacity = '1'; };
  frame.src = jpeContentSrc(href);
  jpeActivate(href);
  if (JPE_TITLES[href]) document.title = JPE_TITLES[href];
  if (push !== false) {
    try { history.pushState({jpeHref:href}, '', href); } catch(e){}
  }
}
document.addEventListener('click', function(e){
  var a = e.target.closest && e.target.closest('.sidebar a.row[href]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
  var href = a.getAttribute('href');
  if (!href || href.indexOf('#') !== -1 || href.indexOf('://') !== -1) return;
  e.preventDefault();
  var here = location.pathname.split('/').pop() || 'index.html';
  if (href === here) return;
  jpeNavigate(href, true);
});
window.addEventListener('popstate', function(){
  var here = location.pathname.split('/').pop() || 'index.html';
  jpeNavigate(here, false);
});
(function(){
  try {
    if (localStorage.getItem('jpe-sidebar-collapsed') === '1') {
      document.getElementById('sidebar').classList.add('collapsed');
    }
  } catch(e) {}
  document.getElementById('sidebar').classList.add('js-anim');
  var here = location.pathname.split('/').pop() || 'index.html';
  jpeActivate(here);
})();

// Swipe left to close the open mobile sidebar overlay. Deliberately does NOT
// swipe-open from the left edge - that zone is reserved by iOS Safari and
// Android Chrome for their own "swipe back" gesture, so a page-level listener
// there would fight the OS rather than reliably open the menu. Opening stays
// a real tap on the bottom-left button. No-op on desktop: .sidebar.open only
// has a visual effect below 900px.
(function(){
  var MIN_DX = 60, MAX_OFF_AXIS = 80, MAX_MS = 700;
  var startX = null, startY = null, startT = 0;
  document.addEventListener('touchstart', function(e){
    if (e.touches.length !== 1) { startX = null; return; }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startT = Date.now();
  }, {passive:true});
  document.addEventListener('touchend', function(e){
    if (startX === null) return;
    var touch = e.changedTouches[0];
    var dx = touch.clientX - startX;
    var dy = touch.clientY - startY;
    var dt = Date.now() - startT;
    startX = null;
    if (dt > MAX_MS || Math.abs(dy) > MAX_OFF_AXIS || Math.abs(dx) < MIN_DX) return;
    var sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    if (sidebar.classList.contains('open') && dx < 0) closeSidebar();
  }, {passive:true});
})();

// Let the mobile Menu button be dragged up/down to wherever's comfortable to
// reach one-handed; position is remembered. A tap (no real vertical move)
// still opens/closes the sidebar as normal via the button's own onclick.
(function(){
  var btn = document.querySelector('.sidebar-collapse-btn');
  if (!btn) return;
  var STORAGE_KEY = 'jpe-menu-btn-bottom';
  var dragging = false, moved = false, startY = 0, startBottom = 0;
  function isMobile(){ return window.innerWidth <= 900; }
  function clampBottom(v){
    var h = btn.offsetHeight || 52;
    var max = window.innerHeight - h - 12 - 52;
    return Math.max(12, Math.min(max, v));
  }
  try {
    var saved = parseFloat(localStorage.getItem(STORAGE_KEY));
    if (!isNaN(saved) && isMobile()) btn.style.bottom = clampBottom(saved) + 'px';
  } catch(e){}
  btn.addEventListener('pointerdown', function(e){
    if (!isMobile() || e.pointerType === 'mouse') return;
    dragging = true; moved = false;
    startY = e.clientY;
    startBottom = parseFloat(getComputedStyle(btn).bottom) || 16;
  });
  btn.addEventListener('pointermove', function(e){
    if (!dragging) return;
    var dy = e.clientY - startY;
    if (Math.abs(dy) > 8) {
      moved = true;
      btn.style.bottom = clampBottom(startBottom - dy) + 'px';
    }
  });
  function endDrag(){
    if (!dragging) return;
    dragging = false;
    if (moved) {
      try { localStorage.setItem(STORAGE_KEY, parseFloat(getComputedStyle(btn).bottom)); } catch(e){}
    }
  }
  btn.addEventListener('pointerup', endDrag);
  btn.addEventListener('pointercancel', endDrag);
  btn.addEventListener('click', function(e){
    if (moved) { e.preventDefault(); e.stopImmediatePropagation(); moved = false; }
  }, true);
})();

(function(){
  if (!window.fetch) return;
  var warmed = Object.create(null);
  function warm(url){
    if (!url || warmed[url]) return;
    warmed[url] = 1;
    fetch(url, {credentials:'same-origin'}).catch(function(){});
  }
  function onIntent(e){
    var a = e.target.closest && e.target.closest('a.row[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.indexOf('#') !== -1 || href.indexOf('://') !== -1) return;
    warm(jpeContentSrc(href));
  }
  document.addEventListener('mouseover', onIntent, {passive:true});
  document.addEventListener('touchstart', onIntent, {passive:true});
})();

/* ── Notes side panel (site-wide) ──
   Disabled 2026-08-25 at John's request ("remove but remember for future
   use") - the feature is fully intact below, just gated behind this early
   return. Delete the `return;` line to bring it back. */
(function(){
  return;
  document.body.insertAdjacentHTML('beforeend',
    '<button class="jpe-notes-toggle" id="jpeNotesToggleBtn" onclick="jpeToggleNotes()">Notes ✎</button>' +
    '<aside class="jpe-notes-panel" id="jpeNotesPanel">' +
      '<div class="jpe-np-header">' +
        '<div class="jpe-np-title">Notes</div>' +
        '<button class="jpe-np-close" onclick="jpeToggleNotes()">&times;</button>' +
      '</div>' +
      '<textarea class="jpe-np-box" id="jpeNotesBox" placeholder="..."></textarea>' +
      '<div class="jpe-np-footer">' +
        '<button class="jpe-np-btn" id="jpeNpCopyBtn" onclick="jpeCopyNotes()">Copy</button>' +
        '<button class="jpe-np-btn primary" onclick="jpeDownloadNotesPNG()">PNG</button>' +
        '<button class="jpe-np-btn danger" onclick="jpeClearNotes()">Clear</button>' +
      '</div>' +
    '</aside>'
  );

  var notesBox = document.getElementById('jpeNotesBox');
  try { notesBox.value = localStorage.getItem('jpe-notes-text') || ''; } catch(e){}

  function saveNotesBox(){ try { localStorage.setItem('jpe-notes-text', notesBox.value); } catch(e){} }

  notesBox.addEventListener('keydown', function(e){
    if (e.key === 'Enter'){
      e.preventDefault();
      var start = notesBox.selectionStart, end = notesBox.selectionEnd;
      notesBox.setRangeText('\n• ', start, end, 'end');
      saveNotesBox();
    }
  });
  notesBox.addEventListener('input', function(){
    if (notesBox.value.length === 1 && notesBox.value !== '•'){
      notesBox.value = '• ' + notesBox.value;
      notesBox.selectionStart = notesBox.selectionEnd = notesBox.value.length;
    }
    saveNotesBox();
  });

  function getNotesLines(){
    return notesBox.value.split('\n')
      .map(function(l){ return l.replace(/^[•\s]+/, '').trim(); })
      .filter(function(l){ return l.length; });
  }

  window.jpeToggleNotes = function(){
    document.getElementById('jpeNotesPanel').classList.toggle('open');
  };
  window.jpeClearNotes = function(){
    if (!notesBox.value.trim()) return;
    if (confirm('Clear all notes?')){ notesBox.value = ''; saveNotesBox(); }
  };
  window.jpeCopyNotes = function(){
    var lines = getNotesLines();
    if (!lines.length) return;
    var text = lines.map(function(v){ return '• ' + v; }).join('\n');
    function flash(msg){
      var btn = document.getElementById('jpeNpCopyBtn');
      var old = btn.textContent;
      btn.textContent = msg;
      setTimeout(function(){ btn.textContent = old; }, 1400);
    }
    function fallbackCopy(){
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); flash('Copied!'); }
      catch(e){ flash('Copy failed'); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ flash('Copied!'); }).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  };
  function wrapCanvasText(ctx, text, maxWidth){
    var words = text.split(' '), lines = [], current = '';
    words.forEach(function(w){
      var test = current ? current + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && current){ lines.push(current); current = w; }
      else current = test;
    });
    if (current) lines.push(current);
    return lines;
  }
  window.jpeDownloadNotesPNG = function(){
    var items = getNotesLines();
    if (!items.length){ alert('Add a few notes first.'); return; }
    document.fonts.ready.then(function(){
      var width = 600, padding = 32, fontSize = 17, lineH = 27, titleSize = 21;
      var measureCanvas = document.createElement('canvas');
      var mctx = measureCanvas.getContext('2d');
      mctx.font = fontSize + 'px Outfit, sans-serif';
      var maxTextW = width - padding * 2 - 22;
      var lines = [];
      items.forEach(function(item){
        wrapCanvasText(mctx, item, maxTextW).forEach(function(l, idx){ lines.push({text:l, first: idx === 0}); });
      });
      var height = padding * 2 + titleSize + 34 + lines.length * lineH + 14;
      var canvas = document.createElement('canvas');
      var scale = 2;
      canvas.width = width * scale; canvas.height = height * scale;
      var ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      ctx.fillStyle = '#F7F6F3'; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#E8E5DF'; ctx.lineWidth = 1; ctx.strokeRect(.5, .5, width - 1, height - 1);

      ctx.fillStyle = '#2D3047';
      ctx.font = '800 ' + titleSize + 'px Outfit, sans-serif';
      ctx.fillText('johnplusenglish Notes', padding, padding + titleSize - 4);

      ctx.strokeStyle = '#E8E5DF';
      ctx.beginPath(); ctx.moveTo(padding, padding + titleSize + 16); ctx.lineTo(width - padding, padding + titleSize + 16); ctx.stroke();

      var y = padding + titleSize + 16 + 32;
      ctx.font = fontSize + 'px Outfit, sans-serif';
      lines.forEach(function(l){
        if (l.first){ ctx.fillStyle = '#7A7D8E'; ctx.fillText('•', padding, y); }
        ctx.fillStyle = '#2D3047';
        ctx.fillText(l.text, padding + 20, y);
        y += lineH;
      });

      var link = document.createElement('a');
      link.download = 'notes.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };
})();

/* ── Annotation tool (hidden dev utility, John only) ──
   Cmd/Ctrl+Shift+A toggles it. While on, clicking anywhere on the page's
   actual content (inside the iframe) drops a numbered pin and prompts for
   an instruction. "Copy JSON" exports every pin across every page you've
   annotated, in one paste-ready block, for a Claude session to act on.
   Data lives only in localStorage (jpe-annotations) - never sent anywhere.
   Scope: content inside the iframe only, not the outer sidebar/topnav. */
(function(){
  var DATA_KEY = 'jpe-annotations';
  var MODE_KEY = 'jpe-annotate-mode';
  var VIS_KEY = 'jpe-annotate-visible';
  var anns = [];
  try { anns = JSON.parse(localStorage.getItem(DATA_KEY)) || []; } catch(e){ anns = []; }
  var nextN = 1;
  anns.forEach(function(a){ if (a.n >= nextN) nextN = a.n + 1; });

  var mode = false, toolbar = null, visible = false;

  // Show/hide the whole annotation toolbar. It stays hidden for normal visitors;
  // Cmd/Ctrl+Shift+A reveals it (John only). Hiding it also forces pin mode off so
  // no crosshair/pins can linger once the tool is put away.
  function setToolbarVisible(v){
    visible = v;
    try { sessionStorage.setItem(VIS_KEY, v ? '1' : '0'); } catch(e){}
    if (toolbar) toolbar.classList.toggle('jpe-ann-open', v);
    if (!v && mode){ mode = false; try { sessionStorage.setItem(MODE_KEY, '0'); } catch(e){} }
    updateCount();
    renderPins();
  }

  function save(){ try { localStorage.setItem(DATA_KEY, JSON.stringify(anns)); } catch(e){} }
  function currentPage(){ return location.pathname.split('/').pop() || 'index.html'; }

  function cssPath(el){
    if (!el || el.nodeType !== 1) return '';
    var parts = [], depth = 0;
    while (el && el.nodeType === 1 && depth < 6) {
      if (el.id) { parts.unshift('#' + el.id); break; }
      var sel = el.tagName.toLowerCase();
      var parent = el.parentElement;
      if (parent) {
        var same = Array.prototype.filter.call(parent.children, function(c){ return c.tagName === el.tagName; });
        if (same.length > 1) sel += ':nth-child(' + (Array.prototype.indexOf.call(parent.children, el) + 1) + ')';
      }
      parts.unshift(sel);
      el = parent;
      depth++;
    }
    return parts.join(' > ');
  }

  function contextText(el){
    var t = (el && el.textContent || '').trim().replace(/\s+/g, ' ');
    return t.slice(0, 90);
  }

  function ensureToolbar(){
    if (toolbar) return toolbar;
    toolbar = document.createElement('div');
    toolbar.id = 'jpeAnnToolbar';
    toolbar.innerHTML =
      '<div class="jpe-ann-title">Annotate <span id="jpeAnnCount"></span></div>' +
      '<div class="jpe-ann-row">' +
        '<button id="jpeAnnPinToggle">Pin: Off</button>' +
        '<button id="jpeAnnUndo">Undo</button>' +
        '<button id="jpeAnnClear">Clear all</button>' +
        '<button id="jpeAnnCopy">Copy JSON</button>' +
      '</div>';
    document.body.appendChild(toolbar);
    document.getElementById('jpeAnnPinToggle').onclick = annToggle;
    document.getElementById('jpeAnnUndo').onclick = annUndo;
    document.getElementById('jpeAnnClear').onclick = annClearAll;
    document.getElementById('jpeAnnCopy').onclick = annCopyJSON;
    return toolbar;
  }

  function updateCount(){
    var el = document.getElementById('jpeAnnCount');
    if (el) el.textContent = '(' + anns.length + ' total)';
    var pinBtn = document.getElementById('jpeAnnPinToggle');
    if (pinBtn) {
      pinBtn.textContent = mode ? 'Pin: On' : 'Pin: Off';
      pinBtn.classList.toggle('jpe-ann-pin-on', mode);
    }
  }

  function pinStyleTag(doc){
    if (doc.getElementById('jpeAnnPinStyle')) return;
    var s = doc.createElement('style');
    s.id = 'jpeAnnPinStyle';
    s.textContent =
      '.jpe-ann-pin{position:absolute;width:26px;height:26px;border-radius:50%;background:#FF6B6B;color:#fff;font:700 13px Outfit,sans-serif;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.35);z-index:99999;transform:translate(-50%,-50%);border:2px solid #fff}' +
      '.jpe-ann-pin:hover{background:#e14f4f}';
    (doc.head || doc.documentElement).appendChild(s);
  }

  function clearPins(doc){
    if (!doc) return;
    var old = doc.querySelectorAll('.jpe-ann-pin');
    Array.prototype.forEach.call(old, function(p){ p.remove(); });
  }

  function renderPins(){
    var frame = jpeEnsureFrame();
    if (!frame || !frame.contentDocument) return;
    var doc = frame.contentDocument;
    clearPins(doc);
    if (doc.body) doc.body.style.cursor = mode ? 'crosshair' : '';
    if (!mode) return;
    pinStyleTag(doc);
    var page = currentPage();
    anns.filter(function(a){ return a.page === page; }).forEach(function(a){
      var target = null;
      try { target = doc.querySelector(a.selector); } catch(e){}
      var x, y;
      if (target) {
        var r = target.getBoundingClientRect();
        x = r.left + r.width * (a.xPct != null ? a.xPct : 0.5) + doc.defaultView.scrollX;
        y = r.top + r.height * (a.yPct != null ? a.yPct : 0.5) + doc.defaultView.scrollY;
      } else {
        x = a.absX || 40; y = a.absY || 40;
      }
      var pin = doc.createElement('div');
      pin.className = 'jpe-ann-pin';
      pin.textContent = a.n;
      pin.style.left = x + 'px';
      pin.style.top = y + 'px';
      pin.title = a.text;
      pin.addEventListener('click', function(ev){
        ev.preventDefault(); ev.stopPropagation();
        annEditOrDelete(a.n);
      });
      doc.body.appendChild(pin);
    });
  }

  function annAdd(x, y, doc){
    var el = doc.elementFromPoint(x, y);
    var text = window.prompt('Instruction for this spot:');
    if (!text) return;
    var selector = cssPath(el);
    var rect = el ? el.getBoundingClientRect() : {left:x, top:y, width:1, height:1};
    anns.push({
      n: nextN++,
      page: currentPage(),
      text: text,
      selector: selector,
      context: contextText(el),
      xPct: rect.width ? (x - rect.left) / rect.width : 0.5,
      yPct: rect.height ? (y - rect.top) / rect.height : 0.5,
      absX: x + doc.defaultView.scrollX,
      absY: y + doc.defaultView.scrollY,
      url: location.href
    });
    save();
    updateCount();
    renderPins();
  }

  function annEditOrDelete(n){
    var a = anns.filter(function(x){ return x.n === n; })[0];
    if (!a) return;
    var next = window.prompt('Edit instruction (clear the text + OK to delete this pin):', a.text);
    if (next === null) return;
    if (next.trim() === '') {
      anns = anns.filter(function(x){ return x.n !== n; });
    } else {
      a.text = next;
    }
    save();
    updateCount();
    renderPins();
  }

  function annUndo(){
    anns.pop();
    save();
    updateCount();
    renderPins();
  }

  function annClearAll(){
    if (!window.confirm('Clear ALL annotations across every page? This cannot be undone.')) return;
    anns = [];
    nextN = 1;
    save();
    updateCount();
    renderPins();
  }

  function annCopyJSON(){
    var payload = JSON.stringify({exportedAt: new Date().toISOString(), site: location.host, annotations: anns}, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(function(){
        alert('Copied ' + anns.length + ' annotation(s) to clipboard.');
      }, function(){
        window.prompt('Copy this JSON:', payload);
      });
    } else {
      window.prompt('Copy this JSON:', payload);
    }
  }

  function frameClickHandler(e){
    if (!mode) return;
    if (e.target.closest && e.target.closest('.jpe-ann-pin')) return;
    e.preventDefault();
    e.stopPropagation();
    annAdd(e.clientX, e.clientY, e.target.ownerDocument);
  }

  function attachFrameListeners(){
    var frame = jpeEnsureFrame();
    if (!frame || !frame.contentDocument) return;
    var doc = frame.contentDocument;
    if (!doc._jpeAnnBound) {
      doc._jpeAnnBound = true;
      doc.addEventListener('click', frameClickHandler, true);
      doc.addEventListener('keydown', keyHandler);
    }
    renderPins();
  }

  function keyHandler(e){
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      setToolbarVisible(!visible);
    }
  }

  function annToggle(){
    mode = !mode;
    try { sessionStorage.setItem(MODE_KEY, mode ? '1' : '0'); } catch(e){}
    updateCount();
    renderPins();
  }

  document.addEventListener('keydown', keyHandler);
  var frameEl = jpeEnsureFrame();
  if (frameEl) frameEl.addEventListener('load', attachFrameListeners);

  ensureToolbar();
  try {
    if (sessionStorage.getItem(VIS_KEY) === '1') visible = true;
    if (visible && sessionStorage.getItem(MODE_KEY) === '1') mode = true;
  } catch(e){}
  if (toolbar) toolbar.classList.toggle('jpe-ann-open', visible);
  updateCount();

  attachFrameListeners();
})();
