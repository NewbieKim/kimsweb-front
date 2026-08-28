#!/usr/bin/env python3
"""Render references/dev-history.md into docs/dev-history.html.

Usage:
    python scripts/build_dev_history.py

The output is a self-contained HTML page with a left TOC, following the
noteToHtml design system. Secret-like values are redacted to ***.
"""

from __future__ import annotations

import html
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MD_PATH = ROOT / "references" / "dev-history.md"
HTML_PATH = ROOT / "docs" / "dev-history.html"

SECRET_PATTERNS = [
    re.compile(r"\b(sk|pk)_(live|test)_[A-Za-z0-9_-]{8,}\b"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b"),
    re.compile(r"\bBEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY\b"),
    re.compile(
        r"\b(password|passwd|secret|api[_-]?key|access[_-]?key|token|private[_-]?key)\b\s*[=:]\s*\S+",
        re.IGNORECASE,
    ),
]


def sanitize(text: str) -> str:
    for pattern in SECRET_PATTERNS:
        text = pattern.sub("***", text)
    return text


def inline(text: str) -> str:
    text = html.escape(text, quote=False)
    parts = re.split(r"(`[^`\n]+`)", text)
    for i, part in enumerate(parts):
        if part.startswith("`") and part.endswith("`") and len(part) > 2:
            parts[i] = '<code class="code-inline">' + part[1:-1] + "</code>"
    text = "".join(parts)
    text = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    return text


def render_table(rows: list[str]) -> str:
    parsed: list[list[str]] = []
    for row in rows:
        cells = [cell.strip() for cell in row.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{2,}:?", cell) for cell in cells):
            continue
        parsed.append(cells)
    if not parsed:
        return ""

    head = "".join(f"<th>{inline(cell)}</th>" for cell in parsed[0])
    body_rows = []
    for row in parsed[1:]:
        body_rows.append(
            "<tr>" + "".join(f"<td>{inline(cell)}</td>" for cell in row) + "</tr>"
        )
    return (
        '<div class="table-wrap">'
        '<table class="data-table">'
        f"<thead><tr>{head}</tr></thead>"
        f"<tbody>{''.join(body_rows)}</tbody>"
        "</table>"
        "</div>"
    )


def render(md_text: str) -> tuple[str, list[tuple[int, str, str]]]:
    lines = md_text.splitlines()
    blocks: list[str] = []
    toc: list[tuple[int, str, str]] = []
    section_id = 0
    sub_id = 0
    i = 0

    while i < len(lines):
        stripped = lines[i].strip()
        if not stripped:
            i += 1
            continue

        heading = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if heading:
            level = len(heading.group(1))
            text = inline(heading.group(2))
            if level == 2:
                if blocks:
                    blocks.append("</section>")
                section_id += 1
                sub_id = 0
                anchor = f"sec-{section_id}"
                blocks.append(f'<section class="section" id="{anchor}">\n<h2>{text}</h2>')
                toc.append((2, heading.group(2), anchor))
            elif level == 3:
                sub_id += 1
                anchor = f"sec-{section_id}-{sub_id}"
                blocks.append(f'<h3 id="{anchor}">{text}</h3>')
                toc.append((3, heading.group(2), anchor))
            else:
                blocks.append(f"<h{level}>{text}</h{level}>")
            i += 1
            continue

        fence = re.match(r"^```(\w*)\s*$", stripped)
        if fence:
            lang = fence.group(1) or "text"
            code_lines: list[str] = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i])
                i += 1
            i += 1
            code = html.escape("\n".join(code_lines))
            blocks.append(
                '<div class="code-block">'
                '<div class="code-block-header">'
                '<div class="code-block-dots">'
                '<span class="code-block-dot"></span>'
                '<span class="code-block-dot"></span>'
                '<span class="code-block-dot"></span>'
                "</div>"
                f'<span class="code-block-lang">{lang}</span>'
                "</div>"
                f"<pre><code>{code}</code></pre>"
                "</div>"
            )
            continue

        if stripped.startswith("|"):
            rows: list[str] = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(lines[i].strip())
                i += 1
            blocks.append(render_table(rows))
            continue

        list_match = re.match(r"^[-*]\s+", stripped) or re.match(r"^\d+\.\s+", stripped)
        if list_match:
            ordered = re.match(r"^\d+\.\s+", stripped) is not None
            items: list[str] = []
            while i < len(lines):
                current = lines[i].strip()
                bullet = re.match(r"^[-*]\s+(.*)$", current)
                number = re.match(r"^\d+\.\s+(.*)$", current)
                if ordered and number:
                    items.append(number.group(1))
                    i += 1
                elif not ordered and bullet:
                    items.append(bullet.group(1))
                    i += 1
                else:
                    break
            tag = "ol" if ordered else "ul"
            body = "".join(f"<li>{inline(item)}</li>" for item in items)
            blocks.append(f"<{tag}>{body}</{tag}>")
            continue

        if stripped.startswith(">"):
            quotes: list[str] = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quotes.append(re.sub(r"^>\s?", "", lines[i].strip()))
                i += 1
            body = "".join(f"<p>{inline(item)}</p>" for item in quotes)
            blocks.append(
                '<blockquote class="callout callout-info">'
                '<div class="callout-content">'
                f"{body}"
                "</div>"
                "</blockquote>"
            )
            continue

        if re.fullmatch(r"-{3,}", stripped):
            blocks.append("<hr>")
            i += 1
            continue

        paragraphs = [stripped]
        i += 1
        while i < len(lines):
            current = lines[i].strip()
            if (
                not current
                or current.startswith("#")
                or current.startswith("```")
                or current.startswith("|")
                or current.startswith(">")
                or re.match(r"^[-*]\s+", current)
                or re.match(r"^\d+\.\s+", current)
                or re.fullmatch(r"-{3,}", current)
            ):
                break
            paragraphs.append(current)
            i += 1
        blocks.append("".join(f"<p>{inline(item)}</p>" for item in paragraphs))

    blocks.append("</section>")
    return "\n".join(blocks), toc


