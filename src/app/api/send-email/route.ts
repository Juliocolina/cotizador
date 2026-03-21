import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { nombre, email, folio, ubicacion, tipoSueno, metros, montoTotal, mensualidad, plazoTipo, meses, moneda, enganche } = await req.json();

    const plazoTexto = plazoTipo === 'contado' ? 'Contado' : `${meses} meses`;

    await resend.emails.send({
      from: 'Mi Sueño Mexicano <onboarding@resend.dev>',
      to: email,
      subject: `Tu folio ${folio} — Mi Sueño Mexicano`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:16px;">
          <h1 style="color:#3b82f6;margin:0 0 4px;">¡Felicidades, ${nombre}!</h1>
          <p style="color:#a3a3a3;font-size:14px;margin:0 0 24px;">Tu cotización ha sido registrada exitosamente.</p>
          
          <div style="background:#171717;border:1px solid #262626;border-radius:12px;padding:20px;margin-bottom:16px;">
            <p style="color:#a3a3a3;font-size:12px;margin:0 0 4px;">Tu Folio Oficial</p>
            <p style="color:#facc15;font-size:24px;font-weight:bold;margin:0;font-family:monospace;">${folio}</p>
          </div>

          <div style="background:#171717;border:1px solid #262626;border-radius:12px;padding:20px;margin-bottom:16px;">
            <p style="color:#a3a3a3;font-size:12px;margin:0 0 12px;font-weight:600;">Resumen de tu cotización</p>
            <table style="width:100%;font-size:13px;color:#d4d4d4;">
              <tr><td style="padding:4px 0;color:#737373;">Tipo</td><td style="text-align:right;">${tipoSueno}</td></tr>
              <tr><td style="padding:4px 0;color:#737373;">Ubicación</td><td style="text-align:right;">${ubicacion}</td></tr>
              <tr><td style="padding:4px 0;color:#737373;">Metros²</td><td style="text-align:right;">${metros}</td></tr>
              <tr><td style="padding:4px 0;color:#737373;">Total</td><td style="text-align:right;color:#3b82f6;font-weight:bold;">$${Number(montoTotal).toLocaleString('en-US')} ${moneda}</td></tr>
              <tr><td style="padding:4px 0;color:#737373;">Enganche</td><td style="text-align:right;">$${Number(enganche).toLocaleString('en-US')} ${moneda}</td></tr>
              <tr><td style="padding:4px 0;color:#737373;">Plazo</td><td style="text-align:right;">${plazoTexto}</td></tr>
              <tr><td style="padding:4px 0;color:#737373;">Mensualidad</td><td style="text-align:right;color:#facc15;font-weight:bold;">$${Number(mensualidad).toLocaleString('en-US')} ${moneda}</td></tr>
            </table>
          </div>

          <p style="color:#525252;font-size:11px;text-align:center;margin-top:24px;">Mi Sueño Mexicano — Tu trabajo merece raíces</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al enviar email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
