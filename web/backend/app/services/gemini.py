from __future__ import annotations
import json
import re
from typing import AsyncGenerator, Optional

import google.generativeai as genai

from app.config import settings

# AI is optional — the backend boots without a Gemini key so non-AI
# features can be used. AI endpoints raise a clear error if called.
_model = None
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)
    _model = genai.GenerativeModel(settings.gemini_model)


def _require_model():
    if _model is None:
        raise RuntimeError("Tính năng AI chưa được bật (thiếu GEMINI_API_KEY).")
    return _model


def _clean_json(text: str) -> str:
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    return text


def _parse_json(text: str):
    """Parse JSON from a model response, tolerating code fences / stray prose."""
    t = re.sub(r"```(?:json)?", "", text, flags=re.IGNORECASE).strip().strip("`").strip()
    try:
        return json.loads(t)
    except (json.JSONDecodeError, ValueError):
        pass
    # Fall back to the outermost {...} or [...] block.
    for open_c, close_c in (("{", "}"), ("[", "]")):
        start = t.find(open_c)
        end = t.rfind(close_c)
        if start != -1 and end > start:
            try:
                return json.loads(t[start:end + 1])
            except (json.JSONDecodeError, ValueError):
                continue
    raise ValueError("AI không trả về JSON hợp lệ")


def _generate(prompt: str, temperature: float = 0.4, json_mode: bool = False) -> str:
    """One-shot generation. json_mode forces strict JSON output (no fences/prose)."""
    cfg: dict = {"temperature": temperature}
    if json_mode:
        cfg["response_mime_type"] = "application/json"
    resp = _require_model().generate_content(prompt, generation_config=cfg)
    try:
        text = resp.text or ""
    except Exception:
        text = ""
    if not text:
        # .text can be empty/raise when the answer is in parts or was blocked.
        try:
            parts = resp.candidates[0].content.parts
            text = "".join(getattr(p, "text", "") or "" for p in parts)
        except Exception:
            text = ""
    return text


# ── Chatbot system prompt (kept short + concise to save tokens) ────────────
CHAT_SYSTEM_PROMPT = """Bạn là Vica AI — trợ lý nghề nghiệp cho người tìm việc tại Việt Nam.

NGUYÊN TẮC:
- Trả lời bằng tiếng Việt, thân thiện, chuyên nghiệp, đi thẳng vào vấn đề.
- NGẮN GỌN: chỉ nói đủ ý, không lan man, không lặp lại câu hỏi, không thêm lời chào/kết thúc thừa.
- Khi liệt kê, dùng gạch đầu dòng ngắn; chỉ giải thích thêm khi được hỏi.
- Cá nhân hóa theo hồ sơ ứng viên và ngữ cảnh trang được cung cấp.
- KHÔNG bịa đặt kinh nghiệm/kỹ năng/số liệu không có trong hồ sơ. Thiếu dữ liệu thì nói rõ và hỏi lại ngắn gọn.
- Câu hỏi ngoài phạm vi tìm việc/CV/phỏng vấn/nghề nghiệp: lịch sự điều hướng về chủ đề."""

_CHAT_CONTEXT_LABELS = {
    "job_evaluation": "Vị trí đang xem",
    "cv_review": "CV đang xem",
    "interview_prep": "Buổi phỏng vấn",
    "job": "Vị trí đang xem",
    "cv": "CV đang xem",
}


def _compact_profile(p: dict) -> str:
    """Short profile summary for the chatbot to avoid sending the full JSON."""
    if not p:
        return ""
    parts = []
    name = p.get("full_name")
    if name:
        parts.append(f"Tên: {name}")
    roles = p.get("target_roles") or []
    if roles:
        parts.append("Mục tiêu: " + ", ".join(roles[:3]))
    skills = p.get("skills") or []
    names = [s.get("name") for s in skills if isinstance(s, dict) and s.get("name")]
    if names:
        parts.append("Kỹ năng: " + ", ".join(names[:8]))
    exp = p.get("experience") or []
    if exp and isinstance(exp[0], dict):
        e = exp[0]
        parts.append(f"Gần nhất: {e.get('job_title','')} @ {e.get('company','')}".strip())
    return ". ".join(parts)[:600]


