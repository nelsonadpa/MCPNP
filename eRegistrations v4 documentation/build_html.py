#!/usr/bin/env python3
"""
Convert eRegistrations v4 markdown documentation to a single HTML document
using the service-manual template styling.
"""

import markdown
import os
import re

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
HTML_OUTPUT = os.path.join(OUTPUT_DIR, "eRegistrations-v4-Documentation.html")

# Document order
DOCS = [
    "00-overview.md",
    "01-architecture.md",
    "02-installation.md",
    "03-deployment.md",
    "04-configuration.md",
    "05-security.md",
    "06-maintenance.md",
    "07-troubleshooting.md",
    "08-integration.md",
    "09-localization.md",
    "10-hosting.md",
]

# Chapter metadata
CHAPTERS = {
    "00-overview.md": {"num": "0", "title": "Platform Overview", "icon": "📋"},
    "01-architecture.md": {"num": "1", "title": "Architecture Reference", "icon": "🏗"},
    "02-installation.md": {"num": "2", "title": "Installation Guide", "icon": "⚙"},
    "03-deployment.md": {"num": "3", "title": "Deployment Guide", "icon": "🚀"},
    "04-configuration.md": {"num": "4", "title": "Configuration Reference", "icon": "🔧"},
    "05-security.md": {"num": "5", "title": "Security Guide", "icon": "🔒"},
    "06-maintenance.md": {"num": "6", "title": "Maintenance Guide", "icon": "🛠"},
    "07-troubleshooting.md": {"num": "7", "title": "Troubleshooting Guide", "icon": "🔍"},
    "08-integration.md": {"num": "8", "title": "Integration & GDB API", "icon": "🔗"},
    "09-localization.md": {"num": "9", "title": "Localization Guide", "icon": "🌐"},
    "10-hosting.md": {"num": "10", "title": "Hosting Requirements", "icon": "🖥"},
}


def read_markdown(filename):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def process_markdown(md_text):
    """Convert markdown to HTML with enhancements."""
    # Convert > **Note** / > **Tip** / > **Warning** / > **Troubleshooting** blockquotes to styled boxes
    # First pass: convert blockquotes to special markers
    lines = md_text.split("\n")
    processed = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Detect blockquote blocks
        if line.startswith("> "):
            block_lines = []
            while i < len(lines) and (lines[i].startswith("> ") or lines[i].startswith(">")):
                block_lines.append(lines[i].lstrip("> ").rstrip())
                i += 1
            block_text = " ".join(block_lines).strip()

            # Determine box type
            box_class = "note-box"
            if block_text.startswith("**Note**:") or block_text.startswith("**Note:**"):
                block_text = block_text.replace("**Note**:", "", 1).replace("**Note:**", "", 1).strip()
                box_class = "note-box"
            elif block_text.startswith("**WARNING**:") or block_text.startswith("**WARNING:**"):
                block_text = block_text.replace("**WARNING**:", "", 1).replace("**WARNING:**", "", 1).strip()
                box_class = "warning-box"
            elif block_text.startswith("**Tip**:") or block_text.startswith("**Tip:**"):
                block_text = block_text.replace("**Tip**:", "", 1).replace("**Tip:**", "", 1).strip()
                box_class = "tip-box"
            elif block_text.startswith("**Important**:") or block_text.startswith("**Important:**"):
                block_text = block_text.replace("**Important**:", "", 1).replace("**Important:**", "", 1).strip()
                box_class = "warning-box"
            elif block_text.startswith("**Troubleshooting**:") or block_text.startswith("**Troubleshooting:**"):
                block_text = block_text.replace("**Troubleshooting**:", "", 1).replace("**Troubleshooting:**", "", 1).strip()
                box_class = "note-box"
            elif block_text.startswith("**Recommendation**:") or block_text.startswith("**Recommendation:**"):
                block_text = block_text.replace("**Recommendation**:", "", 1).replace("**Recommendation:**", "", 1).strip()
                box_class = "tip-box"
            elif block_text.startswith("**Renewal note**:") or block_text.startswith("**Renewal note:**"):
                block_text = block_text.replace("**Renewal note**:", "", 1).replace("**Renewal note:**", "", 1).strip()
                box_class = "note-box"

            # Convert inline markdown in block text
            block_html = markdown.markdown(block_text, extensions=["tables", "fenced_code"])
            processed.append(f'<div class="{box_class}">{block_html}</div>')
            processed.append("")
        else:
            processed.append(line)
            i += 1

    md_text = "\n".join(processed)

    # Convert markdown to HTML
    html = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "codehilite", "toc", "attr_list"],
        extension_configs={
            "codehilite": {"css_class": "code-block", "guess_lang": False},
        }
    )

    # Post-process: style tables
    html = html.replace("<table>", '<table class="data-table">')

    # Post-process: style code blocks with pre
    html = re.sub(
        r'<pre><code[^>]*>',
        '<pre class="code-pre"><code>',
        html
    )

    # Post-process: convert checklist items
    html = html.replace(
        '<li>[ ]',
        '<li class="checklist-item"><span class="check-box">☐</span>'
    )
    html = html.replace(
        '<li>[x]',
        '<li class="checklist-item checked"><span class="check-box">☑</span>'
    )

    return html


