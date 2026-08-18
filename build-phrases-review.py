#!/usr/bin/env python3
"""Copy the phrase data out of everyday-phrases-content.html into the student
review page, so the two can never drift.

everyday-phrases-content.html is the single source of truth for the 500 phrases.
everyday-phrases-review.html is standalone (a student may open it straight from
an email attachment, offline), so it carries its own inline copy of that data
rather than fetching it.

Run this after editing any phrase, adding a language, or renaming a category:

    python3 build-phrases-review.py
"""
import io, re, sys

SRC   = 'everyday-phrases-content.html'
DEST  = 'everyday-phrases-review.html'
START = '/* ===DATA START=== */'
END   = '/* ===DATA END=== */'


def grab(text, marker, closer='\n};'):
    """Return the literal source of a top-level `const NAME = {...};` block."""
    i = text.index(marker)
    j = text.index(closer, i) + len(closer)
    return text[i:j]


def main():
    src = io.open(SRC, encoding='utf-8').read()

    cats = grab(src, 'const CATS = [', '\n];')

    # Tab order must match the main page, so take it from LANGS rather than
    # from the order the DATA_xx blocks happen to be defined in.
    meta = re.findall(
        r"\{id:'(\w+)',\s*name:'([^']+)',\s*accent:'(#[0-9A-Fa-f]{6})'", src)
    if not meta:
        sys.exit('No LANGS entries found in ' + SRC)
    langs = [m[0] for m in meta]
    meta = {m[0]: {'name': m[1], 'accent': m[2]} for m in meta}

    defined = set(re.findall(r'const DATA_(\w+) = \{', src))
    missing = [l for l in langs if l not in defined]
    if missing:
        sys.exit('LANGS lists a language with no DATA block: ' + ', '.join(missing))
    orphans = sorted(defined - set(langs))
    if orphans:
        sys.exit('DATA block with no LANGS entry: ' + ', '.join(orphans))

    blocks = [grab(src, 'const DATA_%s = {' % l) for l in langs]

    langs_js = 'var LANGS = [\n' + ',\n'.join(
        "  {id:'%s', name:'%s', accent:'%s'}" % (l, meta[l]['name'], meta[l]['accent'])
        for l in langs) + '\n];'
    data_js = 'var DATA = {' + ', '.join("%s:DATA_%s" % (l, l) for l in langs) + '};'

    payload = '\n'.join(['var ' + cats.split('const ', 1)[1]] +
                        ['var ' + b.split('const ', 1)[1] for b in blocks] +
                        [langs_js, data_js])

    dest = io.open(DEST, encoding='utf-8').read()
    a = dest.index(START) + len(START)
    b = dest.index(END)
    io.open(DEST, 'w', encoding='utf-8').write(
        dest[:a] + '\n' + payload + '\n' + dest[b:])

    total = sum(len(re.findall(r'^\[".*\],?$', blk, re.M)) for blk in blocks)
    print('Synced %d phrases across %d languages into %s'
          % (total, len(langs), DEST))


if __name__ == '__main__':
    main()