# ── Language detection (decide reply language in code, not via the LLM) ─────
_VI_CHARS = set(
    "ăâêôơưđàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ"
)


def _detect_lang(text: str) -> str:
    """Return 'vi' if the text is Vietnamese, else 'en' (cheap heuristic)."""
    if not text:
        return "vi"
    vi = sum(1 for c in text.lower() if c in _VI_CHARS)
    return "vi" if vi >= 3 else "en"


def _lang_rule(text: str) -> str:
    if _detect_lang(text) == "en":
        return (
            "LANGUAGE: The CV is in English. Write ALL output text (summary, "
            "issues, suggestions, titles, reasons, notes, headline) in ENGLISH. "
            "Keep \"id\"/\"suggestion_type\" in English and quoted original text verbatim."
        )
    return (
        "NGÔN NGỮ: CV bằng tiếng Việt. Viết TẤT CẢ nội dung trả về bằng TIẾNG VIỆT. "
        "Giữ \"id\"/\"suggestion_type\" tiếng Anh và giữ nguyên văn đoạn trích."
    )


async def evaluate_fit(
    job_title: str,
    job_description: str,
    job_requirements: list[str],
    skills_required: list[str],
    user_profile: dict,
) -> dict:
    profile_text = json.dumps(user_profile, ensure_ascii=False, indent=2)
    req_text = "\n".join(f"- {r}" for r in job_requirements[:20])
    skills_text = ", ".join(skills_required[:20])

    prompt = f"""Bạn là chuyên gia tuyển dụng. Đánh giá độ phù hợp giữa ứng viên và vị trí sau.

## Vị trí tuyển dụng
**Tên:** {job_title}
**Mô tả:** {job_description[:2000]}
**Yêu cầu:**
{req_text}
**Kỹ năng cần có:** {skills_text}

## Hồ sơ ứng viên
{profile_text}

Trả lời dưới dạng JSON hợp lệ với cấu trúc sau (không có markdown):
{{
  "technical_skills": {{"score": 0-100, "notes": ""}},
  "experience_match": {{"score": 0-100, "notes": ""}},
  "cultural_fit": {{"score": 0-100, "notes": ""}},
  "career_alignment": {{"score": 0-100, "notes": ""}},
  "overall_score": 0-100,
  "verdict": "Rất phù hợp|Phù hợp tốt|Phù hợp vừa|Ít phù hợp|Không phù hợp",
  "strengths": ["điểm mạnh 1", "điểm mạnh 2", "điểm mạnh 3"],
  "gaps": ["khoảng cách 1", "khoảng cách 2"],
  "recommendation": "Khuyến nghị 1-2 câu"
}}"""

    return _parse_json(_generate(prompt, json_mode=True))


async def analyze_cv_sections(
    cv_sections: list[dict],
    job_description: Optional[str] = None,
    job_requirements: Optional[list[str]] = None,
) -> list[dict]:
    sections_text = json.dumps(cv_sections, ensure_ascii=False)
    job_context = ""
    if job_description:
        job_context = f"\n## Vị trí mục tiêu\n{job_description[:1500]}"
        if job_requirements:
            job_context += "\nYêu cầu: " + ", ".join(job_requirements[:10])

    prompt = f"""Bạn là chuyên gia viết CV. Phân tích các phần CV sau và đưa ra gợi ý cải thiện cụ thể.{job_context}

{_lang_rule(sections_text)}

## CV hiện tại
{sections_text}

Trả về danh sách JSON (không có markdown) với các gợi ý, mỗi gợi ý có cấu trúc:
{{
  "section": "tên phần CV",
  "suggestion_type": "weakness|keyword|reframe|add|remove",
  "original_text": "đoạn văn gốc (nếu có)",
  "suggested_text": "đoạn văn gợi ý (nếu có)",
  "reason": "lý do ngắn gọn"
}}

Tập trung vào: điểm yếu cụ thể, từ khóa còn thiếu, cách diễn đạt tốt hơn. Tối đa 8 gợi ý.
Trả về mảng JSON trực tiếp, không bọc trong object."""

    result = _parse_json(_generate(prompt, json_mode=True))
    return result if isinstance(result, list) else []


