/* johnplusenglish - lightweight cookieless pageview counter.
   No signup, no cookies, no personal data - just an anonymous hit ping.
   TEMPORARY: swap for GoatCounter/Plausible/Umami later by editing this one file.
   View counts (read-only, no increment):
     total :  https://abacus.jasoncameron.dev/get/johnplusenglish/site
     page  :  https://abacus.jasoncameron.dev/get/johnplusenglish/<page-slug>
*/
(function () {
  var NS = 'https://abacus.jasoncameron.dev/hit/johnplusenglish/';
  function slug() {
    var p = (location.pathname.split('/').pop() || 'index.html');
    return p.replace(/[^A-Za-z0-9_-]/g, '-').toLowerCase() || 'index-html';
  }
  function hit(key) {
    try { fetch(NS + key, { mode: 'cors', keepalive: true }).catch(function () {}); }
    catch (e) {}
  }
  function run() { hit('site'); hit(slug()); }
  // Count the initial load, and each in-site (pushState) navigation.
  run();
  var _ps = history.pushState;
  history.pushState = function () {
    var r = _ps.apply(this, arguments);
    try { run(); } catch (e) {}
    return r;
  };
})();
