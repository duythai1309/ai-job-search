from __future__ import annotations
from datetime import datetime
from typing import Optional


def build_cv_html(cv: dict, profile: dict) -> str:
    name = profile.get("full_name", "Họ và Tên")
    location = profile.get("location", "")
    phone = profile.get("phone", "")
    email = profile.get("email", "")
    linkedin = profile.get("linkedin_url", "")

    contacts = []
    if email:
        contacts.append(email)
    if phone:
        contacts.append(phone)
    if location:
        contacts.append(location)
    if linkedin:
        contacts.append(linkedin.replace("https://", "").replace("http://", ""))

    target_role = cv.get("target_role", "")
    profile_statement = cv.get("profile_statement", "")
    sections = cv.get("sections", [])

    html = f"""<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>{name} – CV</title></head>
<body>
<div class="cv-container">
  <div class="header">
    <h1>{name}</h1>
    {f'<div class="subtitle">{target_role}</div>' if target_role else ''}
    <div class="contact-row">
      {'  |  '.join(f'<span>{c}</span>' for c in contacts)}
    </div>
  </div>
"""

    if profile_statement:
        html += f"""
  <div class="section">
    <div class="section-title">Mục tiêu nghề nghiệp</div>
    <p class="profile-text">{profile_statement}</p>
  </div>
"""

    for section in sorted(sections, key=lambda s: s.get("sort_order", 0)):
        section_type = section.get("type", "")
        html += _render_section(section_type, section)

    html += "</div></body></html>"
    return html


def _render_section(section_type: str, section: dict) -> str:
    title = section.get("title", "")
    content = section.get("content", {})

    if section_type == "experience":
        return _render_experience_section(title, content)
    elif section_type == "education":
        return _render_education_section(title, content)
    elif section_type == "skills":
        return _render_skills_section(title, content)
    elif section_type == "custom":
        return _render_custom_section(title, content)
    return ""


def _render_experience_section(title: str, content) -> str:
    items = content if isinstance(content, list) else []
    if not items:
        return ""

    html = f'<div class="section"><div class="section-title">{title}</div>'
    for item in items:
        start = item.get("start_date", "")
        end = "Hiện tại" if item.get("is_current") else item.get("end_date", "")
        date_str = f"{start} – {end}" if start or end else ""
        responsibilities = item.get("responsibilities", [])
        achievements = item.get("achievements", [])
        all_bullets = responsibilities + achievements

        html += f"""
  <div class="entry">
    <div class="entry-header">
      <div>
        <div class="entry-title">{item.get("job_title", "")}</div>
        <div class="entry-subtitle">{item.get("company", "")}{'  ·  ' + item.get("location", "") if item.get("location") else ""}</div>
      </div>
      <div class="entry-date">{date_str}</div>
    </div>
    {_render_bullets(all_bullets)}
  </div>"""

    return html + "</div>"


def _render_education_section(title: str, content) -> str:
    items = content if isinstance(content, list) else []
    if not items:
        return ""

    html = f'<div class="section"><div class="section-title">{title}</div>'
    for item in items:
        start = item.get("start_year", "")
        end = item.get("end_year", "")
        date_str = f"{start} – {end}" if start or end else ""
        highlights = item.get("highlights", [])

        html += f"""
  <div class="entry">
    <div class="entry-header">
      <div>
        <div class="entry-title">{item.get("degree", "")} {item.get("field", "")}</div>
        <div class="entry-subtitle">{item.get("institution", "")}{'  ·  GPA: ' + str(item.get("gpa")) if item.get("gpa") else ""}</div>
      </div>
      <div class="entry-date">{date_str}</div>
    </div>
    {f'<p class="profile-text" style="font-size:9pt;margin-top:3pt;">Luận văn: {item.get("thesis")}</p>' if item.get("thesis") else ""}
    {_render_bullets(highlights)}
  </div>"""

    return html + "</div>"


def _render_skills_section(title: str, content) -> str:
    items = content if isinstance(content, list) else []
    if not items:
        return ""

    groups: dict[str, list[str]] = {}
    for skill in items:
        cat = skill.get("category", "primary")
        groups.setdefault(cat, []).append(skill.get("name", ""))

    cat_labels = {
        "primary": "Kỹ năng chính",
        "secondary": "Kỹ năng phụ",
        "domain": "Chuyên môn",
        "tool": "Công cụ",
    }

    html = f'<div class="section"><div class="section-title">{title}</div>'
    for cat, skills in groups.items():
        label = cat_labels.get(cat, cat.title())
        tags = "".join(f'<span class="skill-tag">{s}</span>' for s in skills)
        html += f"""
  <div class="entry" style="margin-bottom:6pt;">
    <div class="entry-subtitle" style="margin-bottom:4pt;">{label}</div>
    <div class="skills-grid">{tags}</div>
  </div>"""

    return html + "</div>"


def _render_custom_section(title: str, content) -> str:
    text = content.get("text", "") if isinstance(content, dict) else str(content)
    if not text:
        return ""
    return f'<div class="section"><div class="section-title">{title}</div><p class="profile-text">{text}</p></div>'


def _render_bullets(items: list[str]) -> str:
    if not items:
        return ""
    lis = "".join(f"<li>{item}</li>" for item in items if item)
    return f'<ul class="bullets">{lis}</ul>'


def build_cover_letter_html(
    content: str,
    sender_name: str,
    sender_email: str,
    sender_phone: str,
    recipient_name: str,
    company: str,
    role: str,
) -> str:
    today = datetime.now().strftime("%d tháng %m năm %Y")
    paragraphs = "".join(f"<p>{p.strip()}</p>" for p in content.split("\n\n") if p.strip())

    return f"""<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>Thư xin việc – {sender_name}</title></head>
<body>
<div class="container">
  <div class="sender">
    <h2>{sender_name}</h2>
    <p>{sender_email}  ·  {sender_phone}</p>
  </div>
  <div class="date">{today}</div>
  <div class="recipient">
    <p><strong>{recipient_name or "Ban Tuyển dụng"}</strong></p>
    <p>{company}</p>
  </div>
  <h1 class="subject">V/v ứng tuyển vị trí {role}</h1>
  <div class="body">{paragraphs}</div>
  <div class="signature">
    <p>Trân trọng,</p>
    <br>
    <p><strong>{sender_name}</strong></p>
  </div>
</div>
</body>
</html>"""