def build_toc():
    """Build table of contents HTML."""
    toc_items = []
    for doc in DOCS:
        ch = CHAPTERS[doc]
        anchor = f"chapter-{ch['num']}"
        toc_items.append(
            f'<li><a href="#{anchor}">'
            f'<span class="toc-num">{ch["num"]}.</span> '
            f'{ch["title"]}</a></li>'
        )
    return "\n".join(toc_items)


def build_chapter(filename):
    """Build a chapter section HTML."""
    ch = CHAPTERS[filename]
    anchor = f"chapter-{ch['num']}"
    md_text = read_markdown(filename)

    # Remove the first H1 line (we'll use our own header)
    lines = md_text.split("\n")
    if lines and lines[0].startswith("# "):
        lines = lines[1:]
    md_text = "\n".join(lines)

    # Remove metadata lines at top (Version, Audience, etc.) and horizontal rules
    clean_lines = []
    skip_meta = True
    for line in md_text.split("\n"):
        if skip_meta:
            if line.startswith("**") and (":" in line) and any(kw in line.lower() for kw in ["version", "audience", "prerequisite", "status", "purpose"]):
                continue
            elif line.strip() == "---":
                skip_meta = False
                continue
            elif line.strip() == "":
                continue
            else:
                skip_meta = False
        clean_lines.append(line)
    md_text = "\n".join(clean_lines)

    # Remove navigation footer (Previous/Next links)
    md_text = re.sub(r'\n\*Previous:.*$', '', md_text, flags=re.MULTILINE)
    md_text = re.sub(r'\n\*Next:.*$', '', md_text, flags=re.MULTILINE)

    content_html = process_markdown(md_text)

    return f'''
    <h2 class="section-title" id="{anchor}">
        Chapter {ch["num"]} — {ch["title"]}
    </h2>
    <div class="chapter-content">
        {content_html}
    </div>
    <hr class="section-divider">
    '''