async def generate_cover_letter(
    job_title: str,
    company: str,
    job_description: str,
    user_profile: dict,
    language: str = "vi",
    tone: str = "professional",
) -> str:
    lang_instruction = "Viết hoàn toàn bằng tiếng Việt" if language == "vi" else "Write entirely in English"
    profile_text = json.dumps(user_profile, ensure_ascii=False)

    prompt = f"""{lang_instruction}. Bạn là chuyên gia viết thư xin việc.

Viết thư xin việc cho vị trí **{job_title}** tại **{company}**.
Giọng văn: {tone}.

## Mô tả vị trí
{job_description[:2000]}

## Hồ sơ ứng viên
{profile_text}

Yêu cầu thư:
- Mở đầu thu hút, không sáo rỗng
- Liên kết cụ thể kinh nghiệm ứng viên với yêu cầu công việc
- 3-4 đoạn, khoảng 300-400 từ
- Kết thúc tích cực, chủ động
- KHÔNG bịa đặt thông tin không có trong hồ sơ

Chỉ trả về nội dung thư, không có tiêu đề hay giải thích."""

    return _generate(prompt).strip()


async def chat_with_context(
    messages: list[dict],
    user_profile: dict,
    context_type: str = "general",
    context_data: Optional[dict] = None,
) -> AsyncGenerator[str, None]:
    if _model is None:
        raise RuntimeError("Tính năng AI chưa được bật (thiếu GEMINI_API_KEY).")

    # Static rules + compact profile + page context live in system_instruction
    # so they persist across turns without re-sending in every message.
    sys = CHAT_SYSTEM_PROMPT
    prof = _compact_profile(user_profile)
    if prof:
        sys += f"\n\nHỒ SƠ ỨNG VIÊN:\n{prof}"
    if context_data:
        label = _CHAT_CONTEXT_LABELS.get(context_type, "Ngữ cảnh")
        sys += f"\n\n{label.upper()}: {json.dumps(context_data, ensure_ascii=False)[:500]}"

    model = genai.GenerativeModel(
        settings.gemini_model,
        system_instruction=sys,
        generation_config={"temperature": 0.7},
    )

    history = []
    for msg in messages[:-1]:
        history.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [msg["content"]],
        })

    chat = model.start_chat(history=history)
    last_message = messages[-1]["content"] if messages else ""
    response = chat.send_message(last_message, stream=True)
    for chunk in response:
        if chunk.text:
            yield chunk.text


async def parse_uploaded_cv(cv_text: str) -> dict:
    prompt = f"""Bạn là chuyên gia HR với 10 năm kinh nghiệm đánh giá CV. Phân tích chi tiết CV sau.

{_lang_rule(cv_text)}

CV:
{cv_text[:5000]}

Trả về JSON hợp lệ (KHÔNG có markdown, KHÔNG có ```json):
{{
  "name": "tên ứng viên hoặc chuỗi rỗng nếu không tìm thấy",
  "headline": "<chức danh/vị trí ngay dưới tên, ví dụ 'Frontend Developer · Fresher'>",
  "contacts": ["email", "thành phố", "link (LinkedIn/portfolio)"],
  "overall_score": <số từ 0-100>,
  "summary_message": "<nhận xét tổng thể 2-3 câu, CÙNG NGÔN NGỮ với CV>",
  "top_priorities": ["việc cần làm quan trọng nhất", "việc cần làm thứ 2", "việc cần làm thứ 3"],
  "sections": [
    {{
      "id": "<summary|experience|education|skills|projects|certifications|languages|awards>",
      "title": "<tên hiển thị, CÙNG NGÔN NGỮ với CV>",
      "subtitle": "<dòng phụ nếu có, ví dụ 'Vị trí · Công ty · thời gian'; để trống nếu không có>",
      "content_preview": "<trích dẫn ngắn 1-2 câu từ nội dung gốc>",
      "score": <số từ 0-10>,
      "issues": ["vấn đề cụ thể 1", "vấn đề cụ thể 2"],
      "suggestions": ["gợi ý cải thiện cụ thể 1", "gợi ý cải thiện cụ thể 2"],
      "items": [
        {{
          "text": "<TRÍCH NGUYÊN VĂN một dòng/bullet thực sự có trong CV>",
          "weak": <true nếu dòng này yếu, false nếu đã tốt>,
          "issue": "<nếu weak: vì sao yếu, 1 câu ngắn>",
          "suggestion": "<nếu weak: viết lại dòng đó tốt hơn, có số liệu/từ khóa, KHÔNG bịa thông tin>"
        }}
      ]
    }}
  ]
}}

Lưu ý:
- Chỉ trả về các section thực sự có trong CV, tối đa 7 sections
- "items" phải là CÁC DÒNG THẬT trích từ CV (mỗi bullet/đoạn là 1 item), giữ nguyên văn ở trường "text"
- Đánh dấu weak=true cho dòng chung chung, thiếu số liệu, bị động hoặc không liên quan
- "suggestion" phải viết lại đúng dòng đó tốt hơn, KHÔNG bịa đặt thông tin không có trong hồ sơ
- issues/suggestions (cấp section) vẫn giữ để tóm tắt; score 8-10: tốt, 5-7: trung bình, 0-4: cần cải thiện ngay"""

    return _parse_json(_generate(prompt, json_mode=True))


