'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams, usePathname } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = params?.locale || 'es';

  const isLoginPage = pathname?.endsWith('/admin/login');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session && !isLoginPage) {
        router.push(`/${locale}/admin/login`);
      } else {
        setSession(session);
      }
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isLoginPage) {
        router.push(`/${locale}/admin/login`);
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, locale, isLoginPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-blue-500 animate-pulse font-black tracking-tighter italic text-2xl uppercase">
          Verificando Acceso...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
