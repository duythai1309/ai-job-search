// Vercel Cron → triggers the backend's background crawl.
//
// Vercel invokes this route (GET) on the schedule in vercel.json. When a
// CRON_SECRET env var is set on the Vercel project, Vercel sends
// "Authorization: Bearer <CRON_SECRET>" with each cron request — we verify that
// so the route can't be triggered publicly. We then POST the backend's
// /jobs/crawl-cron (secret-authed, returns immediately and runs the crawl in the
// background) — we deliberately do NOT wait for the crawl, which takes minutes
// and would blow past the serverless function timeout.

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${base}/jobs/crawl-cron`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Cron-Secret": secret },
    });
    const data = await res.json().catch(() => ({}));
    return Response.json({ ok: res.ok, backend: data }, { status: res.ok ? 200 : 502 });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
