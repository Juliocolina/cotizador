import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "./../globals.css";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  // params puede ser una Promise en Next 16; la desestructuramos correctamente
  const resolvedParams = await params
  const { locale } = resolvedParams

  // Cargamos los mensajes (es.json o en.json) según el idioma
  // pasamos el locale explícitamente a getMessages
  const messages = await getMessages({ locale })

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}