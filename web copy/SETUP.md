# JobViet AI — Hướng dẫn deploy

## Yêu cầu

- Node.js 18+
- Python 3.12+
- Tài khoản Supabase, Vercel, Render.com, Google AI Studio

---

## 1. Supabase

1. Tạo project mới tại [supabase.com](https://supabase.com)
2. Vào **SQL Editor** → chạy toàn bộ file `supabase/migrations/001_initial_schema.sql`
3. Tạo 2 Storage bucket:
   ```sql
   insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false);
   insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
   ```
4. Lấy thông tin từ **Project Settings → API**:
   - `Project URL`
   - `anon public key`
   - `service_role key`
   - `JWT Secret` (ở tab JWT Settings)

---

## 2. Backend — Render.com

1. Push code lên GitHub
2. Tạo **New Web Service** trên Render, chọn repo
3. Cấu hình:
   - **Root Directory:** `web/backend`
   - **Runtime:** Docker (dùng Dockerfile đã có)
   - **Build Command:** *(tự động từ Dockerfile)*
   - **Start Command:** *(tự động từ Dockerfile)*
4. Thêm **Environment Variables**:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   SUPABASE_JWT_SECRET=your-jwt-secret
   GEMINI_API_KEY=AIza...
   GEMINI_MODEL=gemini-1.5-flash
   FRONTEND_URL=https://your-app.vercel.app
   ENVIRONMENT=production
   ```
5. Deploy → lấy URL dạng `https://jobviet-api.onrender.com`

---

## 3. Frontend — Vercel

1. Vào [vercel.com](https://vercel.com) → **New Project** → import repo
2. **Root Directory:** `web/frontend`
3. Thêm **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_API_URL=https://jobviet-api.onrender.com/api/v1
   ```
4. Deploy

---

## 4. Cấu hình Supabase Auth

Sau khi có URL Vercel, vào **Supabase → Authentication → URL Configuration**:
- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** `https://your-app.vercel.app/**`

---

## 5. Gemini API Key

1. Vào [Google AI Studio](https://aistudio.google.com)
2. **Get API key** → tạo key mới
3. Dán vào `GEMINI_API_KEY` ở Render

---

## Luồng hoạt động

```
User (Browser)
  └─ Next.js / Vercel
      ├─ Auth: Supabase JS SDK (direct)
      └─ Data: FastAPI / Render
          ├─ Verify JWT từ Supabase
          ├─ Scrape jobs: VietnamWorks API, TopCV, ITviec, CareerViet
          ├─ AI: Gemini 1.5 Flash
          ├─ PDF: WeasyPrint (HTML → PDF)
          └─ DB: Supabase PostgreSQL (service role)
```

---

## Development local

### Backend
```bash
cd web/backend
cp .env.example .env  # Điền thông tin thực
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd web/frontend
cp .env.example .env.local  # Điền thông tin thực
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

---

## Lưu ý

- **WeasyPrint** cần fonts hệ thống. Trên Render, Dockerfile đã cài `fonts-noto` và `fonts-noto-cjk` để hỗ trợ tiếng Việt.
- **Scraper** hoạt động qua HTTP requests — một số trang có thể block nếu request quá nhiều. Rate limiting đã được xử lý qua `tenacity` (retry với exponential backoff).
- **Gemini** có free tier 15 requests/phút với `gemini-1.5-flash`. Nâng cấp nếu có nhiều user đồng thời.
- **Render free tier** sẽ sleep sau 15 phút không có request — response đầu tiên sau khi ngủ có thể chậm ~30 giây.
