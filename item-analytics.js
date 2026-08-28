/* johnplusenglish - anonymous, aggregate item analytics for the C1 auto-scored pages.
   No accounts, no cookies, no personal data. Each answered item fires a counter ping to
   the same abacus service the pageview counter uses (analytics.js). We record only the
   FIRST answer per item per browser session, so a learner re-checking or practising the
   same item doesn't skew the numbers.

   For multiple-choice items we count which option was chosen (so a wrong option that gets
   picked nearly as often as the key shows up as ambiguous). For typed gap-fill items we
   count attempts and correct answers (so a near-universal miss shows up as too hard or
   mis-keyed). The John-only dashboard (c1-insights.html) reads these counters back.

   Key scheme (must match tools/build-c1-manifest.mjs):
     <prefix><page>_<part>_<set>_<item>_o<idx>   MC: option idx (0-based) chosen
     <prefix><page>_<part>_<set>_<item>_n        typed: attempt
     <prefix><page>_<part>_<set>_<item>_ok       typed: correct attempt
   <set> is the 0-based test/set index; <item> is the 1-based gap/question number.
   <prefix> namespaces the exam family so the two levels never collide: it defaults to
   'c1a_' (C1 Advanced) and a page can switch it by setting window.JPE_LA_PREFIX (e.g.
   'b2f_' for B2 First) BEFORE this script loads. Must match the manifest builders. */
(function () {
  var HIT = 'https://abacus.jasoncameron.dev/hit/johnplusenglish/';
  function prefix() {
    try { return window.JPE_LA_PREFIX || 'c1a_'; } catch (e) { return 'c1a_'; }
  }
  function ping(counter) {
    try { fetch(HIT + prefix() + counter, { mode: 'cors', keepalive: true }).catch(function () {}); }
    catch (e) {}
  }
  function firstThisSession(itemKey) {
    try {
      var k = 'jpe-la:' + itemKey;
      if (sessionStorage.getItem(k)) return false;
      sessionStorage.setItem(k, '1');
    } catch (e) { /* private mode: just log every time rather than not at all */ }
    return true;
  }
  function base(page, part, set, item) { return page + '_' + part + '_' + set + '_' + item; }

  // Multiple-choice / matching / gap-select: chosenIdx is 0-based; skip if unanswered.
  window.jpeLogMC = function (page, part, set, item, chosenIdx) {
    if (chosenIdx == null || chosenIdx < 0) return;
    var key = base(page, part, set, item);
    if (!firstThisSession(key)) return;
    ping(key + '_o' + chosenIdx);
  };
  // Typed gap-fill: log an attempt, plus whether it was correct.
  window.jpeLogTyped = function (page, part, set, item, isCorrect) {
    var key = base(page, part, set, item);
    if (!firstThisSession(key)) return;
    ping(key + '_n');
    if (isCorrect) ping(key + '_ok');
  };
})();
