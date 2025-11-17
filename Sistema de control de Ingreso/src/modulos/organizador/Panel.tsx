import { Link } from "react-router-dom";
import { eventsMock } from "../../datos/mock";
import { Button, Card, CardBody, Stat } from "../../componentes/UI";

export default function Panel(){
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis eventos</h1>
        <Link to="/organizador/nuevo"><Button>+ Crear evento</Button></Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Entradas vendidas" value="120" />
        <Stat label="Check-ins de hoy" value="45" />
        <Stat label="Ingresos estimados" value="S/. 4,200" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventsMock.map(e=>(
          <Card key={e.id}>
            <img src={e.banner} className="rounded-t-2xl w-full h-36 object-cover"/>
            <CardBody>
              <h3 className="font-semibold text-ink-900">{e.name}</h3>
              <p className="text-sm text-ink-700">{e.venue} · {new Date(e.date).toLocaleString()}</p>
              <div className="mt-3">
                <Link to={`/organizador/${e.id}`}><Button>Ver detalle</Button></Link>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
