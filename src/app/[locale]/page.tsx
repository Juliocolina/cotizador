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
  const [tipoSueño, setTipoSueño] = useState(''); // A5.1
  const [ubicacion, setUbicacion] = useState(''); // A5.2
  const [moneda, setMoneda] = useState('MXN'); // A5.13
  const [metros, setMetros] = useState(140); // A5.10
  const [porcentajeEnganche, setPorcentajeEnganche] = useState(0); // A5.9
  const [ultimaAccion, setUltimaAccion] = useState('');

  // --- 2. CÁLCULOS DINÁMICOS ---
  const [plazoTipo, setPlazoTipo] = useState('');

  const obtenerMeses = () => {
    if (plazoTipo === 'contado') return 1;
    if (plazoTipo === '20_años') return 240;
    if (plazoTipo === '30_años') return 360;
    return 0;
  };

  const mesesFinal = obtenerMeses();

  const precioM2 = moneda === 'MXN' ? 1500 : 85;
  const total = metros * precioM2;
  const engancheEfectivo = total * porcentajeEnganche;
  const montoAFinanciar = total - engancheEfectivo;

  const mensualidadFinal = mesesFinal > 0 ? montoAFinanciar / mesesFinal : montoAFinanciar;

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
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [idiomaAbierto, setIdiomaAbierto] = useState(false);
  const [resultado, setResultado] = useState<{ folio_texto: string } | null>(null);

  const WHATSAPP_ALFONSO = "584121209510";

  // --- 5. MÁQUINA DE ESTADOS DEL GUARDIÁN (A3) ---
  const obtenerEstadoGuardian = (): { img: string; msg: string } => {
    const es = locale === 'es';

    // Pasos del flujo (siempre tienen prioridad máxima)
    if (pasoActual === 4) return { img: 'Celebrando.png', msg: es ? '¡Felicidades! Tu sueño está en marcha.' : 'Congratulations! Your dream is on its way.' };
    if (pasoActual === 3) return { img: 'guino_ojo.png', msg: es ? '¡Ya casi! Solo un paso más.' : 'Almost there! Just one more step.' };
    if (pasoActual === 2) return { img: 'feliz.png', msg: es ? 'Tus datos están seguros conmigo.' : 'Your data is safe with me.' };
    if (pasoActual === 1) return { img: 'asintiendo.png', msg: es ? '¡Excelente decisión! Aseguremos tu precio.' : 'Excellent decision! Let\'s lock your price.' };

    // Guía paso a paso según lo que falta
    if (!tipoSueño && !ultimaAccion) return { img: 'saludando.png', msg: es ? '¡Hola! Elige tu tipo de sueño.' : 'Hi! Choose your dream type.' };

    // Reaccionar a la ÚLTIMA acción del usuario
    if (ultimaAccion === 'tipoSueño') {
      if (tipoSueño === 'Casa') return { img: 'echando_porras.png', msg: es ? '¡Alistemos maletas, nos mudamos!' : 'Pack your bags, we\'re moving!' };
      if (tipoSueño === 'Negocio') return { img: 'jefe.png', msg: es ? '¡Un empresario visionario! Gran jugada.' : 'A visionary entrepreneur! Great move.' };
      return { img: 'presentandose.png', msg: es ? 'Todo empezó con un lotesito.' : 'It all started with a little lot.' };
    }
    if (ultimaAccion === 'ubicacion') return { img: 'buscando_mapa.png', msg: es ? '¡Buena zona! Ahora personaliza tu sueño.' : 'Great area! Now customize your dream.' };
    if (ultimaAccion === 'metros') {
      if (metros > 200) return { img: 'sorprendido.png', msg: es ? '¡Wow! Estás pensando en grande.' : 'Wow! You\'re thinking big.' };
      return { img: 'pensando.png', msg: es ? 'Buen tamaño para comenzar.' : 'Good size to start.' };
    }
    if (ultimaAccion === 'plazo') {
      if (plazoTipo === '30_años') return { img: 'pensando_futuro.png', msg: es ? 'Plazo ideal. Olvídate del crédito bancario.' : 'Ideal term. Forget about bank credit.' };
      if (plazoTipo === '20_años') return { img: 'guino_ojo.png', msg: es ? '¡Buena elección! No revisaremos tu Buró.' : 'Great choice! We won\'t check your credit score.' };
      return { img: 'haciendo_lluvia_dinero.png', msg: es ? '¡Decidido! El mejor precio es para ti.' : 'Decided! The best price is yours.' };
    }
    if (ultimaAccion === 'enganche') {
      if (porcentajeEnganche === 0.01) return { img: 'contando_pesos.png', msg: es ? '¡Solo 1%! Así se empieza un sueño.' : 'Just 1%! That\'s how a dream begins.' };
      if (porcentajeEnganche === 0.05) return { img: 'pensando_futuro.png', msg: es ? '5% de enganche, ¡buen balance!' : '5% down payment, great balance!' };
      return { img: 'feliz.png', msg: es ? '10% de enganche, ¡vas en serio!' : '10% down, you\'re serious!' };
    }
    if (ultimaAccion === 'moneda') return { img: 'contando_pesos.png', msg: es ? (moneda === 'USD' ? '¡En dólares! Inversionista internacional.' : 'De vuelta a pesos mexicanos.') : (moneda === 'USD' ? 'In dollars! International investor.' : 'Back to Mexican pesos.') };

    return { img: 'senalando_boton.png', msg: es ? 'Todo listo. ¡Genera tu folio!' : 'All set. Generate your folio!' };
  };

  const guardian = obtenerEstadoGuardian();

  const enviarCotizacion = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads_cotizaciones')
      .insert([{ 
          nombre_cliente: nombre, 
          telefono_cliente: telefono,
          email_cliente: email,
          idioma: locale,
          notas: `Sueño: ${tipoSueño} | Ubicación: ${ubicacion} | Metros: ${metros} | Enganche: ${porcentajeEnganche * 100}% | Notas: ${notas}`,
          ip_cliente: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip).catch(() => 'N/A')
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
        
        {/* HEADER */}
        <div className="px-2 py-2 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
          <div className="flex items-center gap-1.5 min-w-0">
            <img src="/logo-fondo-blanco.png" alt="Mi Sueño Mexicano" className="w-10 h-10 rounded-full object-contain cursor-pointer flex-shrink-0" onClick={() => { setPasoActual(0); setUbicacion(''); setNombre(''); setTelefono(''); setEmail(''); setNotas(''); setResultado(null); }} />
            <div className="min-w-0">
              <h1 className="text-sm font-black text-white leading-tight">Mi Sueño Mexicano</h1>
              <p className="text-[10px] text-blue-300 italic">Tu trabajo merece raices</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="relative">
              <button onClick={() => setIdiomaAbierto(!idiomaAbierto)} className="text-[10px] font-bold px-2 py-1 rounded-md bg-neutral-800 border border-neutral-700 hover:border-blue-500 transition-all flex items-center gap-1">
                {locale.toUpperCase()} <span className="text-[8px]">{idiomaAbierto ? '▲' : '▼'}</span>
              </button>
              {idiomaAbierto && (
                <div className="absolute top-8 right-0 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden z-50 shadow-xl">
                  <Link href="/es" className={`block px-4 py-2 text-[10px] font-bold transition-all ${locale === 'es' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'}`}>Español</Link>
                  <Link href="/en" className={`block px-4 py-2 text-[10px] font-bold transition-all ${locale === 'en' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'}`}>English</Link>
                </div>
              )}
            </div>
            <button onClick={() => setMenuAbierto(!menuAbierto)} className="p-1.5 hover:bg-neutral-800 rounded-lg transition-all">
              <div className="space-y-1">
                <div className="w-4 h-0.5 bg-white" />
                <div className="w-4 h-0.5 bg-white" />
                <div className="w-4 h-0.5 bg-white" />
              </div>
            </button>
          </div>
        </div>

        {/* DRAWER MENU LATERAL IZQUIERDO */}
        <div className={`fixed inset-0 z-50 transition-all duration-300 ${menuAbierto ? 'visible' : 'invisible'}`}>
          <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${menuAbierto ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMenuAbierto(false)} />
          <div className={`absolute top-0 left-0 h-full w-64 bg-neutral-900 border-r border-neutral-800 p-6 space-y-4 transition-transform duration-300 ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}`}>
            <button onClick={() => setMenuAbierto(false)} className="text-neutral-500 hover:text-white text-2xl font-bold mb-4">✕</button>
            <a href="#" onClick={() => setMenuAbierto(false)} className="block text-lg text-neutral-400 hover:text-white transition-all">{t('menu.servicio')}</a>
            <a href="#" onClick={() => setMenuAbierto(false)} className="block text-lg text-neutral-400 hover:text-white transition-all">{t('menu.hogar')}</a>
            <a href="#" onClick={() => setMenuAbierto(false)} className="block text-lg text-neutral-400 hover:text-white transition-all">{t('menu.cotizacion')}</a>
            <a href="#" onClick={() => setMenuAbierto(false)} className="block text-lg text-neutral-400 hover:text-white transition-all">{t('menu.contacto')}</a>
            <div className="h-px bg-neutral-800" />
            <a href="#" onClick={() => setMenuAbierto(false)} className="block text-lg text-neutral-400 hover:text-white transition-all">{t('menu.quienes')}</a>
            <a href="#" onClick={() => setMenuAbierto(false)} className="block text-lg text-neutral-400 hover:text-white transition-all">{t('menu.ciudadMadera')}</a>
            <a href="#" onClick={() => setMenuAbierto(false)} className="block text-lg text-neutral-400 hover:text-white transition-all">{t('menu.razones')}</a>
            <div className="h-px bg-neutral-800" />
            <div className="flex gap-4">
              <a href="https://tiktok.com/@misuenomexicano" target="_blank" className="text-neutral-400 hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.7a8.18 8.18 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.13z"/></svg>
              </a>
              <a href="https://youtube.com/@misuenomexicano" target="_blank" className="text-neutral-400 hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* EL GUARDIÁN DEL SUEÑO (A3) */}
        {pasoActual < 4 && (
          <div className="px-5 pt-4">
            <div className="bg-blue-600/10 border border-blue-600/20 p-2.5 rounded-xl flex gap-2 items-center">
              <img src={`/guardian/${guardian.img}`} alt="Guardián" className="w-12 h-12 object-contain flex-shrink-0" />
              <p className="text-xs text-blue-300 font-bold leading-tight">{guardian.msg}</p>
            </div>
          </div>
        )}

        <div className="p-5">
          
          {/* ========================================== */}
          {/* PASO 0: COTIZADOR COMPLETO                  */}
          {/* ========================================== */}
          {pasoActual === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">

              {/* PANEL DE RESULTADOS - FILAS COMPACTAS */}
<div className={`space-y-1.5 transition-all duration-500 ${ubicacion ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
  
  {/* Fila 1: Total */}
  <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-xl flex justify-between items-center px-4">
    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{t('total')}</span>
    <span className="text-xs font-mono font-bold text-white">${total.toLocaleString()}</span>
  </div>

  {/* Fila 2: Enganche */}
  <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-xl flex justify-between items-center px-4">
    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{t('enganche')}</span>
    <span className="text-xs font-mono font-bold text-green-400">${engancheEfectivo.toLocaleString()}</span>
  </div>

  {/* Fila 3: Monto a Financiar */}
  <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-xl flex justify-between items-center px-4">
    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{t('montoFinanciar')}</span>
    <span className="text-xs font-mono font-bold text-blue-400">${montoAFinanciar.toLocaleString()}</span>
  </div>

  {/* Fila 4: Mensualidad */}
  <div className="bg-neutral-900 border-l-4 border-red-600 p-2.5 rounded-xl flex justify-between items-center px-4 shadow-xl">
    <div>
      <span className="text-[8px] font-black text-red-500 uppercase block">
        {plazoTipo === 'contado' ? t('contado') : plazoTipo ? t('mensualidad') : '---'}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-black text-white tracking-tighter">
          {plazoTipo && porcentajeEnganche > 0 ? `$${mensualidadFinal.toLocaleString('en-US', {maximumFractionDigits:0})}` : '$---'}
        </span>
        <span className="text-[8px] font-bold text-neutral-500 uppercase">{moneda}</span>
      </div>
    </div>
    <div className="text-right">
      <span className="bg-red-600/10 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-red-600/20 uppercase">
        {plazoTipo ? (plazoTipo === 'contado' ? t('contado') : `${mesesFinal} ${t('meses')}`) : '---'}
      </span>
    </div>
  </div>

  {/* SWITCH MONEDA */}
  <div className="flex items-center justify-center gap-1.5 mt-2">
    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Tipo de cambio</span>
    <button onClick={() => { setMoneda('MXN'); setUltimaAccion('moneda'); }} className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${moneda === 'MXN' ? 'bg-white text-black border-white' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>
      🇲🇽 MXN
    </button>
    <button onClick={() => { setMoneda('USD'); setUltimaAccion('moneda'); }} className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${moneda === 'USD' ? 'bg-white text-black border-white' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>
      🇺🇸 USD
    </button>
  </div>
</div>

              {/* MESA DE DISEÑO */}
              <div className="space-y-4 mt-4 max-h-[40vh] overflow-y-auto scrollbar-thin pr-1
                [&::-webkit-scrollbar]:w-1 
                [&::-webkit-scrollbar-track]:bg-transparent 
                [&::-webkit-scrollbar-thumb]:bg-neutral-700 
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:hover:bg-blue-500">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{t('sueño')}</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Casa', 'Lote habitacional'].map((s) => (
                      <button key={s} onClick={() => { setTipoSueño(s); setUltimaAccion('tipoSueño'); }} className={`py-2 rounded-xl text-xs font-bold border transition-all ${tipoSueño === s ? 'bg-white text-black border-white' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>{s}</button>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <button onClick={() => { setTipoSueño('Negocio'); setUltimaAccion('tipoSueño'); }} className={`px-8 py-2 rounded-xl text-xs font-bold border transition-all ${tipoSueño === 'Negocio' ? 'bg-white text-black border-white' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>Negocio</button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{t('ubicacion')}</label>
                  <select value={ubicacion} onChange={(e) => { setUbicacion(e.target.value); setUltimaAccion('ubicacion'); }} className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-white">
                    <option value="">{t('seleccionaDesarrollo')}</option>
                    <option value="Costa Diamante">Costa Diamante (Cancún)</option>
                    <option value="Selva Mágica">Selva Mágica (Tulum)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                    <span>{t('metros')}</span>
                    <span className="text-white text-sm font-mono">{metros} m²</span>
                  </div>
                  <input type="range" min="140" max="500" step="10" value={metros} onChange={(e) => { setMetros(Number(e.target.value)); setUltimaAccion('metros'); }} className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{t('plazo')}</label>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'contado', label: t('contado') },
                      { id: '20_años', label: '20 años' },
                      { id: '30_años', label: '30 años' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setPlazoTipo(p.id); setUltimaAccion('plazo'); }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          plazoTipo === p.id 
                          ? 'bg-white text-black border-white' 
                          : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{t('enganche')}</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[0.01, 0.05, 0.10].map((pct) => (
                      <button key={pct} onClick={() => { setPorcentajeEnganche(pct); setUltimaAccion('enganche'); }} className={`py-2 rounded-xl text-xs font-bold border transition-all ${porcentajeEnganche === pct ? 'bg-blue-600 border-blue-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}>
                        {pct * 100}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button disabled={!tipoSueño || !ubicacion || !plazoTipo || porcentajeEnganche === 0} onClick={() => setPasoActual(1)} className="w-full bg-white text-black py-3 rounded-xl text-sm font-black uppercase tracking-tighter hover:bg-blue-500 hover:text-white transition-all disabled:opacity-20 active:scale-95 shadow-xl">{t('botonFolio')}</button>
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
                  <h2 className="text-3xl font-bold">{t('paso1titulo')}</h2>
                  <p className="text-neutral-400 text-base">{t('paso1texto')}</p>
                  <button onClick={() => setPasoActual(2)} className="w-full bg-blue-600 py-5 rounded-2xl text-lg font-black uppercase">{t('paso1si')}</button>
                  <button onClick={() => setPasoActual(0)} className="text-neutral-500 text-base font-bold uppercase tracking-widest">{t('paso1no')}</button>
                </div>
              )}

              {/* PASO 2: FORMULARIO DE CONTACTO */}
{pasoActual === 2 && (
  <div className="space-y-6 animate-in fade-in duration-300">
    {/* Título eliminado como pediste */}
    
    <div className="space-y-4">
      {/* 1. Input de Nombre */}
      <input 
        required 
        placeholder={t('form.name')} 
        className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
        value={nombre} 
        onChange={(e) => setNombre(e.target.value)} 
      />

      {/* 2. Input de Celular Principal */}
      <input 
        required 
        placeholder="Número de Celular" 
        className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
        value={telefono} 
        onChange={(e) => setTelefono(e.target.value)} 
      />

      {/* 3. Input de WhatsApp (Aparece por defecto) */}
      {/* Se oculta solo cuando esMismoWhatsApp es TRUE */}
      {!esMismoWhatsApp && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <input 
            placeholder="Número de WhatsApp" 
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            // Aquí puedes usar un estado nuevo si quieres guardar el WhatsApp por separado
            onChange={(e) => console.log(e.target.value)} 
          />
        </div>
      )}

      {/* Switch: Al presionar la barrita, desaparece el input de arriba */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest italic">
          ¿Usar el mismo para WhatsApp?
        </span>
        <button 
          onClick={() => setEsMismoWhatsApp(!esMismoWhatsApp)} 
          className={`w-10 h-5 rounded-full relative transition-colors ${esMismoWhatsApp ? 'bg-green-500' : 'bg-neutral-800'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${esMismoWhatsApp ? 'left-6' : 'left-1'}`} />
        </button>
      </div>

      <button 
        disabled={!nombre || !telefono} 
        onClick={() => setPasoActual(3)} 
        className="w-full bg-blue-600 py-5 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl disabled:opacity-20 active:scale-95 transition-all"
      >
        {t('paso2siguiente')}
      </button>
      
      <button 
        onClick={() => setPasoActual(1)} 
        className="block w-full text-center text-[10px] font-black text-neutral-500 uppercase tracking-widest pt-2"
      >
        Atrás
      </button>
    </div>
  </div>
)}

              {pasoActual === 3 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">{t('paso3titulo')}</h2>
                  <input required type="email" placeholder={t('form.email')} className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-5 text-base text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <textarea placeholder={t('paso3notas')} className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-5 text-base text-white h-28" value={notas} onChange={(e) => setNotas(e.target.value)} />
                  <button disabled={loading || !email} onClick={enviarCotizacion} className="w-full bg-green-600 py-5 rounded-2xl text-lg font-black uppercase">{loading ? t('paso3procesando') : t('paso3enviar')}</button>
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* PASO 4: ÉXITO                              */}
          {/* ========================================== */}
          {pasoActual === 4 && resultado && (
            <div className="text-center space-y-8 animate-in zoom-in duration-500 py-6">
              {/* Imagen de Celebración */}
              <img 
                src="/guardian/Celebrando.png" 
                alt="Celebrando" 
                className="w-32 h-32 object-contain mx-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
              />
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-tight">
                    {t('paso4titulo')}, {nombre}!
                  </h2>
                  <p className="text-neutral-400 font-medium italic">
                    Tu sueño está un paso más cerca de convertirse en realidad.
                  </p>
                </div>

                {/* Caja del Folio */}
                <div className="bg-neutral-950/80 py-10 rounded-[3rem] border border-blue-500/30 shadow-2xl backdrop-blur-sm">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Tu Folio Oficial</p>
                  <span className="text-6xl font-mono font-black text-white tracking-tighter drop-shadow-sm">
                    {resultado.folio_texto}
                  </span>
                </div>

                <div className="px-4 space-y-4">
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Agradecemos tu confianza en <span className="text-white font-bold">Mi Sueño Mexicano</span>. Revisa tu correo electrónico donde encontrarás más información detallada.
                  </p>
                </div>
              </div>

              {/* Botón de WhatsApp */}
              <button 
                onClick={() => {
                  const msg = `¡Hola Alfonso! Soy ${nombre}. Mi Folio es ${resultado.folio_texto}. Coticé un ${tipoSueño} en ${ubicacion} de ${metros}m2 con enganche del ${porcentajeEnganche*100}% a ${plazoTipo === 'contado' ? 'contado' : plazoTipo === '20_años' ? '20 años' : '30 años'}.`;
                  window.open(`https://wa.me/${WHATSAPP_ALFONSO}?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-6 rounded-[2rem] text-xl font-black uppercase flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,211,102,0.3)] transition-all active:scale-95"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.3 1.592 5.548 0 10.061-4.512 10.063-10.058 0-2.69-1.044-5.217-2.941-7.115-1.897-1.897-4.425-2.943-7.117-2.943-5.556 0-10.069 4.513-10.07 10.059-.001 2.154.593 3.946 1.72 5.741l-1.016 3.71 3.818-1.001c-.163.084-.316.152-.316.152zm10.744-4.57c-.287-.144-1.7-.839-1.987-.944-.288-.105-.497-.158-.707.158-.21.315-.813 1.025-.996 1.235-.183.21-.366.236-.653.092-.287-.144-1.21-.447-2.305-1.424-.852-.759-1.427-1.7-1.594-1.987-.167-.287-.018-.442.126-.585.13-.129.287-.335.431-.503.144-.168.191-.287.287-.478.096-.191.048-.359-.024-.503-.072-.144-.707-1.706-.97-2.338-.255-.618-.517-.534-.707-.544-.183-.01-.393-.012-.603-.012s-.551.079-.839.393c-.288.315-1.101 1.077-1.101 2.623s1.127 3.046 1.284 3.255c.158.21 2.219 3.389 5.375 4.755.751.325 1.336.52 1.792.665.754.239 1.44.205 1.982.124.605-.09 1.701-.696 1.94-1.365.24-.668.24-1.24.168-1.365-.072-.126-.268-.21-.555-.354z" />
                </svg>
                {t('paso4whatsapp')}
              </button>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