async def tailor_cv_to_job(
    user_profile: dict,
    job_title: str,
    company: str,
    job_description: str,
    job_requirements: list[str],
    skills_required: list[str],
) -> dict:
    profile_text = json.dumps(user_profile, ensure_ascii=False)[:3000]
    req = "\n".join(f"- {r}" for r in (job_requirements or [])[:15])
    skills = ", ".join((skills_required or [])[:20])

    prompt = f"""Bạn là chuyên gia viết CV. Đối chiếu hồ sơ ứng viên với vị trí cụ thể và chỉ ra từng DÒNG trong CV cần tinh chỉnh để KHỚP hơn với vị trí.

{_lang_rule(profile_text)}

## Vị trí
Tên: {job_title} tại {company}
Mô tả: {job_description[:1500]}
Yêu cầu:
{req}
Kỹ năng cần: {skills}

## Hồ sơ ứng viên
{profile_text}

Trả về JSON hợp lệ (KHÔNG markdown, KHÔNG ```json):
{{
  "name": "tên ứng viên",
  "headline": "Ứng viên cho vị trí {job_title}",
  "contacts": ["email", "địa điểm", "link"],
  "overall_score": <0-100: mức độ khớp với vị trí>,
  "summary_message": "1-2 câu về mức độ khớp",
  "top_priorities": ["ưu tiên 1", "ưu tiên 2", "ưu tiên 3"],
  "sections": [
    {{
      "id": "summary|experience|skills|education|projects",
      "title": "tên mục tiếng Việt",
      "subtitle": "dòng phụ nếu có (Vị trí · Công ty · thời gian)",
      "score": <0-10>,
      "issues": [],
      "suggestions": [],
      "items": [
        {{
          "text": "<một dòng/bullet lấy từ hồ sơ>",
          "weak": <true nếu chưa khớp vị trí>,
          "issue": "<nếu weak: vì sao chưa khớp vị trí này>",
          "suggestion": "<nếu weak: viết lại để khớp, dùng từ khóa/kỹ năng của job, KHÔNG bịa>"
        }}
      ]
    }}
  ]
}}

Chỉ dùng thông tin CÓ trong hồ sơ — KHÔNG bịa đặt kinh nghiệm/kỹ năng không có. Đánh dấu weak=true cho dòng thiếu từ khóa của vị trí, quá chung chung hoặc không liên quan."""

    return _parse_json(_generate(prompt, json_mode=True))


async def generate_market_insights(scraped_jobs: list[dict]) -> dict:
    jobs_sample = json.dumps(scraped_jobs[:50], ensure_ascii=False)

    prompt = f"""Phân tích thị trường việc làm Việt Nam từ dữ liệu sau:
{jobs_sample}

Trả về JSON (không markdown):
{{
  "top_skills": [{{"skill": "", "count": 0}}],
  "top_sectors": [{{"sector": "", "count": 0}}],
  "salary_ranges": [{{"range": "", "count": 0}}],
  "employment_types": [{{"type": "", "count": 0}}],
  "top_locations": [{{"location": "", "count": 0}}],
  "insights": ["nhận định 1", "nhận định 2", "nhận định 3"]
}}"""

    return _parse_json(_generate(prompt, json_mode=True))