def render_toc(entries: list[tuple[int, str, str]]) -> str:
    toc_html = '<ul class="toc-list">'
    open_sub = False
    for level, text, anchor in entries:
        escaped = html.escape(text)
        if level == 2:
            if open_sub:
                toc_html += "</ul></li>"
                open_sub = False
            toc_html += f'<li><a href="#{anchor}">{escaped}</a>'
        else:
            if not open_sub:
                toc_html += '<ul class="toc-sub">'
                open_sub = True
            toc_html += f'<li><a href="#{anchor}">{escaped}</a></li>'
    if open_sub:
        toc_html += "</ul></li>"
    toc_html += "</ul>"
    return toc_html


CSS = """\
:root {
  --bg: #f5f7fa;
  --surface: #ffffff;
  --fg: #1a1d23;
  --muted: #6b7280;
  --border: #e2e5ea;
  --accent: #2496ed;
  --accent-soft: rgba(36,150,237,0.08);
  --code-bg: #0d1117;
  --code-fg: #c9d1d9;
  --code-hl: #58a6ff;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --font-display: "Space Grotesk", "Noto Sans SC", system-ui, sans-serif;
  --font-body: "Noto Sans SC", "Space Grotesk", system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", "SFMono-Regular", Consolas, monospace;
  --fs-h1: clamp(30px, 4vw, 46px);
  --fs-h2: clamp(22px, 2.6vw, 30px);
  --fs-h3: 19px;
  --fs-body: 16px;
  --fs-small: 14px;
  --fs-meta: 13px;
  --container: 1100px;
  --gutter: 24px;
  --radius: 10px;
  --toc-w: 240px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body {
  background: var(--bg); color: var(--fg); font-family: var(--font-body);
  font-size: var(--fs-body); line-height: 1.7; -webkit-font-smoothing: antialiased;
}
img, svg { display: block; max-width: 100%; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
p { text-wrap: pretty; }
h1, h2, h3, h4 { text-wrap: balance; line-height: 1.3; }
ul, ol { padding-left: 1.5em; }
li { margin-bottom: 0.35em; }
.page-layout {
  display: grid; grid-template-columns: var(--toc-w) 1fr; gap: 40px;
  max-width: var(--container); margin: 0 auto; padding: 40px var(--gutter) 80px;
}
@media (max-width: 900px) {
  .page-layout { grid-template-columns: 1fr; gap: 24px; padding: 20px var(--gutter) 60px; }
  .toc-sidebar { display: none; }
}
.toc-sidebar { position: sticky; top: 24px; height: fit-content; max-height: calc(100vh - 48px); overflow-y: auto; }
.toc-title {
  font-family: var(--font-display); font-size: 12px; text-transform: uppercase;
  color: var(--muted); margin-bottom: 16px; font-weight: 600;
}
.toc-list { list-style: none; padding: 0; }
.toc-list li { margin-bottom: 0; }
.toc-list a {
  display: block; padding: 5px 0 5px 14px; font-size: var(--fs-meta);
  color: var(--muted); border-left: 2px solid transparent; line-height: 1.5;
}
.toc-list a:hover { color: var(--fg); border-left-color: var(--border); text-decoration: none; }
.toc-list .active { color: var(--accent); border-left-color: var(--accent); font-weight: 500; }
.toc-sub { padding-left: 14px; }
.toc-sub a { font-size: 12px; padding-left: 12px; }
.doc-content { min-width: 0; }
.hero { margin-bottom: 44px; padding-bottom: 28px; border-bottom: 1px solid var(--border); }
.hero-tag {
  display: inline-block; font-family: var(--font-mono); font-size: 12px;
  color: var(--accent); background: var(--accent-soft); padding: 4px 12px;
  border-radius: 20px; margin-bottom: 16px; font-weight: 500;
}
.hero h1 { font-family: var(--font-display); font-size: var(--fs-h1); font-weight: 700; margin-bottom: 12px; }
.hero-desc { color: var(--muted); max-width: 60ch; line-height: 1.55; }
.section { margin-bottom: 44px; scroll-margin-top: 24px; }
.section h2 {
  font-family: var(--font-display); font-size: var(--fs-h2); font-weight: 700;
  margin-bottom: 18px; padding-bottom: 10px; border-bottom: 2px solid var(--accent);
  display: inline-block;
}
.section h3 { font-size: var(--fs-h3); font-weight: 600; margin-top: 26px; margin-bottom: 12px; }
.section h4 { font-size: var(--fs-small); font-weight: 600; margin-top: 18px; margin-bottom: 8px; color: var(--muted); }
.section p { margin-bottom: 14px; }
.data-table {
  width: 100%; border-collapse: collapse; margin: 18px 0; font-size: var(--fs-small);
  background: var(--surface); border-radius: var(--radius); overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.data-table th {
  background: #f0f4f8; font-weight: 600; text-align: left; padding: 12px 16px;
  border-bottom: 2px solid var(--border); font-family: var(--font-display);
  font-size: var(--fs-meta); color: var(--muted);
}
.data-table td { padding: 11px 16px; border-bottom: 1px solid var(--border); vertical-align: top; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--accent-soft); }
.data-table code {
  font-family: var(--font-mono); font-size: 13px; background: var(--code-bg);
  color: var(--code-hl); padding: 2px 6px; border-radius: 4px;
}
.code-block { position: relative; margin: 18px 0; border-radius: var(--radius); overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.code-block-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; background: #161b22; border-bottom: 1px solid #30363d;
}
.code-block-dots { display: flex; gap: 5px; }
.code-block-dot { width: 10px; height: 10px; border-radius: 50%; background: #30363d; }
.code-block-dot:nth-child(1) { background: #ff5f56; }
.code-block-dot:nth-child(2) { background: #ffbd2e; }
.code-block-dot:nth-child(3) { background: #27ca40; }
.code-block-lang { font-family: var(--font-mono); font-size: 11px; color: #8b949e; text-transform: uppercase; }
.code-block pre { margin: 0; padding: 18px 20px; background: var(--code-bg); color: var(--code-fg); font-family: var(--font-mono); font-size: 13.5px; line-height: 1.65; overflow-x: auto; }
.code-inline { font-family: var(--font-mono); font-size: 0.88em; background: var(--code-bg); color: var(--code-hl); padding: 2px 7px; border-radius: 4px; }
.callout { padding: 16px 20px; border-radius: var(--radius); margin: 18px 0; font-size: var(--fs-small); line-height: 1.6; background: rgba(36,150,237,0.07); border-left: 3px solid var(--accent); }
.callout p { margin-bottom: 4px; }
.callout p:last-child { margin-bottom: 0; }
.page-footer { margin-top: 56px; padding-top: 24px; border-top: 1px solid var(--border); text-align: center; color: var(--muted); font-size: var(--fs-meta); }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
@media print {
  body { background: #fff; }
  .toc-sidebar { display: none; }
  .page-layout { grid-template-columns: 1fr; }
}
"""