def build_html():
    chapters_html = "\n".join(build_chapter(doc) for doc in DOCS)
    toc_html = build_toc()

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>eRegistrations v4 — Technical Documentation</title>
    <style>
        /* ========== BASE STYLES ========== */
        :root {{
            --primary: #0d6efd;
            --primary-dark: #0a58ca;
            --secondary: #6c757d;
            --success: #198754;
            --warning: #ffc107;
            --danger: #dc3545;
            --info: #0dcaf0;
            --light: #f8f9fa;
            --dark: #212529;
            --border: #dee2e6;
            --bg-body: #ffffff;
            --text: #333333;
            --text-muted: #6c757d;
            --shadow: 0 2px 8px rgba(0,0,0,0.08);
            --radius: 8px;
        }}

        * {{ box-sizing: border-box; margin: 0; padding: 0; }}

        body {{
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            color: var(--text);
            background: #f5f7fa;
            font-size: 16px;
        }}

        /* ========== HEADER ========== */
        .site-header {{
            background: linear-gradient(135deg, #003893 0%, #0d6efd 50%, #003893 100%);
            color: white;
            padding: 2.5rem 1rem 2rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }}
        .site-header::before {{
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 50%);
        }}
        .header-content {{
            position: relative;
            max-width: 900px;
            margin: 0 auto;
        }}
        .header-badge {{
            display: inline-block;
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 20px;
            padding: 0.3rem 1rem;
            font-size: 0.85rem;
            margin-bottom: 1rem;
            letter-spacing: 0.5px;
        }}
        .site-header h1 {{
            font-size: 2.2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }}
        .site-header .subtitle {{
            font-size: 1.1rem;
            opacity: 0.9;
            margin-bottom: 0.3rem;
        }}
        .site-header .institution {{
            font-size: 0.95rem;
            opacity: 0.75;
        }}

        /* ========== MAIN CONTAINER ========== */
        .container {{
            max-width: 960px;
            margin: 0 auto;
            padding: 0 1.5rem;
        }}
        .main-content {{
            background: white;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            margin: -1.5rem auto 2rem;
            padding: 2.5rem 2.5rem 3rem;
            position: relative;
        }}

        /* ========== TABLE OF CONTENTS ========== */
        .toc {{
            background: var(--light);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem 2rem;
            margin-bottom: 2.5rem;
        }}
        .toc h2 {{
            font-size: 1.25rem;
            margin-bottom: 1rem;
            color: var(--primary-dark);
            border-bottom: 2px solid var(--primary);
            padding-bottom: 0.5rem;
            display: inline-block;
        }}
        .toc ol {{
            padding-left: 1.5rem;
            list-style: none;
            counter-reset: toc-counter;
        }}
        .toc li {{
            margin-bottom: 0.5rem;
        }}
        .toc a {{
            color: var(--primary);
            text-decoration: none;
            font-weight: 500;
            font-size: 1.05rem;
        }}
        .toc a:hover {{
            text-decoration: underline;
            color: var(--primary-dark);
        }}
        .toc-num {{
            display: inline-block;
            min-width: 2rem;
            font-weight: 700;
            color: var(--primary-dark);
        }}

        /* ========== HEADINGS ========== */
        h2.section-title {{
            font-size: 1.6rem;
            color: var(--primary-dark);
            margin: 2.5rem 0 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 3px solid var(--primary);
        }}
        .chapter-content h2 {{
            font-size: 1.4rem;
            color: var(--primary-dark);
            margin: 2rem 0 0.75rem;
            padding-bottom: 0.4rem;
            border-bottom: 2px solid var(--border);
        }}
        h3, .chapter-content h3 {{
            font-size: 1.2rem;
            color: var(--dark);
            margin: 1.8rem 0 0.75rem;
        }}
        h4, .chapter-content h4 {{
            font-size: 1.05rem;
            color: var(--secondary);
            margin: 1.5rem 0 0.5rem;
        }}

        /* ========== TEXT ========== */
        p {{ margin-bottom: 1rem; }}
        strong {{ font-weight: 600; }}
        ul, ol {{ margin-bottom: 1rem; padding-left: 1.5rem; }}
        li {{ margin-bottom: 0.35rem; }}

        /* ========== INFO BOXES ========== */
        .tip-box, .warning-box, .note-box, .example-box {{
            border-radius: var(--radius);
            padding: 1rem 1.25rem;
            margin: 1.25rem 0;
            font-size: 0.95rem;
            line-height: 1.6;
        }}
        .tip-box {{
            background: #d1e7dd;
            border-left: 4px solid var(--success);
            color: #0f5132;
        }}
        .tip-box::before {{ content: 'Tip: '; font-weight: 700; }}
        .warning-box {{
            background: #fff3cd;
            border-left: 4px solid var(--warning);
            color: #664d03;
        }}
        .warning-box::before {{ content: 'Warning: '; font-weight: 700; }}
        .note-box {{
            background: #cff4fc;
            border-left: 4px solid var(--info);
            color: #055160;
        }}
        .note-box::before {{ content: 'Note: '; font-weight: 700; }}
        .example-box {{
            background: #e8e0f3;
            border-left: 4px solid #7c3aed;
            color: #3b1d6e;
        }}
        .example-box::before {{ content: 'Example: '; font-weight: 700; }}

        /* Nested elements in info boxes */
        .tip-box p, .warning-box p, .note-box p, .example-box p {{
            margin-bottom: 0.5rem;
            display: inline;
        }}
        .tip-box p:last-child, .warning-box p:last-child, .note-box p:last-child {{
            margin-bottom: 0;
        }}
        .tip-box code, .warning-box code, .note-box code, .example-box code {{
            background: rgba(0,0,0,0.08);
            padding: 0.1rem 0.3rem;
            border-radius: 3px;
            font-size: 0.88rem;
        }}

        /* ========== TABLES ========== */
        .data-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            font-size: 0.95rem;
        }}
        .data-table th {{
            background: var(--primary);
            color: white;
            padding: 0.65rem 1rem;
            text-align: left;
            font-weight: 600;
        }}
        .data-table td {{
            border: 1px solid var(--border);
            padding: 0.6rem 1rem;
        }}
        .data-table tr:nth-child(even) td {{
            background: var(--light);
        }}
        .data-table tr:hover td {{
            background: #e7f1ff;
        }}

        /* ========== CODE BLOCKS ========== */
        pre.code-pre {{
            background: #1e1e2e;
            color: #cdd6f4;
            border-radius: var(--radius);
            padding: 1.25rem 1.5rem;
            margin: 1rem 0;
            overflow-x: auto;
            font-size: 0.88rem;
            line-height: 1.5;
            border: 1px solid #313244;
        }}
        pre.code-pre code {{
            background: none;
            color: inherit;
            padding: 0;
            font-size: inherit;
        }}
        code {{
            background: #e9ecef;
            color: #d63384;
            padding: 0.15rem 0.4rem;
            border-radius: 3px;
            font-size: 0.9rem;
            font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
        }}

        /* ========== PLAIN PRE BLOCKS (ASCII art/diagrams) ========== */
        pre:not(.code-pre) {{
            background: #f8f9fa;
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.25rem 1.5rem;
            margin: 1rem 0;
            overflow-x: auto;
            font-size: 0.82rem;
            line-height: 1.4;
            font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
            color: var(--dark);
        }}

        /* ========== CHECKLIST ========== */
        .checklist-item {{
            list-style: none;
            padding-left: 0.25rem;
        }}
        .check-box {{
            color: var(--primary);
            font-size: 1.1rem;
            margin-right: 0.5rem;
        }}
        .checklist-item.checked .check-box {{
            color: var(--success);
        }}

        /* ========== SECTION DIVIDER ========== */
        .section-divider {{
            border: none;
            border-top: 2px solid var(--border);
            margin: 2rem 0;
        }}
        hr {{
            border: none;
            border-top: 1px solid var(--border);
            margin: 1.5rem 0;
        }}

        /* ========== CHAPTER NAV (top link) ========== */
        .back-to-top {{
            display: inline-block;
            margin-top: 1rem;
            color: var(--primary);
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
        }}
        .back-to-top:hover {{
            text-decoration: underline;
        }}

        /* ========== FOOTER ========== */
        .site-footer {{
            text-align: center;
            padding: 2rem 1rem;
            color: var(--text-muted);
            font-size: 0.85rem;
        }}
        .site-footer a {{
            color: var(--primary);
            text-decoration: none;
        }}

        /* ========== STATS BAR ========== */
        .stats-bar {{
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
            margin: 1.5rem 0 0;
        }}
        .stat-item {{
            text-align: center;
        }}
        .stat-value {{
            font-size: 1.8rem;
            font-weight: 700;
            display: block;
        }}
        .stat-label {{
            font-size: 0.8rem;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}

        /* ========== PRINT STYLES ========== */
        @media print {{
            body {{ background: white; font-size: 10pt; }}
            .site-header {{
                background: #003893 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                padding: 1.5rem 1rem;
            }}
            .main-content {{ box-shadow: none; margin-top: 0; padding: 1rem; }}
            .toc {{ page-break-after: always; }}
            .tip-box, .warning-box, .note-box, .example-box {{ page-break-inside: avoid; }}
            h2.section-title {{ page-break-before: always; }}
            h2.section-title:first-of-type {{ page-break-before: auto; }}
            pre {{ white-space: pre-wrap; word-wrap: break-word; }}
            .data-table {{ font-size: 9pt; }}
            .data-table th {{
                background: #003893 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }}
            .back-to-top {{ display: none; }}
        }}

        /* ========== RESPONSIVE ========== */
        @media (max-width: 768px) {{
            .site-header h1 {{ font-size: 1.6rem; }}
            .main-content {{ padding: 1.5rem 1rem; margin: -1rem 0.5rem 1rem; }}
            .container {{ padding: 0 0.5rem; }}
            .data-table {{ font-size: 0.85rem; }}
            .data-table th, .data-table td {{ padding: 0.4rem 0.5rem; }}
            h2.section-title {{ font-size: 1.3rem; }}
            .toc {{ padding: 1rem; }}
            pre {{ font-size: 0.78rem; }}
            .stats-bar {{ gap: 1rem; }}
            .stat-value {{ font-size: 1.4rem; }}
        }}

        @media (max-width: 480px) {{
            .site-header h1 {{ font-size: 1.3rem; }}
            .site-header .subtitle {{ font-size: 0.95rem; }}
        }}

        /* ========== SMOOTH SCROLL ========== */
        html {{ scroll-behavior: smooth; }}
    </style>
</head>
<body>

<!-- ==================== HEADER ==================== -->
<header class="site-header">
    <div class="header-content">
        <div class="header-badge">UNCTAD &mdash; eRegistrations</div>
        <h1>eRegistrations v4</h1>
        <p class="subtitle">Technical Documentation &mdash; Complete Reference</p>
        <p class="institution">No-Code Platform for Digital Government Services</p>
        <div class="stats-bar">
            <div class="stat-item">
                <span class="stat-value">11</span>
                <span class="stat-label">Chapters</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">3</span>
                <span class="stat-label">Subsystems</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">15+</span>
                <span class="stat-label">Microservices</span>
            </div>
        </div>
    </div>
</header>

<div class="container">
<main class="main-content">

<!-- ==================== TABLE OF CONTENTS ==================== -->
<nav class="toc" id="toc">
    <h2>Table of Contents</h2>
    <ol>
        {toc_html}
    </ol>
</nav>

<!-- ==================== CHAPTERS ==================== -->
{chapters_html}

<!-- ==================== FOOTER ==================== -->
<footer style="text-align: center; padding: 2rem 0 1rem; color: #6c757d; font-size: 0.85rem; border-top: 2px solid #dee2e6; margin-top: 2rem;">
    <p><strong>eRegistrations v4 Technical Documentation</strong></p>
    <p>Version 4.0 &mdash; Generated from source documentation</p>
    <p style="margin-top: 0.5rem;">UNCTAD &mdash; United Nations Conference on Trade and Development</p>
</footer>

</main>
</div>

<footer class="site-footer">
    <p>eRegistrations is an open-source platform by <a href="https://unctad.org" target="_blank">UNCTAD</a></p>
</footer>

</body>
</html>'''

    with open(HTML_OUTPUT, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"HTML written to: {HTML_OUTPUT}")
    size_kb = os.path.getsize(HTML_OUTPUT) / 1024
    print(f"File size: {size_kb:.0f} KB")


if __name__ == "__main__":
    build_html()
