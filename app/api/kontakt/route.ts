import { NextResponse } from "next/server";
import { site } from "@/content/site";

export const runtime = "nodejs";

type Payload = {
  name?: string;
  email?: string;
  company?: string;
  budget?: string;
  message?: string;
  privacy?: string;
  /** Honeypot: darf niemals gefüllt sein */
  website?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let data: Payload;

  try {
    data = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Spam-Schutz: Bots füllen das versteckte Feld aus
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  const name = (data.name ?? "").trim();
  const email = (data.email ?? "").trim();
  const message = (data.message ?? "").trim();
  const company = (data.company ?? "").trim();
  const budget = (data.budget ?? "").trim();

  const errors: string[] = [];
  if (name.length < 2) errors.push("name");
  if (!EMAIL_PATTERN.test(email)) errors.push("email");
  if (message.length < 10) errors.push("message");
  if (!data.privacy) errors.push("privacy");

  if (errors.length > 0) {
    return NextResponse.json({ error: "validation_failed", fields: errors }, { status: 422 });
  }

  const subject = `Neue Anfrage über ${site.brand.name}: ${name}`;
  const text = [
    `Name: ${name}`,
    `E-Mail: ${email}`,
    company ? `Unternehmen: ${company}` : null,
    budget ? `Budget: ${budget}` : null,
    "",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL ?? site.contact.email;
  const from = process.env.CONTACT_FROM_EMAIL ?? "Website <onboarding@resend.dev>";

  // Ohne API-Key läuft alles im "Demo-Modus": die Anfrage wird nur geloggt.
  if (!apiKey) {
    console.info("[kontakt] Neue Anfrage (kein RESEND_API_KEY gesetzt):\n" + text);
    return NextResponse.json({ ok: true, delivered: false });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject,
        html: `<pre style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
        text,
      }),
    });

    if (!response.ok) {
      console.error("[kontakt] Resend-Fehler:", response.status, await response.text());
      return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
    }
  } catch (error) {
    console.error("[kontakt] Versand fehlgeschlagen:", error);
    return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, delivered: true });
}
