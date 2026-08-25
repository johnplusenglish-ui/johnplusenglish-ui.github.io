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
// there is no dead space to crawl through — open/close stays tight regardless of
// how many items the menu holds. After opening we release to 'none' so nested
// menus can grow the parent without clipping.
function jpeRows(el, open){
  if (!el) return;
  if (el._jpeT){ clearTimeout(el._jpeT); el._jpeT = null; }
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}
  if (open){
    if (reduce){ el.style.maxHeight = 'none'; return; }
    el.style.maxHeight = el.scrollHeight + 'px';
    el._jpeT = setTimeout(function(){ el.style.maxHeight = 'none'; el._jpeT = null; }, 200);
  } else {
    if (reduce){ el.style.maxHeight = '0px'; return; }
    el.style.maxHeight = el.scrollHeight + 'px';
    void el.offsetHeight;
    el.style.maxHeight = '0px';
  }
}
function toggleCatGroup(btn){
  var group = btn.closest('.cat-group');
  var willOpen = !group.classList.contains('open');
  group.parentElement.querySelectorAll(':scope > .cat-group.open').forEach(function(g){
    if (g !== group){ g.classList.remove('open'); jpeRows(g.querySelector(':scope > .cat-rows'), false); }
  });
  group.classList.toggle('open', willOpen);
  jpeRows(group.querySelector(':scope > .cat-rows'), willOpen);
}
function toggleLevelGroup(btn){
  var group = btn.closest('.level-group');
  var willOpen = !group.classList.contains('open');
  group.parentElement.querySelectorAll(':scope > .level-group.open').forEach(function(g){
    if (g !== group){ g.classList.remove('open'); jpeRows(g.querySelector(':scope > .level-rows'), false); }
  });
  group.classList.toggle('open', willOpen);
  // keep the enclosing category free to grow so the level grid isn't clipped
  var catRows = group.closest('.cat-rows');
  if (catRows){ if (catRows._jpeT){ clearTimeout(catRows._jpeT); catRows._jpeT = null; } catRows.style.maxHeight = 'none'; }
  jpeRows(group.querySelector(':scope > .level-rows'), willOpen);
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
  closeSidebar();
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

/* ── Notes side panel (site-wide) ── */
(function(){
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
