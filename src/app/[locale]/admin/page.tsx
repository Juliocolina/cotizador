'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

interface Proyecto {
  id: string;
  nombre_desarrollo: string;
  ciudad: string;
  precio_m2_base: number;
  precio_m2_usd: number;
  precio_m2_financiado: number;
  precio_m2_usd_financiado: number;
  enganche_minimo: number;
  meses_msi: number;
  lotes_disponibles: number;
  link_whatsapp: string | null;
  activo: boolean;
}

interface Lead {
  id: number;
  folio_texto: string;
  nombre_cliente: string;
  telefono_cliente: string;
  email_cliente: string;
  idioma: string;
  notas: string | null;
  ip_cliente: string;
  tipo_sueno: string;
  ubicacion: string;
  metros_cuadrados: number;
  porcentaje_enganche: number;
  monto_total: number;
  monto_enganche: number;
  monto_a_financiar: number;
  mensualidad_estimada: number;
  plazo_tipo: string;
  meses_totales: number;
  moneda: string;
  whatsapp_principal: boolean;
  estatus: string;
  creado_en: string;
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [tab, setTab] = useState<'leads' | 'config'>('leads');
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [nuevoProyecto, setNuevoProyecto] = useState({ nombre_desarrollo: '', ciudad: '', precio_m2_base: 1500, precio_m2_usd: 85, precio_m2_financiado: 2100, precio_m2_usd_financiado: 120, enganche_minimo: 0.01, meses_msi: 36, lotes_disponibles: 50 });
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'es';

  useEffect(() => {
    let ignore = false;
    Promise.all([
      supabase.from('leads_cotizaciones').select('*').order('creado_en', { ascending: false }),
      supabase.from('configuracion_proyectos').select('*').order('nombre_desarrollo')
    ]).then(([leadsRes, proyRes]) => {
      if (ignore) return;
      if (!leadsRes.error && leadsRes.data) setLeads(leadsRes.data);
      if (!proyRes.error && proyRes.data) setProyectos(proyRes.data);
      setLoading(false);
    });
    return () => { ignore = true; };
  }, []);

  const guardarPrecio = async (id: string, campo: string, valor: number) => {
    setGuardando(true);
    await supabase.from('configuracion_proyectos').update({ [campo]: valor }).eq('id', id);
    setGuardando(false);
  };

  const agregarProyecto = async () => {
    if (!nuevoProyecto.nombre_desarrollo || !nuevoProyecto.ciudad) return;
    const { data, error } = await supabase.from('configuracion_proyectos').insert([nuevoProyecto]).select().single();
    if (!error && data) {
      setProyectos(prev => [...prev, data]);
      setNuevoProyecto({ nombre_desarrollo: '', ciudad: '', precio_m2_base: 1500, precio_m2_usd: 85, precio_m2_financiado: 2100, precio_m2_usd_financiado: 120, enganche_minimo: 0.01, meses_msi: 36, lotes_disponibles: 50 });
    }
  };

  const toggleProyecto = async (id: string, activo: boolean) => {
    await supabase.from('configuracion_proyectos').update({ activo }).eq('id', id);
    setProyectos(prev => prev.map(p => p.id === id ? { ...p, activo } : p));
  };

  const eliminarProyecto = async (id: string) => {
    await supabase.from('configuracion_proyectos').delete().eq('id', id);
    setProyectos(prev => prev.filter(p => p.id !== id));
  };

  const updateEstatus = async (id: number, estatus: string) => {
    const { error } = await supabase
      .from('leads_cotizaciones')
      .update({ estatus })
      .eq('id', id);

    if (!error) setLeads(prev => prev.map(l => l.id === id ? { ...l, estatus } : l));
  };

