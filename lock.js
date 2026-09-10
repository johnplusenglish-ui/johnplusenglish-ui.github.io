(function(){
  var KEY = 'jpe-unlocked-v1';
  var PUBLIC = ['pisa-stats.html'];
  var here = location.pathname.split('/').pop() || 'index.html';
  if (here === 'lock.html') return;
  if (PUBLIC.indexOf(here) > -1) return;
  try {
    if (sessionStorage.getItem(KEY) === '1') return;
  } catch(e) {}
  var ret = encodeURIComponent(here + location.search);
  location.replace('lock.html?r=' + ret);
})();
