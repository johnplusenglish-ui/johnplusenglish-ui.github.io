/* Word Rooms: the shared navigation for every place (2026-11-21).
   1. The row of place links becomes one Places button that opens a directory of
      photo cards. The links stay in the page, so without this script nothing is lost.
   2. Each view tab gets a small picture of its view, so the strip reads as a filmstrip.
   Thumbnails live in images/<place>/thumbs/ (360px wide, about 10 KB each). */
(function(){
  var PLACES=[
    ['rome-flat','Rome Flat','the-entrance-hall',7,303],
    ['office','The Office','the-office',3,144],
    ['gym','The Gym','the-cardio-floor',4,84],
    ['shop','The Shop','the-shelves',5,140],
    ['high-street','The High Street','the-hair-salon',8,190],
    ['school','The School','the-classroom',5,200],
    ['house','The House','the-front-garden',11,352],
    ['hospital','The Hospital','the-entrance',9,269],
    ['airport','The Airport','the-drop-off',9,202],
    ['hotel','The Hotel','the-entrance',8,218],
    ['restaurant','The Restaurant','outside',6,183],
    ['car','The Car','the-driveway',8,194]
  ];
  document.documentElement.classList.add('wr-js');
  function cover(p){return 'images/'+p[0]+'/thumbs/'+p[2]+'.webp';}
  function thumbOf(src){return String(src||'').replace(/\/([^\/]+\.webp)$/,'/thumbs/$1');}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function here(){var m=location.pathname.match(/([a-z-]+)\.html$/);return m?m[1]:'';}

  function places(){
    var nav=document.querySelector('nav.places'), h1=nav&&nav.parentNode.querySelector('h1');
    if(!nav||!h1)return;
    var cur=here(), others=PLACES.filter(function(p){return p[0]!==cur;});

    var row=document.createElement('div'); row.className='wr-title';
    h1.parentNode.insertBefore(row,h1); row.appendChild(h1);
    var btn=document.createElement('button');
    btn.type='button'; btn.className='placesbtn';
    btn.setAttribute('aria-haspopup','dialog'); btn.setAttribute('aria-expanded','false');
    btn.innerHTML='<span class="fan" aria-hidden="true">'+[others[0],others[4],others[7]].map(function(p){
        return '<img src="'+cover(p)+'" alt="" width="32" height="22" decoding="async">';}).join('')+'</span>'
      +'<span>Places</span><span class="ct">'+PLACES.length+'</span>'
      +'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    row.appendChild(btn);

    var dir=document.createElement('div');
    dir.className='wr-dir'; dir.hidden=true;
    dir.setAttribute('role','dialog'); dir.setAttribute('aria-modal','true'); dir.setAttribute('aria-labelledby','wrdirh');
    dir.innerHTML='<div class="veil"></div><div class="card">'
      +'<div class="head"><h2 id="wrdirh">Word Rooms</h2><p>'+PLACES.length+' places</p>'
      +'<button type="button" class="x" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'
      +'<div class="wr-grid">'+PLACES.map(function(p){
        var on=p[0]===cur;
        return '<a class="wr-pc" href="'+p[0]+'.html"'+(on?' aria-current="page"':'')+'>'
          +'<span class="ph"><img src="'+cover(p)+'" alt="" loading="lazy" decoding="async" width="360" height="240">'
          +(on?'<span class="here">You are here</span>':'')+'</span>'
          +'<span class="nm">'+esc(p[1])+'</span><span class="mt">'+p[3]+(p[3]===1?' view, ':' views, ')+p[4]+' words</span></a>';
      }).join('')+'</div></div>';
    document.body.appendChild(dir);

    function open(){
      dir.hidden=false; btn.setAttribute('aria-expanded','true');
      document.documentElement.style.overflow='hidden';
      var c=dir.querySelector('.wr-pc[aria-current]')||dir.querySelector('.wr-pc'); c&&c.focus();
    }
    function close(){
      dir.hidden=true; btn.setAttribute('aria-expanded','false');
      document.documentElement.style.overflow='';
      btn.focus();
    }
    btn.addEventListener('click',open);
    dir.querySelector('.veil').addEventListener('click',close);
    dir.querySelector('.x').addEventListener('click',close);
    dir.addEventListener('click',function(e){var a=e.target.closest('.wr-pc[aria-current]'); if(a){e.preventDefault(); close();}});
    dir.addEventListener('keydown',function(e){
      if(e.key==='Escape'){e.preventDefault(); e.stopPropagation(); close(); return;}
      if(e.key!=='Tab')return;
      var f=dir.querySelectorAll('button,a[href]'), a=f[0], z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault(); z.focus();}
      else if(!e.shiftKey&&document.activeElement===z){e.preventDefault(); a.focus();}
    });
  }

  function filmstrip(){
    var strip=document.getElementById('roomstrip');
    if(!strip||!window.ROOMS)return;
    function decorate(){
      strip.querySelectorAll('.rm').forEach(function(b){
        if(b.querySelector('.rt'))return;
        var r=window.ROOMS[+b.getAttribute('data-i')]; if(!r||!r.img)return;
        var cap=document.createElement('span'); cap.className='rc';
        var t=document.createElement('span'); t.className='t';
        while(b.firstChild){ var n=b.firstChild; if(n.nodeType===1&&n.classList.contains('n')){cap.appendChild(t); cap.appendChild(n);} else t.appendChild(n); }
        if(!t.parentNode)cap.appendChild(t);
        /* "The kitchen" reads as "Kitchen" under its picture: the picture already says which */
        t.textContent=t.textContent.replace(/^The\s+/,'').replace(/^./,function(c){return c.toUpperCase();});
        b.setAttribute('aria-label',(r.title||t.textContent));
        var im=document.createElement('img');
        im.className='rt'; im.alt=''; im.width=180; im.height=120; im.decoding='async'; im.src=thumbOf(r.img);
        b.appendChild(im); b.appendChild(cap);
      });
      var c=strip.querySelector('.rm[aria-current="true"]');
      if(c&&strip.scrollWidth>strip.clientWidth+2){
        var x=c.offsetLeft-strip.offsetLeft-(strip.clientWidth-c.offsetWidth)/2;
        strip.scrollTo({left:Math.max(0,x),behavior:'smooth'});
      }
    }
    decorate();
    new MutationObserver(decorate).observe(strip,{childList:true});
  }

  function go(){places(); filmstrip();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go); else go();
})();
