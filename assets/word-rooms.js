/* Word Rooms: the shared navigation for every place (2026-11-21).
   1. The row of place links becomes one Places button that opens a directory of
      photo cards. The links stay in the page, so without this script nothing is lost.
   2. Each view tab gets a small picture of its view, so the strip reads as a filmstrip.
   Thumbnails live in images/<place>/thumbs/ (360px wide, about 10 KB each). */
(function(){
  var PLACES=[
    ['rome-flat','Rome Flat','the-entrance-hall',7,268],
    ['office','The Office','the-office',3,119],
    ['gym','The Gym','the-cardio-floor',4,68],
    ['shop','The Shop','the-shelves',5,131],
    ['high-street','The High Street','the-hair-salon',8,164],
    ['school','The School','the-classroom',5,160],
    ['house','The House','the-front-garden',11,333],
    ['hospital','The Hospital','the-entrance',9,192],
    ['airport','The Airport','the-drop-off',9,154],
    ['hotel','The Hotel','the-entrance',8,216],
    ['restaurant','The Restaurant','outside',6,183],
    ['car','The Car','the-driveway',8,192]
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

  /* 3. How it works: a guided tour that lights up each control in turn and says what it
     does in plain words. A first-time visitor is offered it once; the button is always there. */
  function guide(){
    var row=document.querySelector('.wr-title'); if(!row||!document.getElementById('stage'))return;
    var KEY='wr_guide_seen';
    var btn=document.createElement('button');
    btn.type='button'; btn.className='guidebtn';
    btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2.9-1.2 1.8v.4"/><circle class="d" cx="12" cy="16.9" r=".6"/></svg><span>How it works</span>';
    row.appendChild(btn);

    var nViews=(window.ROOMS||[]).length;
    function $(s){return document.querySelector(s);}
    function shown(el){return el&&el.offsetParent!==null&&el.getBoundingClientRect().width>0;}
    function openOne(){
      if(document.querySelector('.stage .pill .hear'))return;
      var s=document.querySelector('.stage .spot:not(.open)')||document.querySelector('.stage .spot');
      if(s)s.click();
    }
    var STEPS=[
      {el:function(){return $('#stage');}, t:'The picture',
       d:'Every blue dot is a word. Tap a dot to see what that thing is called in English. Try one now.'},
      {el:function(){openOne(); var h=document.querySelector('.stage .pill .hear'); return h&&h.closest('.pill');}, t:'Hear it',
       d:'Each label has a speaker button. Tap it to hear the word said by a British speaker. Try it now.'},
      {el:function(){return $('#count');}, t:'Your progress',
       d:'This counts how many of the words in this picture you have opened so far.'},
      {el:function(){return $('#roomstrip');}, t:'The pictures',
       d:'This place has '+nViews+' pictures. Tap one to go there. The dark one is the picture you are looking at.'},
      {el:function(){return [$('#prev'),$('#next')];}, t:'Back and next',
       d:'Step through the pictures in order. The left and right arrow keys on your keyboard do the same.'},
      {el:function(){return $('#planbtn');}, t:'Floor plan',
       d:'See how all the pictures fit together, with an arrow showing which way each one looks. Tap a part to jump there.'},
      {el:function(){return $('#presentbtn');}, t:'Present',
       d:'A big, clean layout for teaching on a screen or a projector. Press it again to come back.'},
      {el:function(){return $('.bar .seg');}, t:'Explore or Find it',
       d:'Explore is for looking around. Find it is a game: it gives you a word, and you find that thing in the picture.'},
      {el:function(){return $('#words');}, t:'Words',
       d:'Choose which words to practise. Find it only asks those words, and you can copy a link to share the same set with a class.'},
      {el:function(){return $('#phon');}, t:'Phonetics',
       d:'Show the phonetic spelling (IPA) under every label, so you can see how each word is said.'},
      {el:function(){return $('#png');}, t:'Save PNG',
       d:'Download this picture as an image with the words on it, ready for a worksheet or a slide.'},
      {el:function(){return [$('#dots'),$('#none')];}, t:'Dots, Show all, Hide all',
       d:'Dots hides or shows the blue dots. Show all opens every label at once. Hide all closes them, so you can test yourself before you tap.'},
      {el:function(){return $('.placesbtn');}, t:'More places',
       d:'Open the list of every Word Rooms place: a flat in Rome, a school, a hospital, an airport, a car and more.'}
    ];

    var tour=null, i=0, list=[];
    function rectOf(els){
      els=[].concat(els).filter(shown); if(!els.length)return null;
      var r=els.map(function(e){return e.getBoundingClientRect();});
      var l=Math.min.apply(0,r.map(function(x){return x.left;})), t=Math.min.apply(0,r.map(function(x){return x.top;}));
      var rr=Math.max.apply(0,r.map(function(x){return x.right;})), b=Math.max.apply(0,r.map(function(x){return x.bottom;}));
      return {left:l,top:t,width:rr-l,height:b-t};
    }
    function place(){
      if(!tour)return;
      var s=list[i], r=rectOf(s.el()); if(!r)return;
      var pad=8, vw=window.innerWidth, vh=window.innerHeight;
      var hole=tour.querySelector('.hole'), card=tour.querySelector('.tip');
      var hl=Math.max(4,r.left-pad), ht=Math.max(4,r.top-pad);
      var hw=Math.min(vw-8,r.width+pad*2), hh=Math.min(vh-8,r.height+pad*2);
      hole.style.transform='translate('+hl+'px,'+ht+'px)'; hole.style.width=hw+'px'; hole.style.height=hh+'px';
      /* everything outside the lit box is blocked; inside it the page still works, so the reader can try it */
      var bl=tour.querySelector('.block'), x2=hl+hw, y2=ht+hh;
      bl.style.clipPath='polygon(0 0,100% 0,100% 100%,0 100%,0 0,'+hl+'px '+ht+'px,'+hl+'px '+y2+'px,'+x2+'px '+y2+'px,'+x2+'px '+ht+'px,'+hl+'px '+ht+'px)';
      if(vw<=700){ card.style.left=''; card.style.top=''; card.classList.add('dock');
        card.classList.toggle('dock-top', ht+hh/2>vh*0.55); return; }
      card.classList.remove('dock','dock-top');
      var cw=card.offsetWidth, ch=card.offsetHeight, gap=14;
      var top=ht+hh+gap; if(top+ch>vh-12)top=ht-ch-gap; if(top<12)top=Math.min(vh-ch-12,Math.max(12,ht+hh/2-ch/2));
      var left=Math.min(vw-cw-12,Math.max(12,hl+hw/2-cw/2));
      if(top<ht+hh&&top+ch>ht){ left=(hl+hw+gap+cw<vw-12)?hl+hw+gap:Math.max(12,hl-cw-gap); }
      card.style.left=left+'px'; card.style.top=top+'px';
    }
    function show(n){
      i=Math.max(0,Math.min(list.length-1,n));
      var s=list[i], target=[].concat(s.el()).filter(shown)[0];
      var card=tour.querySelector('.tip');
      card.querySelector('.st').textContent=(i+1)+' of '+list.length;
      card.querySelector('h3').textContent=s.t;
      card.querySelector('p').textContent=s.d;
      card.querySelector('.bk').hidden=i===0;
      var nx=card.querySelector('.nx'); nx.textContent=i===list.length-1?'Done':'Next';
      card.querySelector('.dotsrow').innerHTML=list.map(function(_,k){return '<i'+(k===i?' class="on"':'')+'></i>';}).join('');
      [].concat(s.el()).filter(shown).forEach(function(el){
        /* a control in a row that scrolls sideways (the phone button bar) is brought into view first */
        var row=el.parentElement;
        while(row&&row!==document.body&&!(row.scrollWidth>row.clientWidth+2&&/(auto|scroll)/.test(getComputedStyle(row).overflowX)))row=row.parentElement;
        if(row&&row!==document.body){
          var er=el.getBoundingClientRect(), rr=row.getBoundingClientRect();
          if(er.left<rr.left||er.right>rr.right)row.scrollLeft+=er.left-rr.left-(rr.width-er.width)/2;
        }
      });
      if(target){
        var r=target.getBoundingClientRect();
        if(r.top<70||r.bottom>window.innerHeight-200){
          window.scrollTo({top:window.scrollY+r.top-Math.max(90,(window.innerHeight-r.height)/2-80),behavior:'auto'});
        }
      }
      place(); requestAnimationFrame(place);
      nx.focus({preventScroll:true});
    }
    function key(e){
      if(!tour)return;
      if(e.key==='Escape'){end();}
      else if(e.key==='ArrowRight'){next();}
      else if(e.key==='ArrowLeft'){show(i-1);}
      else if(e.key==='Tab'){ var f=tour.querySelectorAll('.tip button:not([hidden])'), a=f[0], z=f[f.length-1];
        if(e.shiftKey&&document.activeElement===a){e.preventDefault(); z.focus();} else if(!e.shiftKey&&document.activeElement===z){e.preventDefault(); a.focus();} return; }
      else return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    }
    function next(){ if(i>=list.length-1)end(); else show(i+1); }
    function start(){
      if(tour)return; dismissInvite();
      list=STEPS.filter(function(s){return rectOf(s.el());});
      if(!list.length)return;
      tour=document.createElement('div'); tour.className='wr-tour';
      tour.setAttribute('role','dialog'); tour.setAttribute('aria-modal','true'); tour.setAttribute('aria-labelledby','wrtourh');
      tour.innerHTML='<div class="block"></div><div class="hole"></div><div class="tip" aria-live="polite"><div class="hd"><span class="st"></span>'
        +'<button type="button" class="sk">Close tour</button></div><h3 id="wrtourh"></h3><p></p>'
        +'<div class="ft"><span class="dotsrow" aria-hidden="true"></span><button type="button" class="bk">Back</button><button type="button" class="nx">Next</button></div></div>';
      document.body.appendChild(tour);
      tour.querySelector('.nx').addEventListener('click',next);
      tour.querySelector('.bk').addEventListener('click',function(){show(i-1);});
      tour.querySelector('.sk').addEventListener('click',end);
      window.addEventListener('keydown',key,true);
      window.addEventListener('resize',place); window.addEventListener('scroll',place,{passive:true});
      btn.setAttribute('aria-expanded','true');
      show(0);
    }
    function end(){
      if(!tour)return;
      window.removeEventListener('keydown',key,true);
      window.removeEventListener('resize',place); window.removeEventListener('scroll',place);
      tour.remove(); tour=null; btn.setAttribute('aria-expanded','false'); btn.focus({preventScroll:true});
    }
    btn.addEventListener('click',start);

    var invite=null;
    function dismissInvite(){ if(invite){invite.remove(); invite=null;} try{localStorage.setItem(KEY,'1');}catch(e){} }
    var seen=false; try{seen=!!localStorage.getItem(KEY);}catch(e){seen=true;}
    if(!seen&&!/[?&]set=/.test(location.search)){
      setTimeout(function(){
        if(tour)return;
        invite=document.createElement('div'); invite.className='wr-invite'; invite.setAttribute('role','status');
        invite.innerHTML='<b>New to Word Rooms?</b><span>A one-minute tour shows you what every button does.</span>'
          +'<div class="ac"><button type="button" class="go">Show me</button><button type="button" class="no">No thanks</button></div>';
        document.body.appendChild(invite);
        invite.querySelector('.go').addEventListener('click',start);
        invite.querySelector('.no').addEventListener('click',dismissInvite);
      },1200);
    }
  }

  function go(){places(); filmstrip(); guide();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go); else go();
})();
