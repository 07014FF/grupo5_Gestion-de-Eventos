import { useParams } from "react-router-dom";
import { eventsMock } from "../../datos/mock";
import { Card, CardBody, Stat } from "../../componentes/UI";

export default function DetalleEvento(){
  const { id } = useParams();
  const ev = eventsMock.find(e=>e.id===id)!;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{ev.name}</h1>
        <p className="text-gray-600">{ev.venue} · {new Date(ev.date).toLocaleString()}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Vendidas" value="120/380" />
        <Stat label="Check-ins" value="45" />
        <Stat label="Recaudado" value="S/. 4,200" />
      </div>

      <Card>
        <CardBody>
          <h3 className="font-semibold">Exportar</h3>
          <p className="text-sm text-gray-600">CSV / PDF (pendiente de implementar)</p>
        </CardBody>
      </Card>
    </div>
  );
}
