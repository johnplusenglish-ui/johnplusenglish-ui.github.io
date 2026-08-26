/* johnplusenglish - shared "mistakes log" store.
   Any exercise calls window.jpeLogMistake({q, your, correct, src, level, type})
   when a learner gets an item wrong. Entries live in localStorage (shared across
   every page on the origin, including the iframe content pages) so the "My
   Mistakes" review page can resurface them. Spaced review uses a tiny Leitner
   box: a correct recall bumps the box; two in a row graduates the item out. */
(function () {
  var KEY = 'jpe-mistakes';
  var CAP = 500;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function save(a) {
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {}
  }

  window.jpeLogMistake = function (m) {
    if (!m || !m.correct) return;
    var q = (m.q || '').replace(/\s+/g, ' ').trim();
    var correct = ('' + m.correct).trim();
    if (!q && !correct) return;
    var a = load();
    var id = (m.type || '') + '|' + (m.src || '') + '|' + q + '|' + correct;
    var now = Date.now();
    var found = null;
    for (var i = 0; i < a.length; i++) { if (a[i].id === id) { found = a[i]; break; } }
    if (found) {
      found.n = (found.n || 1) + 1;   // seen wrong again -> back to the start
      found.ts = now;
      found.box = 0;
      found.your = (m.your || found.your || '').trim();
    } else {
      a.push({
        id: id, q: q, your: (m.your || '').trim(), correct: correct,
        src: (m.src || '').trim(), level: (m.level || ''), type: (m.type || ''),
        ts: now, box: 0, n: 1
      });
    }
    if (a.length > CAP) a = a.slice(a.length - CAP);
    save(a);
  };

  window.jpeMistakes = {
    KEY: KEY,
    load: load,
    save: save,
    // ok=true graduates (box+1, removed at box 2); ok=false sends it back to box 0
    grade: function (id, ok) {
      var a = load();
      for (var i = 0; i < a.length; i++) {
        if (a[i].id === id) {
          if (ok) { a[i].box = (a[i].box || 0) + 1; if (a[i].box >= 2) a.splice(i, 1); }
          else { a[i].box = 0; a[i].n = (a[i].n || 1) + 1; }
          break;
        }
      }
      save(a);
    },
    remove: function (id) { save(load().filter(function (x) { return x.id !== id; })); },
    clear: function () { save([]); }
  };
})();
