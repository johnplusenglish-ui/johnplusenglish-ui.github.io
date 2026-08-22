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
function toggleCatGroup(btn){
  btn.closest('.cat-group').classList.toggle('open');
}
function toggleLevelGroup(btn){
  btn.closest('.level-group').classList.toggle('open');
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
  frame.style.cssText = 'width:100%;height:calc(100vh - 52px);border:none;display:block;background:var(--cream);opacity:0;transition:opacity .18s ease';
  pane.appendChild(frame);
  return frame;
}
function jpeActivate(href){
  var rows = document.querySelectorAll('.sidebar a.row');
  for (var i=0;i<rows.length;i++){ rows[i].classList.remove('active'); }
  var groups = document.querySelectorAll('.sidebar .cat-group');
  for (var j=0;j<groups.length;j++){ groups[j].classList.remove('open'); }
  var link = document.querySelector('.sidebar a.row[href="' + href + '"]');
  if (link) {
    link.classList.add('active');
    var group = link.closest('.cat-group');
    if (group) group.classList.add('open');
  }
}
function jpeNavigate(href, push){
  var frame = jpeEnsureFrame();
  if (!frame) { location.href = href; return; }
  frame.style.opacity = '0';
  setTimeout(function(){
    frame.onload = function(){ frame.style.opacity = '1'; };
    frame.src = jpeContentSrc(href);
  }, 20);
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
