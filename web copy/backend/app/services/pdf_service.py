from __future__ import annotations
import io
from weasyprint import HTML, CSS


CV_STYLES = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 10pt;
  color: #1a1a2e;
  line-height: 1.5;
}
.cv-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20mm 18mm;
}
.header { margin-bottom: 16pt; }
.header h1 {
  font-size: 22pt;
  font-weight: 700;
  color: #0f3460;
  letter-spacing: -0.5px;
}
.header .subtitle {
  font-size: 11pt;
  color: #4a5568;
  margin-top: 2pt;
}
.contact-row {
  display: flex;
  gap: 12pt;
  font-size: 9pt;
  color: #4a5568;
  margin-top: 6pt;
  flex-wrap: wrap;
}
.section { margin-bottom: 14pt; }
.section-title {
  font-size: 11pt;
  font-weight: 700;
  color: #0f3460;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1.5pt solid #0f3460;
  padding-bottom: 3pt;
  margin-bottom: 8pt;
}
.entry { margin-bottom: 8pt; }
.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.entry-title {
  font-weight: 600;
  font-size: 10.5pt;
  color: #1a1a2e;
}
.entry-subtitle {
  font-size: 9.5pt;
  color: #4a5568;
}
.entry-date {
  font-size: 9pt;
  color: #718096;
  white-space: nowrap;
  flex-shrink: 0;
}
ul.bullets {
  margin-top: 4pt;
  margin-left: 12pt;
  list-style-type: disc;
}
ul.bullets li {
  font-size: 9.5pt;
  color: #2d3748;
  margin-bottom: 2pt;
  line-height: 1.4;
}
.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4pt;
}
.skill-tag {
  background: #eef2ff;
  color: #3730a3;
  padding: 2pt 7pt;
  border-radius: 10pt;
  font-size: 8.5pt;
  font-weight: 500;
}
.profile-text {
  font-size: 10pt;
  color: #374151;
  line-height: 1.6;
}
@page {
  size: A4;
  margin: 0;
}
"""

COVER_LETTER_STYLES = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Inter', sans-serif;
  font-size: 11pt;
  color: #1a1a2e;
  line-height: 1.7;
}
.container {
  max-width: 760px;
  margin: 0 auto;
  padding: 25mm 20mm;
}
.sender { margin-bottom: 20pt; }
.sender h2 { font-size: 16pt; font-weight: 700; color: #0f3460; }
.sender p { font-size: 10pt; color: #4a5568; }
.date { font-size: 10pt; color: #4a5568; margin: 16pt 0; }
.recipient { margin-bottom: 16pt; }
.recipient p { font-size: 10pt; line-height: 1.5; }
h1.subject {
  font-size: 13pt;
  font-weight: 700;
  color: #0f3460;
  margin-bottom: 16pt;
}
.body p { margin-bottom: 12pt; font-size: 11pt; }
.signature { margin-top: 24pt; }
.signature p { font-size: 10.5pt; }
@page { size: A4; margin: 0; }
"""


def html_to_pdf(html_content: str, css_extra: str = "") -> bytes:
    full_css = (CV_STYLES if "cv-container" in html_content else COVER_LETTER_STYLES) + css_extra
    buf = io.BytesIO()
    HTML(string=html_content).write_pdf(
        buf,
        stylesheets=[CSS(string=full_css)],
    )
    return buf.getvalue()
