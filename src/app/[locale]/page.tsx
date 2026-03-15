'use client';

import { useState, use } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function HomePage({ params }: PageProps) {
  const { locale } = use(params);
  const t = useTranslations('HomePage');

  // --- 1. ESTADOS DE LA MESA DE DISEÑO (JUEGO) ---
  const [tipoSueño, setTipoSueño] = useState('Lote habitacional'); // A5.1
  const [ubicacion, setUbicacion] = useState(''); // A5.2
  const [moneda, setMoneda] = useState('MXN'); // A5.13
  const [metros, setMetros] = useState(140); // A5.10
  const [porcentajeEnganche, setPorcentajeEnganche] = useState(0.10); // A5.9

  // --- 2. CÁLCULOS DINÁMICOS ---
  const precioM2 = moneda === 'MXN' ? 1500 : 85; 
  const total = metros * precioM2;
  const engancheEfectivo = total * porcentajeEnganche;
  const plazoMSI = metros <= 200 ? 36 : 48; 
  const mensualidad = (total - engancheEfectivo) / plazoMSI;

  // --- 3. ESTADOS DEL FLUJO (PASOS) ---
  // 0 = Cotizador, 1 = Consentimiento, 2 = Datos, 3 = Email/Notas, 4 = Éxito
  const [pasoActual, setPasoActual] = useState(0); 

  // --- 4. ESTADOS DEL LEAD ---
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [notas, setNotas] = useState('');
  const [esMismoWhatsApp, setEsMismoWhatsApp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ folio_texto: string } | null>(null);

  const WHATSAPP_ALFONSO = "584121209510";

  // --- 5. LÓGICA DEL GUARDIÁN (A3) ---
  const obtenerMensajeGuardian = () => {
    if (!ubicacion) return locale === 'es' ? "¡Hola! Elige una ubicación para ver los precios." : "Hi! Choose a location to see the prices.";
    if (metros > 200) return locale === 'es' ? "¡Gran elección! Por el tamaño tienes 48 meses sin intereses." : "Great choice! For this size you get 48 months interest-free.";
    return locale === 'es' ? "Todo listo para generar tu folio." : "Everything is ready to generate your folio.";
  };

  const enviarCotizacion = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads_cotizaciones')
      .insert([{ 
          nombre_cliente: nombre, 
          telefono_cliente: telefono,
          email_cliente: email,
          idioma: locale,
          notas: `Sueño: ${tipoSueño} | Ubicación: ${ubicacion} | Metros: ${metros} | Enganche: ${porcentajeEnganche * 100}% | Notas: ${notas}`
      }])
      .select('folio_texto')
      .single();

    if (error) alert(error.message);
    else {
      setResultado(data);
      setPasoActual(4); 
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-neutral-900 rounded-[2.5rem] border border-neutral-800 shadow-2xl overflow-hidden relative transition-all duration-500">
        
        {/* HEADER ESTATICO */}
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
          <h2 className="font-bold italic text-xl tracking-tighter uppercase">MSM <span className="text-blue-500 italic">LIVE</span></h2>
          <div className="flex gap-3 items-center">
            <Link href="/es" className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${locale === 'es' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>ES</Link>
            <Link href="/en" className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${locale === 'en' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>EN</Link>
          </div>
        </div>

        {/* EL GUARDIÁN DINÁMICO (A3) */}
        {pasoActual < 4 && (
          <div className="px-8 pt-6">
            <div className="bg-blue-600/10 border border-blue-600/20 p-4 rounded-2xl flex gap-3 items-center">
              <span className="text-xl animate-pulse">✨</span>
              <p className="text-[11px] text-blue-300 font-bold leading-tight">{obtenerMensajeGuardian()}</p>
            </div>
          </div>
        )}

        <div className="p-8">
          
          {/* ========================================== */}
          {/* PASO 0: COTIZADOR COMPLETO                  */}
          {/* ========================================== */}
          {pasoActual === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-neutral-400 text-sm mt-1">{t('subtitle')}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{t('sueño')}</label>
                <div className="flex gap-2">
                  {['Casa', 'Lote habitacional', 'Negocio'].map((s) => (
                    <button key={s} onClick={() => setTipoSueño(s)} className={`flex-1 py-3 rounded-2xl text-[10px] font-bold border transition-all ${tipoSueño === s ? 'bg-white text-black border-white' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{t('ubicacion')}</label>
                <select value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-white">
                  <option value="">{t('seleccionaDesarrollo')}</option>
                  <option value="Costa Diamante">Costa Diamante (Cancún)</option>
                  <option value="Selva Mágica">Selva Mágica (Tulum)</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  <span>{t('metros')}</span>
                  <span className="text-white text-base font-mono">{metros} m²</span>
                </div>
                <input type="range" min="140" max="500" step="10" value={metros} onChange={(e) => setMetros(Number(e.target.value))} className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{t('enganche')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0.01, 0.05, 0.10].map((pct) => (
                    <button key={pct} onClick={() => setPorcentajeEnganche(pct)} className={`py-3 rounded-2xl text-xs font-bold border transition-all ${porcentajeEnganche === pct ? 'bg-blue-600 border-blue-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}>
                      {pct * 100}%
                    </button>
                  ))}
                </div>
              </div>

              {/* PANEL RESULTADOS */}
              <div className="rounded-[2rem] p-6 border bg-neutral-950 border-blue-500/30 shadow-2xl scale-105 transition-all duration-700">
                <div className="space-y-4 animate-in zoom-in-95 duration-500">
                  <div className="flex justify-between items-end">
                    <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-tighter">{t('mensualidad')} ({plazoMSI} {t('meses')})</span>
                    <span className="text-3xl font-mono font-bold text-green-400">${mensualidad.toLocaleString('en-US', {maximumFractionDigits:0})}</span>
                  </div>
                  <div className="h-px bg-neutral-800 w-full" />
                  <div className="flex justify-between text-[10px] text-neutral-500 font-mono italic">
                    <span>{t('enganche')}: ${engancheEfectivo.toLocaleString()}</span>
                    <span>{t('total')}: ${total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* SWITCH MONEDA */}
              <div className="flex justify-center">
                <button onClick={() => setMoneda(moneda === 'MXN' ? 'USD' : 'MXN')} className="text-[10px] font-black bg-neutral-800 px-4 py-2 rounded-full border border-neutral-700 hover:border-blue-500 transition-all">
                  {moneda === 'MXN' ? '🇲🇽 MXN → USD' : '🇺🇸 USD → MXN'}
                </button>
              </div>

              <button disabled={!ubicacion} onClick={() => setPasoActual(1)} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-tighter hover:bg-blue-500 hover:text-white transition-all disabled:opacity-20 active:scale-95 shadow-xl">{t('botonFolio')}</button>
            </div>
          )}

          {/* ========================================== */}
          {/* PASOS 1, 2, 3: LEAD GENERATOR MULTISTEP    */}
          {/* ========================================== */}
          {pasoActual > 0 && pasoActual < 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div className="flex gap-1 mb-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${pasoActual >= i ? 'bg-blue-500' : 'bg-neutral-800'}`} />
                ))}
              </div>

              {pasoActual === 1 && (
                <div className="text-center space-y-6">
                  <h2 className="text-2xl font-bold">¿Aseguramos este precio?</h2>
                  <p className="text-neutral-400 text-sm">Al generar tu folio, bloqueamos la mensualidad de <b>${mensualidad.toLocaleString()}</b> por 48 horas.</p>
                  <button onClick={() => setPasoActual(2)} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase">Sí, obtener folio</button>
                  <button onClick={() => setPasoActual(0)} className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Regresar al cotizador</button>
                </div>
              )}

              {pasoActual === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Tus datos básicos</h2>
                  <input required placeholder="Nombre Completo" className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-5 text-white" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  <input required placeholder="WhatsApp" className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-5 text-white" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                  <div className="flex items-center justify-between p-2">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">¿Es tu WhatsApp principal?</span>
                    <button onClick={() => setEsMismoWhatsApp(!esMismoWhatsApp)} className={`w-10 h-5 rounded-full relative ${esMismoWhatsApp ? 'bg-green-500' : 'bg-neutral-700'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${esMismoWhatsApp ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                  <button disabled={!nombre || !telefono} onClick={() => setPasoActual(3)} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase">Siguiente</button>
                </div>
              )}

              {pasoActual === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Último paso</h2>
                  <input required type="email" placeholder="Correo electrónico" className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-5 text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <textarea placeholder="Notas adicionales..." className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-5 text-white h-24" value={notas} onChange={(e) => setNotas(e.target.value)} />
                  <button disabled={loading || !email} onClick={enviarCotizacion} className="w-full bg-green-600 py-5 rounded-2xl font-black uppercase">{loading ? 'Procesando...' : 'Finalizar y Ver Folio'}</button>
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* PASO 4: ÉXITO                              */}
          {/* ========================================== */}
          {pasoActual === 4 && resultado && (
            <div className="text-center space-y-8 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto border border-green-500/30">✓</div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tighter italic">¡FOLIO LISTO!</h2>
                <div className="bg-neutral-950 py-8 rounded-[2.5rem] border border-blue-500/30">
                  <span className="text-5xl font-mono font-bold text-blue-400 tracking-tighter">{resultado.folio_texto}</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  const msg = `¡Hola Alfonso! Soy ${nombre}. Mi Folio es ${resultado.folio_texto}. Coticé un ${tipoSueño} en ${ubicacion} de ${metros}m2 con enganche del ${porcentajeEnganche*100}%.`;
                  window.open(`https://wa.me/${WHATSAPP_ALFONSO}?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black uppercase flex items-center justify-center gap-3 shadow-xl"
              >
                Enviar folio al asesor
              </button>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
