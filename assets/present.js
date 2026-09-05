/* Shared classroom presentation controls (timer) for johnplusenglish.
   Extracted from the per-page copies so every speaking/exam tool shares one
   implementation. Call timerInit(id, defaultSecs, locked) after inserting the
   widget markup (static, or from timerWidgetHTML(id)). Styles: present.css. */
function timerFormatTime(totalSeconds){
  var m=Math.floor(totalSeconds/60), s=totalSeconds%60;
  return m+':'+(s<10?'0':'')+s;
}

function timerParseTime(str){
  var parts=String(str).trim().split(':');
  var m, s;
  if(parts.length>=2){ m=parseInt(parts[0],10); s=parseInt(parts[1],10); }
  else { m=parseInt(parts[0],10); s=0; }
  if(isNaN(m)) m=0;
  if(isNaN(s)||s<0||s>59) s=0;
  var total=m*60+s;
  if(!total || total<1) return null;
  return Math.min(total,5999);
}

function timerWidgetHTML(id, defaultSecs, locked){
  var editBits = locked ? '' :
    '<button class="timer-edit-btn" id="timerEditBtn-'+id+'" onclick="timerEditDuration(\''+id+'\')" title="Edit duration" aria-label="Edit timer duration"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'+
    '<span class="timer-duration-edit" id="timerDurationEdit-'+id+'"><input type="text" inputmode="numeric" class="timer-duration-input" id="timerDurationInput-'+id+'" placeholder="'+timerFormatTime(defaultSecs)+'" onblur="timerCommitDuration(\''+id+'\')" onkeydown="if(event.key===\'Enter\'){this.blur()}else if(event.key===\'Escape\'){timerCancelEdit(\''+id+'\')}"></span>';
  return ''+
    '<div class="timer-section">'+
      '<div class="timer-progress"><div class="timer-progress-fill" id="timerProgress-'+id+'"></div></div>'+
      '<div class="timer-controls">'+
        '<span class="timer-btn-wrap">'+
          '<button class="timer-btn" id="timerBtn-'+id+'" onclick="timerHandleClick(\''+id+'\')"><span class="timer-btn-icon" id="timerBtnIcon-'+id+'">&#9654;</span><span id="timerBtnLabel-'+id+'"></span></button>'+
          editBits+
        '</span>'+
      '</div>'+
    '</div>';
}

function timerInit(id, defaultSecs, locked, onEnd){
  timerState[id] = {interval:null, seconds:defaultSecs, total:defaultSecs, running:false, paused:false, defaultSecs:defaultSecs, locked:!!locked, onEnd:(typeof onEnd==='function'?onEnd:null)};
  timerUpdateBtn(id);
}

function timerSelectDuration(id, secs){
  var st = timerState[id];
  clearInterval(st.interval); st.interval=null;
  st.running=false; st.paused=false;
  st.total=secs; st.seconds=secs;
  var prog = document.getElementById('timerProgress-'+id);
  prog.style.width='0%'; prog.className='timer-progress-fill';
  timerUpdateBtn(id);
}

function timerEditDuration(id){
  var st = timerState[id];
  if(st.locked) return;
  clearInterval(st.interval); st.interval=null; st.running=false; st.paused=false;
  var input=document.getElementById('timerDurationInput-'+id);
  input.value=timerFormatTime(st.defaultSecs);
  document.getElementById('timerBtn-'+id).style.display='none';
  document.getElementById('timerEditBtn-'+id).style.display='none';
  document.getElementById('timerDurationEdit-'+id).style.display='inline-flex';
  input.focus();
  input.select();
}

function timerCommitDuration(id){
  var st = timerState[id];
  if(st._canceling){ st._canceling=false; return; }
  var parsed=timerParseTime(document.getElementById('timerDurationInput-'+id).value);
  if(parsed) st.defaultSecs=parsed;
  document.getElementById('timerDurationEdit-'+id).style.display='none';
  document.getElementById('timerBtn-'+id).style.display='inline-flex';
  timerSelectDuration(id, st.defaultSecs);
}

function timerCancelEdit(id){
  var st = timerState[id];
  st._canceling=true;
  document.getElementById('timerDurationEdit-'+id).style.display='none';
  document.getElementById('timerBtn-'+id).style.display='inline-flex';
  timerUpdateBtn(id);
}

function timerHandleClick(id){
  var st = timerState[id];
  if(!st.running && !st.paused && st.seconds<=0 && st.total>0){ timerSelectDuration(id, st.defaultSecs); return; }
  timerToggle(id);
}

function timerToggle(id){
  var st = timerState[id];
  if(!st.total) return;
  if(!st.running && !st.paused){ st.running=true; timerTick(id); }
  else if(st.running){ clearInterval(st.interval); st.interval=null; st.running=false; st.paused=true; }
  else{ st.paused=false; st.running=true; timerTick(id); }
  timerUpdateBtn(id);
}

function timerTick(id){
  var st = timerState[id];
  var prog=document.getElementById('timerProgress-'+id);
  st.interval=setInterval(function(){
    st.seconds--;
    var pct=((st.total-st.seconds)/st.total)*100;
    prog.style.width=pct+'%';
    if(st.seconds<=10 && st.seconds>0){ prog.className='timer-progress-fill warn'; }
    if(st.seconds<=0){
      clearInterval(st.interval); st.interval=null; st.running=false;
      prog.style.width='100%'; prog.className='timer-progress-fill warn';
      if(st.onEnd) st.onEnd(id);
      setTimeout(function(){
        if(!st.running && !st.paused && st.seconds<=0){ timerSelectDuration(id, st.defaultSecs); }
      },2500);
    }
    timerUpdateBtn(id);
  },1000);
}

function timerUpdateBtn(id){
  var st = timerState[id];
  var btn=document.getElementById('timerBtn-'+id);
  if(!btn) return;
  var icon=document.getElementById('timerBtnIcon-'+id);
  var label=document.getElementById('timerBtnLabel-'+id);
  var editBtn=document.getElementById('timerEditBtn-'+id);
  if(editBtn) editBtn.style.display = st.locked ? 'none' : 'inline-flex';
  if(st.running){
    icon.innerHTML='&#9208;';
    label.innerHTML='<span class="timer-btn-time">'+timerFormatTime(st.seconds)+'</span>';
    btn.className='timer-btn running'+(st.seconds<=10?' warn':'');
  } else if(st.paused){
    icon.innerHTML='&#9654;';
    label.innerHTML='<span class="timer-btn-time">'+timerFormatTime(st.seconds)+'</span>';
    btn.className='timer-btn paused';
  } else if(st.seconds<=0 && st.total>0){
    icon.innerHTML='&#8635;';
    label.textContent='Done';
    btn.className='timer-btn done';
  } else {
    icon.innerHTML='&#9654;';
    label.innerHTML='<span class="timer-btn-time">'+timerFormatTime(st.defaultSecs)+'</span>';
    btn.className='timer-btn';
  }
}
