from __future__ import annotations
import json
import re
from typing import AsyncGenerator, Optional

import google.generativeai as genai

from app.config import settings

genai.configure(api_key=settings.gemini_api_key)

_model = genai.GenerativeModel(settings.gemini_model)


def _clean_json(text: str) -> str:
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    return text


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

    response = _model.generate_content(prompt)
    raw = _clean_json(response.text)
    return json.loads(raw)


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

    response = _model.generate_content(prompt)
    raw = _clean_json(response.text)
    result = json.loads(raw)
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

    response = _model.generate_content(prompt)
    return response.text.strip()


async def chat_with_context(
    messages: list[dict],
    user_profile: dict,
    context_type: str = "general",
    context_data: Optional[dict] = None,
) -> AsyncGenerator[str, None]:
    system_context = f"""Bạn là trợ lý tìm việc AI thông minh, hỗ trợ ứng viên người Việt Nam.
Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.

Hồ sơ ứng viên:
{json.dumps(user_profile, ensure_ascii=False, indent=2)[:2000]}"""

    if context_type == "job_evaluation" and context_data:
        system_context += f"\n\nĐang tư vấn về vị trí: {json.dumps(context_data, ensure_ascii=False)[:500]}"
    elif context_type == "cv_review" and context_data:
        system_context += f"\n\nĐang xem xét CV: {json.dumps(context_data, ensure_ascii=False)[:500]}"
    elif context_type == "interview_prep" and context_data:
        system_context += f"\n\nChuẩn bị phỏng vấn cho: {json.dumps(context_data, ensure_ascii=False)[:500]}"

    history = []
    for msg in messages[:-1]:
        history.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [msg["content"]],
        })

    chat = _model.start_chat(history=history)
    last_message = messages[-1]["content"] if messages else ""
    full_prompt = f"{system_context}\n\nCâu hỏi: {last_message}" if not history else last_message

    response = chat.send_message(full_prompt, stream=True)
    for chunk in response:
        if chunk.text:
            yield chunk.text


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

    response = _model.generate_content(prompt)
    raw = _clean_json(response.text)
    return json.loads(raw)
