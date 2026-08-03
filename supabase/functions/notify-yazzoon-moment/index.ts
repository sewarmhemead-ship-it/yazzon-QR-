import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { submissionId } = await request.json();
    if (!submissionId) throw new Error("Missing submission ID");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: moment, error } = await supabase
      .from("yazzoon_moments")
      .select("id,guest_name,guest_email,caption,created_at,status")
      .eq("id", submissionId)
      .eq("status", "pending")
      .single();
    if (error || !moment) throw new Error("Submission not found");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("Missing RESEND_API_KEY");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "YAZZOON Moments <moments@notifications.yazzoon.com>",
        to: ["office@yazzoon.com"],
        subject: "New YAZZOON moment waiting for review",
        html: `<h2>A new photograph is waiting</h2><p><strong>Guest:</strong> ${escapeHtml(moment.guest_name || "Anonymous")}</p><p><strong>Email:</strong> ${escapeHtml(moment.guest_email || "Not provided")}</p><p><strong>Story:</strong> ${escapeHtml(moment.caption || "No caption")}</p><p>Submission: ${moment.id}</p><p>Open the YAZZOON Supabase dashboard to review the private image.</p>`,
      }),
    });
    if (!response.ok) throw new Error("Email provider rejected notification");
    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]!));
}
