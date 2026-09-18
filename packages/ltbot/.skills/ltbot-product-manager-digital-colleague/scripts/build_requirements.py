#!/usr/bin/env python3
"""Render requirement Markdown files and their index as self-contained HTML."""

from __future__ import annotations

import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIREMENTS = ROOT / "references" / "requirements"
SECRET_PATTERNS = (
    re.compile(r"\b(sk|pk)_(live|test)_[A-Za-z0-9_-]{8,}\b"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b"),
    re.compile(r"(?i)\b(password|passwd|secret|api[_-]?key|access[_-]?key|token)\s*[=:]\s*\S+"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----"),
)
CSS = """
:root{--bg:#f5f7fb;--surface:#fff;--fg:#172033;--muted:#667085;--line:#e6eaf2;--blue:#3f7cff;--soft:#ebf2ff}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.75 system-ui,-apple-system,"Microsoft YaHei",sans-serif}
a{color:var(--blue)}.layout{max-width:1180px;margin:auto;display:grid;grid-template-columns:240px minmax(0,1fr);gap:30px;padding:28px 24px 70px}
aside{position:sticky;top:24px;align-self:start;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px;max-height:calc(100vh - 48px);overflow:auto}
aside b{display:block;margin-bottom:14px}aside a{display:block;padding:5px 0;text-decoration:none;font-size:14px}
main{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:36px 44px;min-width:0}
h1{font-size:clamp(28px,4vw,42px);line-height:1.3;margin:0 0 18px}h2{margin:36px 0 14px;border-bottom:2px solid var(--blue);padding-bottom:8px}
h3{margin:25px 0 10px}p,li{overflow-wrap:anywhere}blockquote{margin:16px 0;padding:10px 16px;background:var(--soft);border-left:3px solid var(--blue)}
code{font:0.9em Consolas,monospace;background:#edf2f8;padding:2px 5px;border-radius:4px}
pre{background:#161b22;color:#e6edf3;padding:18px;border-radius:10px;overflow:auto}pre code{background:none;color:inherit;padding:0}
.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:9px 12px;text-align:left;border-bottom:1px solid var(--line)}
th{background:#f2f5fa}.tag{display:inline-block;background:var(--soft);color:var(--blue);border-radius:99px;padding:4px 10px;font-size:13px;font-weight:700}
.card{display:block;border:1px solid var(--line);border-radius:12px;padding:16px 20px;margin:12px 0;text-decoration:none;color:var(--fg)}
.card:hover{border-color:var(--blue);background:var(--soft)}.meta{color:var(--muted);font-size:13px}
@media(max-width:820px){.layout{grid-template-columns:1fr;padding:14px}aside{position:static;max-height:none}main{padding:24px 18px}}
@media print{body{background:#fff}.layout{display:block;padding:0}aside{display:none}main{border:0;padding:0}}
"""


def redact(value: str) -> str:
    for pattern in SECRET_PATTERNS:
        value = pattern.sub("***", value)
    return value


def inline(value: str) -> str:
    value = html.escape(value, quote=True)
    tick = chr(96)
    value = re.sub(re.escape(tick) + r"([^" + re.escape(tick) + r"]+)" + re.escape(tick),
                   lambda m: "<code>" + m.group(1) + "</code>", value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", value)

    def link(match: re.Match[str]) -> str:
        label, href = match.group(1), html.unescape(match.group(2))
        if not (href.startswith(("https://", "http://", "./", "../")) or
                (not href.startswith(("/", "#")) and ":" not in href)):
            return label
        return f'<a href="{html.escape(href, quote=True)}">{label}</a>'

    return re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link, value)


def render_markdown(source: str) -> tuple[str, list[tuple[str, str]]]:
    lines = redact(source).splitlines()
    out: list[str] = []
    toc: list[tuple[str, str]] = []
    index = 0
    pos = 0
    fence = chr(96) * 3
    while pos < len(lines):
        line = lines[pos].strip()
        if not line:
            pos += 1
            continue
        heading = re.match(r"^(#{1,3})\s+(.+)$", line)
        if heading:
            level, title = len(heading.group(1)), heading.group(2)
            index += 1
            anchor = f"section-{index}"
            out.append(f'<h{level} id="{anchor}">{inline(title)}</h{level}>')
            if level <= 2:
                toc.append((title, anchor))
            pos += 1
            continue
        if line.startswith(fence):
            pos += 1
            code: list[str] = []
            while pos < len(lines) and not lines[pos].strip().startswith(fence):
                code.append(lines[pos])
                pos += 1
            out.append("<pre><code>" + html.escape("\n".join(code)) + "</code></pre>")
            pos += 1
            continue
        if line.startswith("|"):
            rows: list[list[str]] = []
            while pos < len(lines) and lines[pos].strip().startswith("|"):
                cells = [part.strip() for part in lines[pos].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-{2,}:?", cell) for cell in cells):
                    rows.append(cells)
                pos += 1
            if rows:
                head = "<tr>" + "".join(f"<th>{inline(cell)}</th>" for cell in rows[0]) + "</tr>"
                body = "".join("<tr>" + "".join(f"<td>{inline(cell)}</td>" for cell in row) + "</tr>" for row in rows[1:])
                out.append(f'<div class="table-wrap"><table><thead>{head}</thead><tbody>{body}</tbody></table></div>')
            continue
        if line.startswith(("- ", "* ")):
            items: list[str] = []
            while pos < len(lines) and lines[pos].strip().startswith(("- ", "* ")):
                items.append("<li>" + inline(lines[pos].strip()[2:]) + "</li>")
                pos += 1
            out.append("<ul>" + "".join(items) + "</ul>")
            continue
        if line.startswith(">"):
            out.append("<blockquote>" + inline(line[1:].strip()) + "</blockquote>")
            pos += 1
            continue
        out.append("<p>" + inline(line) + "</p>")
        pos += 1
    return "\n".join(out), toc


def document(title: str, body: str, toc: list[tuple[str, str]]) -> str:
    navigation = "".join(f'<a href="#{anchor}">{html.escape(label)}</a>' for label, anchor in toc)
    return f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title><style>{CSS}</style></head>
<body><div class="layout"><aside><b>ltbot 产品档案</b><a href="index.html">返回需求时间线</a>{navigation}</aside>
<main><span class="tag">ltbot · 产品经理数字同事</span>{body}</main></div></body></html>"""


def main() -> None:
    sources = sorted(
        (path for path in REQUIREMENTS.glob("*.md") if path.name != "requirements-index.md"),
        key=lambda path: path.name,
        reverse=True,
    )
    if not sources:
        raise SystemExit("No requirement Markdown sources found")
    cards: list[str] = []
    for source in sources:
        markdown = source.read_text(encoding="utf-8")
        title_match = re.search(r"^#\s+(.+)$", markdown, re.MULTILINE)
        title = title_match.group(1) if title_match else source.stem
        body, toc = render_markdown(markdown)
        output = source.with_suffix(".html")
        output.write_text(document(title, body, toc), encoding="utf-8")
        date = source.stem[:10]
        cards.append(
            f'<a class="card" href="{html.escape(output.name, quote=True)}">'
            f'<strong>{html.escape(title)}</strong><br><span class="meta">{html.escape(date)} · '
            "来源记录；当前状态请看文档头部</span></a>"
        )
        print(f"OK: {output}")
    index_body = (
        '<h1>ltbot 需求时间线</h1><p>最新在前。需求方案是否已确认，请以单篇文档状态与评审记录为准。</p>'
        + "".join(cards)
        + '<p><a href="requirements-index.md">Markdown 速查索引</a></p>'
    )
    index_path = REQUIREMENTS / "index.html"
    index_path.write_text(document("ltbot 需求时间线", index_body, []), encoding="utf-8")
    print(f"OK: {index_path} ({len(sources)} records)")


if __name__ == "__main__":
    main()
