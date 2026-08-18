#!/usr/bin/env python3
"""
Generates one static PDF per word bank into pdfs/<bank-id>.pdf.

Reads the same TOPICS/GROUPS data word-banks-content.html embeds (the two
inline <script type="application/json"> blocks), builds a standalone HTML
sheet per bank (mirroring the lpHead/lpStudyList markup in
word-banks-content.html - keep the two in sync if that CSS changes), and
prints each straight to PDF with headless Chrome's --no-pdf-header-footer.

That flag suppresses Chrome's own date/URL header and footer at the print
API level, with no CSS trade-offs - the thing the in-browser Print/Download
buttons can't do, since a site visitor's own interactive print dialog has
no equivalent switch. Building standalone one-bank-at-a-time HTML files
(rather than driving the live app page) sidesteps a real problem: writing
into an already-rendered page via document.write() left the old app shell
bleeding through in testing, even with document.open()/close(). A fresh,
single-purpose file for each bank has nothing else to bleed through.

Run after any word bank content changes:
    python3 build-word-bank-pdfs.py
"""
import html
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "word-banks-content.html"
OUT_DIR = ROOT / "pdfs"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

POS_ORDER = ['n.', 'adj.', 'v.', 'phr.v.', 'colloc.', 'idiom', 'phrase', 'slang']
POS_LABELS = {
    'n.': 'Nouns', 'adj.': 'Adjectives', 'v.': 'Verbs', 'phr.v.': 'Phrasal Verbs',
    'colloc.': 'Collocations', 'idiom': 'Idioms', 'phrase': 'Set Phrases', 'slang': 'Modern Slang',
}


def esc(s):
    return (str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def disp(title):
    return title.replace('&amp;', '&')


def extract_json(src, script_id):
    m = re.search(
        r'<script id="' + re.escape(script_id) + r'"[^>]*>(.*?)</script>',
        src, re.S,
    )
    if not m:
        sys.exit(f"could not find <script id=\"{script_id}\"> in {SRC}")
    return json.loads(html.unescape(m.group(1)))


def bank_entries(topic):
    out = []
    for tier in ('tier1', 'tier2', 'tier3'):
        for row in topic.get('DATA', {}).get(tier, []):
            t, p, d, x = (row + [''])[:4]
            out.append({'t': t, 'p': p, 'd': d, 'x': x})
    return out


def group_by_pos(items):
    out = []
    for pos in POS_ORDER:
        matched = [e for e in items if e['p'] == pos]
        if matched:
            out.append((POS_LABELS[pos], matched))
    return out


PAGE_CSS = '''
*{box-sizing:border-box}
html{color-scheme:light;background:#fff}
body{font-family:Outfit,sans-serif;background:#fff;color:#2D3047;padding:1.5rem 2rem;max-width:820px;margin:0 auto;font-size:10.5pt;line-height:1.5}
.brand{text-align:right;font-size:.7rem;color:#7A7D8E;margin-bottom:1.1rem}
h1{font-size:1.5rem;font-weight:800;letter-spacing:-.02em;margin:0 0 .15rem}
.sub{font-size:.78rem;color:#7A7D8E;margin-bottom:1.3rem;padding-bottom:.7rem;border-bottom:1.5px solid #2D3047}
h2{font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#3D5A80;margin:1.1rem 0 .5rem;padding-bottom:.2rem;border-bottom:1px solid #ddd;break-after:avoid;page-break-after:avoid}
h2:first-of-type{margin-top:0}
.cols{display:grid;grid-template-columns:repeat(2,1fr);gap:0 1.8rem}
.item{break-inside:avoid;page-break-inside:avoid;margin-bottom:.5rem}
.term{font-weight:800}
.def{font-size:.9em;color:#3a3d52}
.ex{font-size:.85em;font-style:italic;color:#6b6e80;margin-top:.05rem}
@page{size:A4;margin:1.7cm 1.9cm}
'''


def build_sheet_html(bank_id, topic):
    items = bank_entries(topic)
    title = disp(topic['title'])
    sub = f"{len(items)} word{'s' if len(items) != 1 else ''} · {title}"
    parts = [
        '<!DOCTYPE html><html><head><meta charset="utf-8">',
        f'<title>{esc(title)}</title>',
        '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">',
        '<meta name="color-scheme" content="light">',
        f'<style>{PAGE_CSS}</style></head><body>',
        f'<div class="brand">johnplusenglish.com</div><h1>{esc(title)}</h1>',
        f'<div class="sub">{esc(sub)}</div>',
    ]
    for label, group_items in group_by_pos(items):
        parts.append(f'<h2>{esc(label)}</h2><div class="cols">')
        for e in group_items:
            parts.append('<div class="item">')
            parts.append(f'<span class="term">{esc(e["t"])}</span>')
            if e['d']:
                parts.append(f'<div class="def">{esc(e["d"])}</div>')
            if e['x']:
                parts.append(f'<div class="ex">{esc(e["x"])}</div>')
            parts.append('</div>')
        parts.append('</div>')
    parts.append('</body></html>')
    return ''.join(parts)


def main():
    src = SRC.read_text(encoding='utf-8')
    topics = extract_json(src, 'topicsData')
    OUT_DIR.mkdir(exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        for i, (bank_id, topic) in enumerate(sorted(topics.items()), 1):
            html_path = Path(tmp) / f'{bank_id}.html'
            html_path.write_text(build_sheet_html(bank_id, topic), encoding='utf-8')
            pdf_path = OUT_DIR / f'{bank_id}.pdf'
            result = subprocess.run(
                [CHROME, '--headless', '--disable-gpu', '--no-pdf-header-footer',
                 f'--print-to-pdf={pdf_path}', html_path.as_uri()],
                capture_output=True, text=True,
            )
            if result.returncode != 0 or not pdf_path.exists():
                print(f'[{i}/{len(topics)}] FAILED {bank_id}: {result.stderr.strip()}')
                sys.exit(1)
            print(f'[{i}/{len(topics)}] {bank_id}.pdf ({pdf_path.stat().st_size // 1024} KB)')

    print(f'\nDone - {len(topics)} PDFs written to {OUT_DIR}')


if __name__ == '__main__':
    main()
