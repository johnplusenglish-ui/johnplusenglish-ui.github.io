(function(){
  var KEY = 'jpe-unlocked-v1';
  try {
    if (sessionStorage.getItem(KEY) === '1') return;
  } catch(e) {}
  var here = location.pathname.split('/').pop() || 'index.html';
  if (here === 'lock.html') return;
  var ret = encodeURIComponent(here + location.search);
  location.replace('lock.html?r=' + ret);
})();
