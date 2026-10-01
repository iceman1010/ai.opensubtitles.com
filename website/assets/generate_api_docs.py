#!/usr/bin/env python3
"""Generate the F3 content template for the /api-docs page.

Reads opensubtitles_openapi.json (single source of truth, this folder)
and writes the content template website/ui/base/api.html which is
rendered inside the site layout by Controllers\\ApiDocs.

Stdlib only. Re-run after every change to the JSON, then clear the F3
cache (php website/tests/clear_f3_cache.php):
    python3 website/assets/generate_api_docs.py
"""

import json
import re
import sys
import xml.etree.ElementTree as ET
from html import escape
from pathlib import Path

HERE = Path(__file__).resolve().parent
IN_PATH = HERE / "opensubtitles_openapi.json"
OUT_PATH = HERE.parent / "ui" / "base" / "api.html"

METHODS = ("get", "post", "put", "delete", "patch")
HTTP = re.compile(r"^https?://")
LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
INTERNAL_LINK = re.compile(r"^.*?/paths/(.+)/([^/]+)$")
MAX_ENUM = 12


def esc(value):
    out = escape(str(value), quote=True)
    return out.replace("{{", "&#123;&#123;").replace("}}", "&#125;&#125;")


def slug_for(method, path, used):
    base = "op-" + method + re.sub(r"[^a-z0-9]+", "-", path.lower()).strip("-")
    slug, n = base, 2
    while slug in used:
        slug = f"{base}-{n}"
        n += 1
    used.add(slug)
    return slug


def resolve_internal(target, slugs):
    m = INTERNAL_LINK.match(target)
    if not m:
        return None
    path = m.group(1).replace("~1", "/").replace("~0", "~")
    return slugs.get((m.group(2).lower(), path))


