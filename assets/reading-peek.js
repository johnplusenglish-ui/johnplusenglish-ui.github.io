/* Reading tests: "peek at the passage" overlay (shared, single source).
   For each .part-section that contains a .passage, every question row inside
   it (anything carrying data-qi or data-n — covers MCQ/matching/T-F-NG rows
   across all the reading pages) gets a hover/focus/tap hook that surfaces that
   part's passage text in a floating panel. Layout itself is untouched — this
   only adds an overlay, it never rearranges the page. */
(function(){
  var panel=null, labelEl=null, bodyEl=null, hideTimer=null, current=null;

  function ensurePanel(){
    if(panel) return;
    panel=document.createElement('div');
    panel.className='rt-peek';
    panel.innerHTML='<div class="rt-peek-label"><span>Passage</span><button type="button" class="rt-peek-close" aria-label="Close">Close</button></div><div class="rt-peek-body"></div>';
    document.body.appendChild(panel);
    labelEl=panel.querySelector('.rt-peek-label span');
    bodyEl=panel.querySelector('.rt-peek-body');
    panel.addEventListener('mouseenter', function(){ clearTimeout(hideTimer); });
    panel.addEventListener('mouseleave', scheduleHide);
    panel.querySelector('.rt-peek-close').addEventListener('click', hideNow);
  }

  function show(passageEl){
    ensurePanel();
    clearTimeout(hideTimer);
    if(current!==passageEl){
      bodyEl.innerHTML=passageEl.innerHTML;
      current=passageEl;
      var title=passageEl.querySelector('.passage-title');
      labelEl.textContent=title? title.textContent : 'Passage';
    }
    panel.classList.add('show');
  }
  function scheduleHide(){
    clearTimeout(hideTimer);
    hideTimer=setTimeout(hideNow, 250);
  }
  function hideNow(){
    if(panel) panel.classList.remove('show');
    current=null;
  }

  function setup(){
    var sections=document.querySelectorAll('.part-section');
    for(var i=0;i<sections.length;i++){
      var section=sections[i];
      if(section.dataset.rtPeekReady) continue;
      var passageEl=section.querySelector('.passage');
      if(!passageEl) continue; // parts with no single passage (e.g. gapped text) get no peek
      section.dataset.rtPeekReady='1';
      wireSection(section, passageEl);
    }
  }

  function wireSection(section, passageEl){
    // Re-check for question rows on demand, since some pages rebuild their
    // questions HTML when the reader switches Test 1-5 or changes part —
    // delegate from the section itself rather than binding to nodes that may
    // get replaced.
    function rowFrom(target){
      var row=target.closest('[data-qi],[data-n]');
      if(!row || !section.contains(row)) return null;
      // Guard against the SPECIFIC passage element, not the class name — the
      // questions wrapper reuses the same ".passage" class for its styling on
      // these pages, so a class-based check would wrongly exclude every row.
      if(passageEl.contains(row)) return null;
      return row;
    }
    section.addEventListener('mouseover', function(e){
      var row=rowFrom(e.target);
      if(row) show(passageEl);
    });
    section.addEventListener('mouseout', function(e){
      var row=rowFrom(e.target);
      if(row) scheduleHide();
    });
    section.addEventListener('focusin', function(e){
      var row=rowFrom(e.target);
      if(row) show(passageEl);
    });
    section.addEventListener('focusout', function(e){
      var row=rowFrom(e.target);
      if(row) scheduleHide();
    });
    section.addEventListener('click', function(e){
      var row=rowFrom(e.target);
      if(row) show(passageEl); // tap-to-peek parity on touch devices
    });
  }

  document.addEventListener('click', function(e){
    if(!panel || !panel.classList.contains('show')) return;
    if(panel.contains(e.target)) return;
    if(e.target.closest('[data-qi],[data-n]')) return; // handled above
    hideNow();
  });

  if(document.readyState!=='loading') setup(); else document.addEventListener('DOMContentLoaded', setup);
  // Some pages build their question rows after an async/test-switch action;
  // a light periodic re-scan picks up newly rendered .part-section content
  // without needing every page's render function to call back into us.
  setInterval(setup, 1200);
})();
