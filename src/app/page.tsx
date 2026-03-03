import { supabase } from '@/lib/supabase'

export default async function TestPage() {
  // Intentamos leer la tabla que acabas de crear en Supabase
  const { data, error } = await supabase
    .from('configuracion_proyectos')
    .select('*')

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🛠️ Diagnóstico de Conexión</h1>
      
      {error ? (
        <div style={{ color: 'red', border: '1px solid red', padding: '10px' }}>
          <p>❌ Error de conexión:</p>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      ) : (
        <div style={{ color: 'green', border: '1px solid green', padding: '10px' }}>
          <p>✅ ¡Conexión Exitosa!</p>
          <p>La app se comunicó con Supabase y recibió {data?.length} registros.</p>
        </div>
      )}
      
      <p style={{ marginTop: '20px', fontSize: '12px' }}>
        URL detectada: {process.env.NEXT_PUBLIC_SUPABASE_URL}
      </p>
    </div>
  )
}