def md_inline(text, slugs):
    if not text:
        return ""
    s = esc(text)
    s = re.sub(r"`+([^`]+)`+", r"<code>\1</code>", s)
    s = LINK.sub(lambda m: link_md(m, slugs), s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    return s.replace("\n", "<br/>")


def link_md(m, slugs):
    text, target = m.group(1), m.group(2)
    if HTTP.match(target):
        return f'<a href="{esc(target)}">{text}</a>'
    anchor = resolve_internal(target, slugs)
    if anchor:
        return f'<a href="#{anchor}">{text}</a>'
    return text


def md_blocks(text, slugs):
    if not text:
        return ""
    paras = re.split(r"\n\s*\n", str(text).strip())
    return "".join(f"<p>{md_inline(p, slugs)}</p>" for p in paras if p.strip())


def schema_type(schema):
    if not isinstance(schema, dict):
        return "any"
    t = schema.get("type")
    if t == "array":
        return "array of " + (schema_type(schema.get("items", {})) or "any")
    if "enum" in schema and schema["enum"]:
        vals = schema["enum"]
        shown = " | ".join(str(v) for v in vals[:MAX_ENUM])
        if len(vals) > MAX_ENUM:
            shown += f" …(+{len(vals) - MAX_ENUM} more)"
        return f"{t or 'any'}: {shown}"
    if t == "object" and schema.get("properties"):
        props = list(schema["properties"])
        more = "…" if len(props) > 8 else ""
        return "object (" + ", ".join(props[:8]) + more + ")"
    out = t or "any"
    if schema.get("format"):
        out += f" ({schema['format']})"
    return out


def schema_block(schema, label):
    if not schema:
        return ""
    body = esc(json.dumps(schema, indent=2, ensure_ascii=False))
    return (
        f'<details class="api-schema"><summary>{esc(label)}'
        f' <span class="api-type">{esc(schema_type(schema))}</span></summary>'
        f'<pre class="api-json">{body}</pre></details>'
    )


def example_block(media, label):
    ex = media.get("example")
    if ex is None:
        return ""
    body = ex if isinstance(ex, str) else json.dumps(ex, indent=2, ensure_ascii=False)
    return (
        f'<details class="api-example" open="open"><summary>{esc(label)}</summary>'
        f'<pre class="api-json">{esc(body)}</pre></details>'
    )


def default_note(schema):
    notes = []
    if "default" in schema:
        notes.append("Default: " + json.dumps(schema["default"], ensure_ascii=False))
    if schema.get("example") is not None:
        notes.append("Example: " + json.dumps(schema["example"], ensure_ascii=False))
    if not notes:
        return ""
    return "<br/>" + "<br/>".join(esc(n) for n in notes)


def param_table(op, path_item, slugs):
    params = list(path_item.get("parameters") or []) + list(op.get("parameters") or [])
    if not params:
        return ""
    rows = []
    for p in params:
        schema = p.get("schema") or {}
        cells = [
            f'<code>{esc(p.get("name", ""))}</code>',
            esc(p.get("in", "")),
            esc(schema_type(schema)),
            "yes" if p.get("required") else "—",
            md_inline(p.get("description"), slugs) + default_note(schema),
        ]
        rows.append("<tr>" + "".join(f"<td>{c}</td>" for c in cells) + "</tr>")
    return (
        '<table class="api-table"><thead><tr><th>Name</th><th>In</th><th>Type</th>'
        "<th>Required</th><th>Description</th></tr></thead>"
        f"<tbody>{''.join(rows)}</tbody></table>"
    )


def security_line(op, spec):
    sec = op.get("security", spec.get("security"))
    if sec is None:
        sec = []
    if not sec:
        return '<span class="api-chip">none</span>'
    chips = []
    for entry in sec:
        names = list(entry.keys())
        inner = " or ".join(f"<code>{esc(n)}</code>" for n in names) or "any"
        chips.append(f'<span class="api-chip">{inner}</span>')
    return " or ".join(chips)


def render_request_body(op, slugs):
    rb = op.get("requestBody")
    if not rb:
        return ""
    out = [
        '<h4 class="api-sub">Request body'
        + (' <span class="api-required">required</span>' if rb.get("required") else "")
        + "</h4>"
    ]
    for ct, media in (rb.get("content") or {}).items():
        out.append(f'<p class="api-ct"><code>{esc(ct)}</code></p>')
        out.append(schema_block(media.get("schema"), "Schema"))
        out.append(example_block(media, "Example"))
    return "".join(out)


def render_responses(op, slugs):
    responses = op.get("responses") or {}
    if not responses:
        return ""
    out = ['<h4 class="api-sub">Responses</h4>']
    for code in sorted(responses):
        r = responses[code]
        out.append(
            '<div class="api-resp"><p class="api-resp-line">'
            f'<span class="api-code">{esc(code)}</span> {md_inline(r.get("description"), slugs)}</p>'
        )
        for ct, media in (r.get("content") or {}).items():
            out.append(f'<p class="api-ct"><code>{esc(ct)}</code></p>')
            out.append(schema_block(media.get("schema"), "Response schema"))
            out.append(example_block(media, "Response example"))
        out.append("</div>")
    return "".join(out)


def render_op(method, path, op, path_item, spec, slugs):
    out = [f'<article class="api-op" id="{slugs[(method, path)]}">']
    head = (
        f'<h3><span class="api-method m-{method}">{method.upper()}</span>'
        f' <code class="api-path">{esc(path)}</code>'
    )
    if op.get("summary"):
        head += f' <span class="api-summary">{esc(op["summary"])}</span>'
    out.append(head + "</h3>")
    desc = md_blocks(op.get("description"), slugs)
    if desc:
        out.append(f'<div class="api-desc">{desc}</div>')
    out.append(f'<p class="api-auth">Auth: {security_line(op, spec)}</p>')
    out.append(param_table(op, path_item, slugs))
    out.append(render_request_body(op, slugs))
    out.append(render_responses(op, slugs))
    out.append("</article>")
    return "".join(out)


def render_meta(spec, slugs):
    info = spec.get("info", {})
    out = [
        '<div class="api-meta">',
        f'<p><strong>{esc(info.get("title", "API"))}</strong>'
        f' <span class="api-type">v{esc(info.get("version", "?"))}</span></p>',
    ]
    desc = md_inline(info.get("description"), slugs)
    if desc:
        out.append(f"<p>{desc}</p>")
    servers = spec.get("servers") or []
    if servers:
        out.append("<p>Servers:</p>")
        rows = "".join(
            f"<tr><td><code>{esc(s.get('url', ''))}</code></td><td>{esc(s.get('description', ''))}</td></tr>"
            for s in servers
        )
        out.append(
            '<table class="api-table"><tbody>' + rows + "</tbody></table>"
        )
    schemes = (spec.get("components") or {}).get("securitySchemes") or {}
    if schemes:
        out.append("<p>Authentication:</p>")
        items = "".join(
            "<li><code>" + esc(name) + "</code>"
            + (f' <span class="api-type">({esc(s.get("in", ""))})</span>' if s.get("in") else "")
            + (
                f": {md_inline(s.get('description'), slugs)}"
                if s.get("description")
                else ""
            )
            + "</li>"
            for name, s in schemes.items()
        )
        out.append(f"<ul>{items}</ul>")
    out.append("</div>")
    return "".join(out)


def render_overview(tag_order, ops_by_tag, slugs):
    rows = []
    for tag in tag_order:
        for method, path, op, _item in ops_by_tag.get(tag, []):
            summary = esc(op.get("summary") or "")
            rows.append(
                "<tr>"
                + f'<td><span class="api-method m-{method}">{method.upper()}</span></td>'
                + f'<td><a href="#{slugs[(method, path)]}"><code>{esc(path)}</code></a></td>'
                + f"<td>{summary}</td>"
                + "</tr>"
            )
    return (
        '<h2 class="api-h2">Endpoints</h2>'
        '<table class="api-table api-overview"><thead><tr><th>Method</th><th>Path</th>'
        f"<th>Summary</th></tr></thead><tbody>{''.join(rows)}</tbody></table>"
    )


def build(spec):
    used = set()
    slugs = {}
    ops_by_tag = {}
    for path, item in spec.get("paths", {}).items():
        for method in METHODS:
            if method not in item:
                continue
            op = item[method]
            slug = slug_for(method, path, used)
            slugs[(method, path)] = slug
            for tag in op.get("tags") or ["Other"]:
                ops_by_tag.setdefault(tag, []).append((method, path, op, item))

    tag_order = [t.get("name") for t in spec.get("tags", [])]
    tag_order += [t for t in ops_by_tag if t not in tag_order]

    parts = [
        "<section class=\"page-head\">\n"
        "\t<h1>{{ @apidocs.h1 }}</h1>\n"
        "\t<p class=\"lead\">{{ @apidocs.lead }}</p>\n"
        "</section>\n"
        '<section class="api-docs">'
    ]
    parts.append(render_meta(spec, slugs))
    parts.append(render_overview(tag_order, ops_by_tag, slugs))
    for tag in tag_order:
        ops = ops_by_tag.get(tag)
        if not ops:
            continue
        parts.append(f'<div class="api-tag"><h2 class="api-h2">{esc(tag)}</h2>')
        for method, path, op, item in ops:
            parts.append(render_op(method, path, op, item, spec, slugs))
        parts.append("</div>")
    parts.append("</section>")
    return "".join(parts), {
        "ops": len(slugs),
        "tags": len([t for t in tag_order if ops_by_tag.get(t)]),
    }


def validate(page, stats):
    n_tokens = page.count("{{")
    if n_tokens != 2:
        sys.exit(f"FATAL: expected exactly 2 F3 tokens in output, found {n_tokens}")
    for href in re.findall(r'href="#([^"]+)"', page):
        if f'id="{href}"' not in page:
            sys.exit(f"FATAL: broken internal anchor #{href}")
    try:
        ET.fromstring("<root>" + page + "</root>")
    except ET.ParseError as e:
        sys.exit(f"FATAL: generated markup is not well-formed XML: {e}")


def main():
    spec = json.loads(IN_PATH.read_text(encoding="utf-8"))
    page, stats = build(spec)
    validate(page, stats)
    OUT_PATH.write_text(page, encoding="utf-8")
    print(
        f"Wrote {OUT_PATH} ({OUT_PATH.stat().st_size} bytes): "
        f"{stats['ops']} operations in {stats['tags']} tags"
    )


if __name__ == "__main__":
    main()