def main() -> int:
    if not MD_PATH.exists():
        print(f"ERROR: {MD_PATH} not found")
        return 1

    md_text = sanitize(MD_PATH.read_text(encoding="utf-8"))
    content, toc = render(md_text)
    now = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M")

    html_doc = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ltbot-nextapp 开发记录</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link href="https://cdn.jsdelivr.net/npm/@fontsource-variable/space-grotesk@5.2.10/index.css" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/@fontsource-variable/noto-sans-sc@5.2.10/index.css" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/@fontsource-variable/jetbrains-mono@5.2.8/index.css" rel="stylesheet" />
  <style>
{CSS}
  </style>
</head>
<body>
<div class="page-layout">
  <nav class="toc-sidebar">
    <p class="toc-title">目录</p>
    {render_toc(toc)}
  </nav>
  <main class="doc-content">
    <header class="hero">
      <span class="hero-tag">ltbot-nextapp</span>
      <h1>ltbot-nextapp 开发记录</h1>
      <p class="hero-desc">AI 睡眠伙伴项目的时间线开发档案，由全栈数字员工维护，持续迭代更新。</p>
    </header>
    {content}
    <footer class="page-footer">
      <p>档案生成时间：{now} · 源文件：references/dev-history.md · 维护者：Nextapp 全栈数字员工</p>
    </footer>
  </main>
