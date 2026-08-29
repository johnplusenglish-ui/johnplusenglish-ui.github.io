/* ═══════════════════════════════════════════════════════════════════════
   Shared matching-exercise component - johnplusenglish.com Study Tools
   One matching layout for every page. Option-1 design: matched pairs snap
   onto one aligned row, tinted green, with a tick in the gutter between the
   two columns. Columns can be swapped (term-first or meaning-first).

   Usage:
     Matching.init({
       mount:      'pv-matching',              // id of an empty container
       data:       [{term, def, freq}, ...],   // the full pool of pairs
       leftLabel:  'Phrasal verb',
       rightLabel: 'Definition',
       title:      'Matching',                 // optional heading
       setSize:    8,
       swapKey:    'jpe_pv_mg_swap',           // localStorage key for swap pref
       freqChips:  [{v:'all',label:'All'}, {v:'common',label:'Common'}, ...]
                    // omit or pass [] to hide the frequency filter
     });
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  var CSS_ID = 'mgx-styles';
  function injectCSS(){
    if(document.getElementById(CSS_ID)) return;
    var css = [
      '.mgx{--gut:60px;--mg-green:#1DD3B0;--mg-green-d:#0E7C6A;--mg-tint:#E6FAF4;--mg-bd:#8DE4D3;font-family:var(--font-body,"Outfit",system-ui,sans-serif)}',
      '.mgx-freq{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 4px}',
      '.mgx-chip{font-family:inherit;font-size:.82rem;font-weight:600;color:var(--muted,#8A8D9A);background:var(--card,#fff);border:1.5px solid var(--border,#E7E3DA);border-radius:7px;padding:.5rem 1rem;cursor:pointer;transition:all .15s}',
      '.mgx-chip:hover{border-color:var(--ink,#2D3047);color:var(--ink,#2D3047)}',
      '.mgx-chip.active{background:var(--ink,#2D3047);border-color:var(--ink,#2D3047);color:#fff}',
      '.mgx-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 12px}',
      '.mgx-set-label{font-size:.82rem;font-weight:600;color:var(--muted,#8A8D9A)}',
      '.mgx-tool-btn{font-family:inherit;font-weight:600;font-size:.82rem;color:var(--ink,#2D3047);background:var(--card,#fff);border:1.5px solid var(--border,#E7E3DA);border-radius:9px;padding:.5rem .9rem;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:border-color .15s}',
      '.mgx-tool-btn:hover{border-color:var(--ink,#2D3047)}',
      '.mgx-tool-btn svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}',
      '.mgx-spacer{margin-left:auto}',
      '.mgx-bar{display:flex;gap:20px;font-size:.85rem;color:var(--muted,#8A8D9A);margin:0 0 8px}',
      '.mgx-bar strong{color:var(--ink,#2D3047)}',
      '.mgx-progress{height:5px;border-radius:3px;background:var(--border,#E7E3DA);overflow:hidden;margin:0 0 18px}',
      '.mgx-progress-fill{height:100%;width:0;background:var(--mg-green);transition:width .3s}',
      '.mgx-colhead{display:grid;grid-template-columns:1fr var(--gut) 1fr;font-size:.68rem;font-weight:700;letter-spacing:.13em;color:var(--muted,#8A8D9A);text-transform:uppercase;padding:0 4px 10px}',
      '.mgx-colhead .h-left{grid-column:1}.mgx-colhead .h-right{grid-column:3;text-align:right}',
      '.mgx.swapped .mgx-colhead .h-left{grid-column:3;text-align:right}.mgx.swapped .mgx-colhead .h-right{grid-column:1;text-align:left}',
      '.mgx-solved{display:flex;flex-direction:column;gap:10px}',
      '.mgx-solved:empty{display:none}',
      '.mgx-row{display:grid;grid-template-columns:1fr var(--gut) 1fr;align-items:stretch}',
      '.mgx-row>*{grid-row:1}',
      '.mgx-pool{display:grid;grid-template-columns:1fr var(--gut) 1fr;margin-top:10px}',
      '.mgx-solved:empty + .mgx-pool{margin-top:0}',
      '.mgx-terms{grid-column:1}.mgx-defs{grid-column:3}',
      '.mgx.swapped .mgx-terms{grid-column:3}.mgx.swapped .mgx-defs{grid-column:1}',
      '.mgx-terms,.mgx-defs{display:flex;flex-direction:column;gap:10px;min-width:0}',
      '.mgx-cell{background:var(--card,#fff);border:1.5px solid var(--border,#E7E3DA);border-radius:13px;padding:13px 16px;min-height:52px;display:flex;align-items:center;gap:10px;font-size:.96rem;color:var(--ink,#2D3047);line-height:1.4;transition:background .25s,border-color .25s,color .25s;min-width:0}',
      'button.mgx-cell{cursor:pointer;text-align:left;font-family:inherit;width:100%}',
      'button.mgx-cell:hover{border-color:var(--ink,#2D3047)}',
      '.mgx-cell .lab{font-weight:700;color:var(--muted,#8A8D9A);flex:0 0 auto}',
      '.mgx-cell .cell-txt{font-weight:600;min-width:0}',
      'button.mgx-cell.sel{border-color:var(--accent,#2176FF);background:var(--accent-tint,#EAF2FE)}',
      'button.mgx-cell.wrong{border-color:#E24B4A;background:#FCEBEB;animation:mgx-shake .4s}',
      '@keyframes mgx-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}',
      '.mgx-row .term{grid-column:1}.mgx-row .def{grid-column:3}',
      '.mgx.swapped .mgx-row .term{grid-column:3}.mgx.swapped .mgx-row .def{grid-column:1}',
      '.mgx-row .mgx-cell{background:var(--mg-tint);border-color:var(--mg-bd);color:var(--mg-green-d)}',
      '.mgx-row .mgx-cell .lab{color:var(--mg-green-d);opacity:.7}',
      '.mgx-row .term{border-top-right-radius:6px;border-bottom-right-radius:6px}',
      '.mgx-row .def{border-top-left-radius:6px;border-bottom-left-radius:6px}',
      '.mgx.swapped .mgx-row .term{border-radius:13px;border-top-left-radius:6px;border-bottom-left-radius:6px}',
      '.mgx.swapped .mgx-row .def{border-radius:13px;border-top-right-radius:6px;border-bottom-right-radius:6px}',
      '.mgx-tick{grid-column:2;display:flex;align-items:center;justify-content:center}',
      '.mgx-tick i{width:34px;height:34px;border-radius:50%;background:var(--mg-green);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(29,211,176,.4)}',
      '.mgx-tick svg{width:20px;height:20px;stroke:#fff;fill:none;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}',
      '.mgx-row.enter{animation:mgx-in .35s ease}',
      '@keyframes mgx-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}',
      '.mgx-done,.mgx-complete{text-align:center;padding:34px 20px}',
      '.mgx-done-msg,.mgx-complete-title{font-size:1.15rem;font-weight:700;color:var(--ink,#2D3047);margin:0 0 6px}',
      '.mgx-done-sub,.mgx-complete-sub{font-size:.9rem;color:var(--muted,#8A8D9A);margin:0 0 18px}',
      '.mgx-cta{font-family:inherit;font-weight:700;font-size:.9rem;color:#fff;background:var(--mg-green);border:none;border-radius:10px;padding:.7rem 1.4rem;cursor:pointer}',
      '.mgx-cta:hover{background:var(--mg-green-d)}',
      '@media (max-width:560px){.mgx{--gut:42px}.mgx-cell{font-size:.9rem;padding:11px 12px}}',
      '@media (prefers-reduced-motion:reduce){.mgx *{animation:none!important;transition:none!important}}'
    ].join('\n');
    var s = document.createElement('style');
    s.id = CSS_ID; s.textContent = css;
    document.head.appendChild(s);
  }

  var CHECK = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
  var SWAP  = '<svg viewBox="0 0 24 24"><path d="M7 4l-4 4 4 4"/><path d="M3 8h13"/><path d="M17 20l4-4-4-4"/><path d="M21 16H8"/></svg>';

  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function letters(i){return String.fromCharCode(65+i);}

  function init(cfg){
    injectCSS();
    var root = document.getElementById(cfg.mount);
    if(!root) return;
    var setSize = cfg.setSize || 8;
    var chips = cfg.freqChips || [];
    var swapKey = cfg.swapKey || ('mgx_swap_' + cfg.mount);

    var st = {freq:'all', sets:[], cur:0, matched:0, mistakes:0, setMistakes:[], sel:null, size:0};

    var swapped = false;
    try{ swapped = localStorage.getItem(swapKey) === '1'; }catch(e){}

    root.innerHTML =
      '<div class="mgx' + (swapped?' swapped':'') + '">' +
        (cfg.title ? '<h3 class="mg-launch-title">' + esc(cfg.title) + '</h3>' : '') +
        (chips.length ? '<div class="mgx-freq">' + chips.map(function(c){
            return '<button type="button" class="mgx-chip' + (c.v===st.freq?' active':'') + '" data-freq="' + c.v + '">' + esc(c.label) + '</button>';
          }).join('') + '</div>' : '') +
        '<div class="mgx-session" hidden>' +
          '<div class="mgx-toolbar">' +
            '<button type="button" class="mgx-tool-btn" data-act="new">New set</button>' +
            '<button type="button" class="mgx-tool-btn" data-act="swap">' + SWAP + 'Swap columns</button>' +
            '<span class="mgx-set-label mgx-spacer"></span>' +
          '</div>' +
          '<div class="mgx-bar"><span><strong class="mgx-n-matched">0</strong> of <strong class="mgx-n-size">0</strong> matched</span><span><strong class="mgx-n-mistakes">0</strong> mistakes</span></div>' +
          '<div class="mgx-progress"><div class="mgx-progress-fill"></div></div>' +
          '<div class="mgx-board">' +
            '<div class="mgx-colhead"><span class="h-left">' + esc(cfg.leftLabel||'Term') + '</span><span class="h-right">' + esc(cfg.rightLabel||'Definition') + '</span></div>' +
            '<div class="mgx-solved"></div>' +
            '<div class="mgx-pool"><div class="mgx-terms"></div><div class="mgx-defs"></div></div>' +
          '</div>' +
          '<div class="mgx-done" hidden><div class="mgx-done-msg"></div><div class="mgx-done-sub"></div><button type="button" class="mgx-cta" data-act="next">Next set</button></div>' +
        '</div>' +
        '<div class="mgx-complete" hidden><div class="mgx-complete-title">All sets complete</div><div class="mgx-complete-score mgx-complete-sub"></div><button type="button" class="mgx-cta" data-act="restart">Play again</button></div>' +
      '</div>';

    var mgx      = root.querySelector('.mgx');
    var session  = root.querySelector('.mgx-session');
    var complete = root.querySelector('.mgx-complete');
    var board    = root.querySelector('.mgx-board');
    var doneBox  = root.querySelector('.mgx-done');
    var solvedEl = root.querySelector('.mgx-solved');
    var termsEl  = root.querySelector('.mgx-terms');
    var defsEl   = root.querySelector('.mgx-defs');
    var setLabel = root.querySelector('.mgx-set-label');
    var nMatched = root.querySelector('.mgx-n-matched');
    var nSize    = root.querySelector('.mgx-n-size');
    var nMist    = root.querySelector('.mgx-n-mistakes');
    var progFill = root.querySelector('.mgx-progress-fill');

    function buildPool(){
      return cfg.data.filter(function(e){ return st.freq==='all' || e.freq===st.freq; });
    }
    function chunkSets(){
      var pool = shuffle(buildPool().slice()), sets = [];
      while(pool.length){
        var cur=[], terms={}, defs={}, leftover=[];
        for(var j=0;j<pool.length;j++){
          var e=pool[j];
          if(cur.length<setSize && !terms[e.term] && !defs[e.def]){ cur.push(e); terms[e.term]=1; defs[e.def]=1; }
          else leftover.push(e);
        }
        if(!cur.length) break;
        sets.push(cur); pool=leftover;
      }
      return sets;
    }

    function start(){
      st.sets = chunkSets();
      if(!st.sets.length) return;
      st.cur = 0; st.setMistakes = [];
      complete.hidden = true; session.hidden = false;
      loadSet(0);
    }

    function cell(kind, label, text){
      var tag = kind==='pool' ? 'button' : 'div';
      return '<' + tag + ' class="mgx-cell"' + (kind==='pool'?' type="button"':'') + '>' +
             '<span class="lab">' + label + '</span><span class="cell-txt">' + esc(text) + '</span></' + tag + '>';
    }

    function loadSet(idx){
      st.cur = idx; st.matched = 0; st.mistakes = 0; st.sel = null; st.size = st.sets[idx].length;
      doneBox.hidden = true; board.style.display = '';
      solvedEl.innerHTML = ''; termsEl.innerHTML = ''; defsEl.innerHTML = '';
      var pairs = st.sets[idx];
      var terms = shuffle(pairs.map(function(p,i){ return {pid:i, text:p.term}; }));
      var defs  = shuffle(pairs.map(function(p,i){ return {pid:i, text:p.def}; }));
      terms.forEach(function(t,i){
        var b = document.createElement('button');
        b.type='button'; b.className='mgx-cell'; b.dataset.pid=t.pid; b.dataset.side='term';
        b.innerHTML = '<span class="lab">' + (i+1) + '.</span><span class="cell-txt">' + esc(t.text) + '</span>';
        b.addEventListener('click', function(){ pick(b); });
        termsEl.appendChild(b);
      });
      defs.forEach(function(d,i){
        var b = document.createElement('button');
        b.type='button'; b.className='mgx-cell'; b.dataset.pid=d.pid; b.dataset.side='def';
        b.innerHTML = '<span class="lab">' + letters(i) + '.</span><span class="cell-txt">' + esc(d.text) + '</span>';
        b.addEventListener('click', function(){ pick(b); });
        defsEl.appendChild(b);
      });
      setLabel.textContent = 'Set ' + (idx+1) + ' of ' + st.sets.length;
      nSize.textContent = st.size;
      updateBar();
    }

    function clearSel(){
      Array.prototype.forEach.call(root.querySelectorAll('.mgx-cell.sel'), function(b){ b.classList.remove('sel'); });
    }

    function pick(btn){
      if(!st.sel){ clearSel(); btn.classList.add('sel'); st.sel = btn; return; }
      if(btn === st.sel){ btn.classList.remove('sel'); st.sel = null; return; }
      if(btn.dataset.side === st.sel.dataset.side){ st.sel.classList.remove('sel'); btn.classList.add('sel'); st.sel = btn; return; }
      var a = st.sel, b = btn;
      if(a.dataset.pid === b.dataset.pid){
        onMatch(a.dataset.side==='term'?a:b, a.dataset.side==='term'?b:a);
      } else {
        st.mistakes++;
        a.classList.remove('sel'); a.classList.add('wrong'); b.classList.add('wrong');
        setTimeout(function(){ a.classList.remove('wrong'); b.classList.remove('wrong'); }, 400);
        updateBar();
      }
      st.sel = null;
    }

    function textOf(btn){ return btn.querySelector('.cell-txt').textContent; }
    function labOf(btn){ return btn.querySelector('.lab').textContent; }

    function onMatch(termBtn, defBtn){
      var row = document.createElement('div');
      row.className = 'mgx-row enter';
      row.innerHTML =
        '<div class="mgx-cell term"><span class="lab">' + labOf(termBtn) + '</span><span class="cell-txt">' + esc(textOf(termBtn)) + '</span></div>' +
        '<div class="mgx-tick"><i>' + CHECK + '</i></div>' +
        '<div class="mgx-cell def"><span class="lab">' + labOf(defBtn) + '</span><span class="cell-txt">' + esc(textOf(defBtn)) + '</span></div>';
      solvedEl.appendChild(row);
      setTimeout(function(){ row.classList.remove('enter'); }, 380);
      termBtn.parentNode.removeChild(termBtn);
      defBtn.parentNode.removeChild(defBtn);
      st.matched++;
      updateBar();
      if(st.matched === st.size) setTimeout(completeSet, 450);
    }

    function updateBar(){
      nMatched.textContent = st.matched;
      nMist.textContent = st.mistakes;
      progFill.style.width = (st.size ? (st.matched/st.size*100) : 0) + '%';
    }

    function completeSet(){
      st.setMistakes[st.cur] = st.mistakes;
      if(st.cur >= st.sets.length - 1){ showFinal(); return; }
      board.style.display = 'none';
      doneBox.hidden = false;
      doneBox.querySelector('.mgx-done-msg').textContent = 'Set ' + (st.cur+1) + ' of ' + st.sets.length + ' complete';
      doneBox.querySelector('.mgx-done-sub').textContent = st.mistakes===0 ? 'No mistakes - perfect' : st.mistakes + ' mistake' + (st.mistakes===1?'':'s');
    }

    function showFinal(){
      session.hidden = true; complete.hidden = false;
      var total=0, perfect=0;
      for(var i=0;i<st.setMistakes.length;i++){ total += (st.setMistakes[i]||0); if(!st.setMistakes[i]) perfect++; }
      var pairs = st.sets.reduce(function(a,s){ return a+s.length; }, 0);
      var multi = st.sets.length > 1;
      complete.querySelector('.mgx-complete-score').textContent = total===0
        ? pairs + ' pairs matched with no mistakes' + (multi ? ' across all ' + st.sets.length + ' sets' : '')
        : pairs + ' pairs matched · ' + total + ' mistake' + (total===1?'':'s') + (multi ? ' · ' + perfect + ' of ' + st.sets.length + ' sets perfect' : '');
    }

    root.addEventListener('click', function(e){
      var chip = e.target.closest('.mgx-chip');
      if(chip){
        Array.prototype.forEach.call(root.querySelectorAll('.mgx-chip'), function(c){ c.classList.remove('active'); });
        chip.classList.add('active'); st.freq = chip.dataset.freq; start(); return;
      }
      var act = e.target.closest('[data-act]');
      if(!act) return;
      var a = act.dataset.act;
      if(a==='new') start();
      else if(a==='next') loadSet(st.cur+1);
      else if(a==='restart'){ complete.hidden = true; start(); }
      else if(a==='swap'){
        var on = mgx.classList.toggle('swapped');
        try{ localStorage.setItem(swapKey, on?'1':'0'); }catch(e2){}
      }
    });

    start();
  }

  window.Matching = { init: init };
})();
