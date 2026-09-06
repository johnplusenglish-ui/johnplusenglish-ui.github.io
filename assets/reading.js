/* Reading-test split view: collapse control (shared, single source).
   Adds a "Hide/Show questions" pill into the EXISTING .test-header row (next to
   the part title), matching the page's own pill controls, so a reader can
   collapse the questions and read the passage at a comfortable width, then
   bring them back. Only meaningful on wide screens (split view >=760px). */
(function(){
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
  function setup(){
    var splits=document.querySelectorAll('.rt-split');
    for(var i=0;i<splits.length;i++){
      var split=splits[i];
      if(split.dataset.rtReady) continue;
      var kids=[];
      for(var j=0;j<split.children.length;j++) kids.push(split.children[j]);
      if(kids.length<2) continue;
      kids[kids.length-1].classList.add('rt-q'); // last child is the questions column
      var header=findHeader(split);
      if(!header) continue; // no safe place to put the control — skip rather than float a stray bar
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
      split.dataset.rtReady='1';
    }
  }
  if(document.readyState!=='loading') setup(); else document.addEventListener('DOMContentLoaded', setup);
})();
