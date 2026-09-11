import { Injectable, Logger } from "@nestjs/common";
import { loadEnv } from "../../config/env";

@Injectable()
export class MailService {
  private readonly log = new Logger(MailService.name);
  private readonly env = loadEnv();

  async send(to: string, subject: string, text: string, html?: string) {
    const key = this.env.RESEND_API_KEY?.trim();
    const from = this.env.MAIL_FROM?.trim() || "Dorham <noreply@dorham.app>";

    if (!key) {
      this.log.warn(`Mail skipped (no RESEND_API_KEY). to=${to} subject=${subject}`);
      if (this.env.NODE_ENV !== "production") {
        this.log.log(`DEV MAIL\nTo: ${to}\nSubject: ${subject}\n\n${text}`);
      }
      return { sent: false as const };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html: html ?? `<pre style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.log.error(`Resend failed ${res.status}: ${body}`);
      return { sent: false as const };
    }
    return { sent: true as const };
  }

  async sendVerifyEmail(to: string, token: string) {
    const url = `${this.env.APP_URL.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
    return this.send(
      to,
      "تأیید ایمیل · دورهم",
      `برای تأیید ایمیل در دورهم این لینک را باز کن:\n\n${url}\n\nلینک ۲۴ ساعت معتبر است.`,
      `<p dir="rtl">برای تأیید ایمیل در دورهم روی لینک بزن:</p><p><a href="${url}">${url}</a></p><p dir="rtl">لینک ۲۴ ساعت معتبر است.</p>`,
    );
  }

  async sendPasswordReset(to: string, token: string) {
    const url = `${this.env.APP_URL.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
    return this.send(
      to,
      "بازیابی رمز · دورهم",
      `برای تغییر رمز دورهم این لینک را باز کن:\n\n${url}\n\nاگر این درخواست را ندادی، نادیده بگیر.`,
      `<p dir="rtl">برای تغییر رمز دورهم روی لینک بزن:</p><p><a href="${url}">${url}</a></p><p dir="rtl">اگر این درخواست را ندادی، نادیده بگیر.</p>`,
    );
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
