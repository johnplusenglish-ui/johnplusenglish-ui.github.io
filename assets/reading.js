/* Reading-test split view: collapse control + draggable resizer (shared, single
   source). Adds a "Hide/Show questions" pill into the EXISTING .test-header row
   (matching the page's own pill controls), and a draggable divider between the
   passage and questions so a reader can size the columns themselves — the split
   remembers the last size across pages via localStorage. */
(function(){
  var STORE_KEY='jpe-rt-split-frac';
  function findHeader(split){
    // Cambridge: <div class="test-card"><div class="test-header">…</div><div class="rt-split">…
    if(split.previousElementSibling && split.previousElementSibling.classList.contains('test-header')){
      return split.previousElementSibling;
    }
    // IELTS: <div class="rt-split"><div class="test-card"><div class="test-header">…</div>…
    var first=split.children[0];
    if(first){
      var h=first.querySelector(':scope > .test-header');
      if(h) return h;
    }
    return null;
  }
  function savedFraction(){
    var v=null;
    try{ v=parseFloat(localStorage.getItem(STORE_KEY)); }catch(e){}
    return (isFinite(v) && v>0.2 && v<0.8) ? v : 0.55;
  }
  function applyFraction(split,frac){
    frac=Math.max(0.22,Math.min(0.78,frac));
    split.style.gridTemplateColumns='minmax(160px,'+(frac*100)+'%) 14px minmax(160px,1fr)';
    return frac;
  }
  function wireResize(split){
    if(split.dataset.rtResizeReady) return;
    split.dataset.rtResizeReady='1';
    var resizer=split.querySelector(':scope > .rt-resizer');
    if(!resizer) return;
    applyFraction(split, savedFraction());
    var dragging=false, startX=0, startFrac=0.55, total=0;
    function pointerDown(e){
      if(split.classList.contains('rt-collapsed')) return;
      dragging=true;
      startX=e.clientX;
      var rect=split.getBoundingClientRect();
      total=rect.width;
      startFrac=(split.children[0].getBoundingClientRect().width)/total;
      resizer.classList.add('rt-dragging');
      try{ resizer.setPointerCapture(e.pointerId); }catch(err){}
      document.body.style.cursor='col-resize';
      document.body.style.userSelect='none';
      e.preventDefault();
    }
    function pointerMove(e){
      if(!dragging) return;
      var dx=e.clientX-startX;
      applyFraction(split, startFrac + dx/total);
    }
    function pointerUp(){
      if(!dragging) return;
      dragging=false;
      resizer.classList.remove('rt-dragging');
      document.body.style.cursor='';
      document.body.style.userSelect='';
      var frac=(split.children[0].getBoundingClientRect().width)/split.getBoundingClientRect().width;
      try{ localStorage.setItem(STORE_KEY, String(frac)); }catch(e){}
    }
    resizer.addEventListener('pointerdown', pointerDown);
    resizer.addEventListener('pointermove', pointerMove);
    resizer.addEventListener('pointerup', pointerUp);
    resizer.addEventListener('pointercancel', pointerUp);
    // keyboard: left/right arrows nudge the split when the handle has focus
    resizer.tabIndex=0;
    resizer.setAttribute('role','separator');
    resizer.setAttribute('aria-orientation','vertical');
    resizer.setAttribute('aria-label','Resize passage and questions columns');
    resizer.addEventListener('keydown', function(e){
      if(e.key!=='ArrowLeft' && e.key!=='ArrowRight') return;
      var cur=(split.children[0].getBoundingClientRect().width)/split.getBoundingClientRect().width;
      var next=applyFraction(split, cur + (e.key==='ArrowLeft'?-0.04:0.04));
      try{ localStorage.setItem(STORE_KEY, String(next)); }catch(err){}
      e.preventDefault();
    });
  }
  function setup(){
    var splits=document.querySelectorAll('.rt-split');
    for(var i=0;i<splits.length;i++){
      var split=splits[i];
      if(split.dataset.rtReady) continue;
      var kids=[];
      for(var j=0;j<split.children.length;j++) kids.push(split.children[j]);
      if(kids.length<2) continue;
      var questions=kids[kids.length-1];
      questions.classList.add('rt-q');

      // draggable divider, inserted right before the questions column
      var resizer=document.createElement('div');
      resizer.className='rt-resizer';
      split.insertBefore(resizer, questions);

      // Hide/show-questions toggle, injected into the existing header pill row
      var header=findHeader(split);
      if(header){
        var btn=document.createElement('button');
        btn.type='button'; btn.className='rt-toggle';
        (function(sp,b){
          function render(){
            var c=sp.classList.contains('rt-collapsed');
            b.textContent=c?'Show questions':'Hide questions';
            b.setAttribute('aria-expanded', String(!c));
          }
          b.addEventListener('click',function(){ sp.classList.toggle('rt-collapsed'); render(); });
          render();
        })(split,btn);
        header.appendChild(btn);
      }

      wireResize(split);
      split.dataset.rtReady='1';
    }
  }
  if(document.readyState!=='loading') setup(); else document.addEventListener('DOMContentLoaded', setup);
})();