  const exportarCSV = () => {
    if (leads.length === 0) return;
    const headers = ["Fecha","Folio","Nombre","Email","Telefono","Ubicacion","Metros","Total","Mensualidad","Estatus"];
    const rows = leads.map(l => [
      formatFecha(l.creado_en), l.folio_texto, l.nombre_cliente, l.email_cliente,
      l.telefono_cliente, l.ubicacion, l.metros_cuadrados, l.monto_total,
      l.mensualidad_estimada, l.estatus
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `Leads_MiSuenoMexicano_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/admin/login`);
  };

  const ubicacionTop = leads.length > 0
    ? Object.entries(leads.reduce<Record<string, number>>((acc, l) => {
        acc[l.ubicacion] = (acc[l.ubicacion] || 0) + 1;
        return acc;
      }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
    : '—';

  const formatFecha = (fecha: string) => new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatMonto = (monto: number, moneda: string) => `$${monto?.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${moneda}`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Panel Admin</h1>
          <p className="text-xs text-neutral-400">Mi Sueño Mexicano</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('leads')} className={`text-xs px-4 py-2 rounded-lg border transition-colors ${tab === 'leads' ? 'bg-blue-600 border-blue-500' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'}`}>Leads</button>
          <button onClick={() => setTab('config')} className={`text-xs px-4 py-2 rounded-lg border transition-colors ${tab === 'config' ? 'bg-blue-600 border-blue-500' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'}`}>Configuración</button>
          <button onClick={exportarCSV} className="text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-4 py-2 rounded-lg transition-colors">📥 CSV</button>
          <button onClick={logout} className="text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-4 py-2 rounded-lg transition-colors">Salir</button>
        </div>
      </div>

      {tab === 'config' && (
        <div className="space-y-6 mb-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h2 className="text-sm font-bold mb-4">Desarrollos</h2>
            <div className="space-y-3 mb-4">
              {proyectos.map(p => (
                <div key={p.id} className="bg-neutral-950 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${p.activo ? 'text-white' : 'text-neutral-600 line-through'}`}>{p.nombre_desarrollo}</span>
                      <span className="text-xs text-neutral-500">({p.ciudad})</span>
                      <span className="text-[10px] text-neutral-600 bg-neutral-800 px-2 py-0.5 rounded">{p.lotes_disponibles} lotes</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleProyecto(p.id, !p.activo)} className={`text-[10px] px-2 py-1 rounded ${p.activo ? 'bg-green-500/20 text-green-400' : 'bg-neutral-800 text-neutral-500'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </button>
                      <button onClick={() => eliminarProyecto(p.id)} className="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-400">Eliminar</button>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-500 font-semibold uppercase">Precio Contado (m²)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-500">🇲🇽 MXN</label>
                      <input type="number" value={p.precio_m2_base} onChange={e => setProyectos(prev => prev.map(x => x.id === p.id ? { ...x, precio_m2_base: Number(e.target.value) } : x))} onBlur={() => guardarPrecio(p.id, 'precio_m2_base', p.precio_m2_base)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500">🇺🇸 USD</label>
                      <input type="number" value={p.precio_m2_usd} onChange={e => setProyectos(prev => prev.map(x => x.id === p.id ? { ...x, precio_m2_usd: Number(e.target.value) } : x))} onBlur={() => guardarPrecio(p.id, 'precio_m2_usd', p.precio_m2_usd)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-500 font-semibold uppercase">Precio Financiado (m²)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-500">🇲🇽 MXN</label>
                      <input type="number" value={p.precio_m2_financiado} onChange={e => setProyectos(prev => prev.map(x => x.id === p.id ? { ...x, precio_m2_financiado: Number(e.target.value) } : x))} onBlur={() => guardarPrecio(p.id, 'precio_m2_financiado', p.precio_m2_financiado)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500">🇺🇸 USD</label>
                      <input type="number" value={p.precio_m2_usd_financiado} onChange={e => setProyectos(prev => prev.map(x => x.id === p.id ? { ...x, precio_m2_usd_financiado: Number(e.target.value) } : x))} onBlur={() => guardarPrecio(p.id, 'precio_m2_usd_financiado', p.precio_m2_usd_financiado)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-500 font-semibold uppercase">Reglas</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-500">Enganche mín. %</label>
                      <input type="number" value={Math.round(p.enganche_minimo * 100)} onChange={e => setProyectos(prev => prev.map(x => x.id === p.id ? { ...x, enganche_minimo: Number(e.target.value) / 100 } : x))} onBlur={() => guardarPrecio(p.id, 'enganche_minimo', p.enganche_minimo)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500">Meses MSI</label>
                      <input type="number" value={p.meses_msi} onChange={e => setProyectos(prev => prev.map(x => x.id === p.id ? { ...x, meses_msi: Number(e.target.value) } : x))} onBlur={() => guardarPrecio(p.id, 'meses_msi', p.meses_msi)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500">Lotes disp.</label>
                      <input type="number" value={p.lotes_disponibles} onChange={e => setProyectos(prev => prev.map(x => x.id === p.id ? { ...x, lotes_disponibles: Number(e.target.value) } : x))} onBlur={() => guardarPrecio(p.id, 'lotes_disponibles', p.lotes_disponibles)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-neutral-800 pt-4">
              <p className="text-xs text-neutral-400 mb-2">Agregar desarrollo</p>
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="Nombre" value={nuevoProyecto.nombre_desarrollo} onChange={e => setNuevoProyecto({ ...nuevoProyecto, nombre_desarrollo: e.target.value })} className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500" />
                <input placeholder="Ciudad" value={nuevoProyecto.ciudad} onChange={e => setNuevoProyecto({ ...nuevoProyecto, ciudad: e.target.value })} className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={agregarProyecto} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">+ Agregar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'leads' && <>
      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-400">Total leads</p>
          <p className="text-2xl font-bold text-blue-400">{leads.length}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-400">Ubicación más popular</p>
          <p className="text-lg font-bold text-white">{ubicacionTop}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-400">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-400">{leads.filter(l => l.estatus !== 'contactado').length}</p>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-center text-neutral-400 animate-pulse">Cargando leads...</p>
      ) : leads.length === 0 ? (
        <p className="text-center text-neutral-500">No hay leads aún.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-xs">
            <thead className="bg-neutral-900 text-neutral-400">
              <tr>
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Cliente</th>
                <th className="p-3 text-left">Ubicación</th>
                <th className="p-3 text-right">Mensualidad</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Folio</th>
                <th className="p-3 text-center">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {leads.map(lead => (
                <tr key={lead.id} onClick={() => setSelected(lead)} className="hover:bg-neutral-900/50 transition-colors cursor-pointer">
                  <td className="p-3 text-neutral-400">{formatFecha(lead.creado_en)}</td>
                  <td className="p-3">
                    <p className="font-medium text-white">{lead.nombre_cliente}</p>
                    <p className="text-neutral-500">{lead.email_cliente}</p>
                  </td>
                  <td className="p-3">{lead.ubicacion}</td>
                  <td className="p-3 text-right font-mono text-blue-400">{formatMonto(lead.mensualidad_estimada, lead.moneda)}</td>
                  <td className="p-3 text-right font-mono">{formatMonto(lead.monto_total, lead.moneda)}</td>
                  <td className="p-3 text-center font-mono text-yellow-300">{lead.folio_texto}</td>
                  <td className="p-3 text-center">
                    <select
                      value={lead.estatus || 'pendiente'}
                      onChange={e => updateEstatus(lead.id, e.target.value)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${
                        lead.estatus === 'contactado'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="contactado">Contactado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </>}
      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold">{selected.nombre_cliente}</h2>
                <p className="text-xs text-neutral-400">{selected.folio_texto} · {formatFecha(selected.creado_en)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-neutral-500 hover:text-white text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-neutral-950 rounded-xl p-3 col-span-2">
                <p className="text-neutral-500 mb-2 font-semibold">Mesa de Diseño</p>
                <div className="grid grid-cols-3 gap-2">
                  <div><p className="text-neutral-500">Tipo</p><p className="text-white">{selected.tipo_sueno}</p></div>
                  <div><p className="text-neutral-500">Metros²</p><p className="text-white">{selected.metros_cuadrados}</p></div>
                  <div><p className="text-neutral-500">Enganche</p><p className="text-white">{selected.porcentaje_enganche * 100}%</p></div>
                </div>
              </div>

              <div className="bg-neutral-950 rounded-xl p-3 col-span-2">
                <p className="text-neutral-500 mb-2 font-semibold">Finanzas</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-neutral-500">Total</p><p className="text-blue-400 font-mono">{formatMonto(selected.monto_total, selected.moneda)}</p></div>
                  <div><p className="text-neutral-500">Enganche</p><p className="text-green-400 font-mono">{formatMonto(selected.monto_enganche, selected.moneda)}</p></div>
                  <div><p className="text-neutral-500">A financiar</p><p className="text-white font-mono">{formatMonto(selected.monto_a_financiar, selected.moneda)}</p></div>
                  <div><p className="text-neutral-500">Mensualidad</p><p className="text-yellow-300 font-mono">{formatMonto(selected.mensualidad_estimada, selected.moneda)}</p></div>
                  <div><p className="text-neutral-500">Plazo</p><p className="text-white">{selected.plazo_tipo === 'contado' ? 'Contado' : `${selected.meses_totales} meses`}</p></div>
                  <div><p className="text-neutral-500">Moneda</p><p className="text-white">{selected.moneda}</p></div>
                </div>
              </div>

              <div className="bg-neutral-950 rounded-xl p-3">
                <p className="text-neutral-500 mb-2 font-semibold">Contacto</p>
                <p className="text-white">{selected.telefono_cliente}</p>
                <p className="text-neutral-400">{selected.email_cliente}</p>
                <p className="text-neutral-500 mt-1">WhatsApp: {selected.whatsapp_principal ? 'Sí' : 'No'}</p>
              </div>

              <div className="bg-neutral-950 rounded-xl p-3">
                <p className="text-neutral-500 mb-2 font-semibold">Técnico</p>
                <p className="text-white">IP: {selected.ip_cliente}</p>
                <p className="text-neutral-400">Idioma: {selected.idioma?.toUpperCase()}</p>
                <p className="text-neutral-400">Ubicación: {selected.ubicacion}</p>
              </div>

              {selected.notas && (
                <div className="bg-neutral-950 rounded-xl p-3 col-span-2">
                  <p className="text-neutral-500 mb-1 font-semibold">Notas</p>
                  <p className="text-neutral-300">{selected.notas}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
