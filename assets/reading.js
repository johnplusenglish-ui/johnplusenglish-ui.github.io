/* Reading-test split view: collapse control (shared, single source).
   Adds a small "Hide/Show questions" toggle above each .rt-split so a reader can
   collapse the questions and read the passage full width, then bring them back.
   Only meaningful on wide screens (the toolbar is hidden via CSS below 760px). */
(function(){
  var CHEV_L='<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>';
  var CHEV_R='<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>';
  function setup(){
    var splits=document.querySelectorAll('.rt-split');
    for(var i=0;i<splits.length;i++){
      var split=splits[i];
      if(split.dataset.rtReady) continue;
      var kids=[];
      for(var j=0;j<split.children.length;j++) kids.push(split.children[j]);
      if(kids.length<2) continue;
      kids[kids.length-1].classList.add('rt-q'); // last child is the questions column
      var bar=document.createElement('div'); bar.className='rt-bar';
      var btn=document.createElement('button'); btn.type='button'; btn.className='rt-toggle';
      (function(sp,b){
        function render(){
          var c=sp.classList.contains('rt-collapsed');
          b.innerHTML=(c?CHEV_R:CHEV_L)+(c?' Show questions':' Hide questions');
          b.setAttribute('aria-expanded', String(!c));
        }
        b.addEventListener('click',function(){ sp.classList.toggle('rt-collapsed'); render(); });
        render();
      })(split,btn);
      bar.appendChild(btn);
      split.parentNode.insertBefore(bar, split);
      split.dataset.rtReady='1';
    }
  }
  if(document.readyState!=='loading') setup(); else document.addEventListener('DOMContentLoaded', setup);
})();
