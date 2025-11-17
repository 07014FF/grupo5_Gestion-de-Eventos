// src/modulos/organizador/Panel.tsx
import { Link } from "react-router-dom";
import { eventsMock } from "../../datos/mock";
import { Button, Card, CardBody, Container } from "../../componentes/UI";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// 1. REGISTRAR LOS COMPONENTES DEL GRÁFICO
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// 2. DATOS DE SIMULACIÓN PARA EL GRÁFICO
const chartData = {
  labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  datasets: [
    {
      label: 'Entradas Vendidas',
      data: [120, 150, 210, 180, 250, 310, 290, 320, 295, 330, 280, 420],
      borderColor: '#E30613', // Tu color 'brand'
      backgroundColor: 'rgba(227, 6, 19, 0.1)',
      fill: true,
      tension: 0.4,
    },
  ],
};

// Componente de métrica reutilizable
function StatCard({ label, value, growth }: { label: string; value: string; growth?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-soft">
      <p className="text-sm text-ink-600">{label}</p>
      <p className="text-4xl font-bold text-ink-900 mt-1">{value}</p>
      {growth && <p className="text-sm text-green-500 font-semibold mt-1">{growth}</p>}
    </div>
  );
}

export default function Panel() {
  return (
    <Container>
      {/* --- SECCIÓN DE ANÁLISIS DE RENDIMIENTO --- */}
      <div  className="space-y-8">
        <h1 className="text-3xl font-bold text-ink-900">Dashboard del Organizador</h1>
        <p className="text-ink-700 mt-1">Tu centro de control para eventos y métricas.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-soft">
        <h2 className="text-xl font-semibold mb-1">Evolución de Entradas</h2>
        <p className="text-sm text-ink-600 mb-4">Métricas clave del último año.</p>
        <div className="h-64"> {/* Contenedor para controlar altura del gráfico */}
          <Line data={chartData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Entradas Totales" value="3,264" growth="+12.5% vs mes anterior" />
        <StatCard label="Ingresos Totales" value="S/ 24,500" />
        <StatCard label="Eventos Activos" value="18" />
      </div>

      {/* --- SECCIÓN DE MIS EVENTOS --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Mis Eventos</h2>
          <Link to="/organizador/nuevo"><Button>+ Crear Evento</Button></Link>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventsMock.map(e => (
            <Card key={e.id}>
              <img src={e.banner} className="rounded-t-2xl w-full h-40 object-cover" alt={e.name}/>
              <CardBody>
                <h3 className="font-semibold text-ink-900 truncate">{e.name}</h3>
                <p className="text-sm text-ink-700">{e.venue} · {new Date(e.date).toLocaleDateString()}</p>
                <div className="mt-4">
                  <Link to={`/organizador/${e.id}`}>
                    <Button variant="secondary" className="w-full">Ver Detalle</Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </Container>
  );
}