</div>
<script>
(function () {{
  const tocLinks = document.querySelectorAll('.toc-list a');
  tocLinks.forEach(link => {{
    link.addEventListener('click', function (e) {{
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {{
        targetElement.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
        history.pushState(null, null, '#' + targetId);
      }}
    }});
  }});
  const sections = document.querySelectorAll('.section[id]');
  if (sections.length === 0 || tocLinks.length === 0) return;
  const observer = new IntersectionObserver((entries) => {{
    entries.forEach(entry => {{
      if (entry.isIntersecting) {{
        tocLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.toc-list a[href="#${{entry.target.id}}"]`);
        if (activeLink) activeLink.classList.add('active');
      }}
    }});
  }}, {{ rootMargin: '-80px 0px -70% 0px', threshold: 0 }});
  sections.forEach(section => observer.observe(section));
  if (window.location.hash) {{
    setTimeout(() => {{
      const targetElement = document.querySelector(window.location.hash);
      if (targetElement) targetElement.scrollIntoView({{ behavior: 'auto', block: 'start' }});
    }}, 100);
  }}
}})();
</script>
</body>
</html>
"""

    leaked = [pattern.pattern for pattern in SECRET_PATTERNS if pattern.search(html_doc)]
    if leaked:
        print(f"WARNING: possible secrets in HTML output: {leaked}")
        return 1
    if "{{" in html_doc or "}}" in html_doc:
        print("ERROR: template placeholders left in output")
        return 1

    HTML_PATH.parent.mkdir(parents=True, exist_ok=True)
    HTML_PATH.write_text(html_doc, encoding="utf-8")
    print(f"OK: {HTML_PATH} ({HTML_PATH.stat().st_size} bytes, {len(toc)} TOC entries)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
