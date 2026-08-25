// Shareable, refresh-safe deep links for content pages loaded in the shell's
// iframe. Two halves, used together on a page-by-page basis:
//   1. Outer shell pages (uoe-b2.html) call forwardToIframe() once, right
//      after the <iframe>, to carry the outer page's own ?query into it.
//   2. Content pages (uoe-b2-content.html, running inside that iframe) call
//      getParam() on load to restore a view, and setParams() whenever the
//      visible state changes, to keep the PARENT tab's address bar in sync
//      (same-origin, so this reaches the real URL the user would copy).
// Uses history.replaceState throughout — never adds back-button stops for
// routine picks like switching test/tab, only keeps the current URL honest.
var JPE_DEEPLINK = {
  forwardToIframe: function(iframeId){
    if (!location.search) return;
    var f = document.getElementById(iframeId);
    if (!f) return;
    var src = f.getAttribute('src') || '';
    var sep = src.indexOf('?') === -1 ? '?' : '&';
    f.src = src + sep + location.search.slice(1);
  },
  getParam: function(name){
    try { return new URLSearchParams(location.search).get(name); } catch(e){ return null; }
  },
  setParams: function(params){
    try {
      var apply = function(url){
        Object.keys(params).forEach(function(k){
          var v = params[k];
          if (v === null || v === undefined || v === '') url.searchParams.delete(k);
          else url.searchParams.set(k, v);
        });
        return url.pathname + url.search;
      };
      history.replaceState(null, '', apply(new URL(location.href)));
      if (window.parent && window.parent !== window) {
        window.parent.history.replaceState(null, '', apply(new URL(window.parent.location.href)));
      }
    } catch(e){}
  }
};
