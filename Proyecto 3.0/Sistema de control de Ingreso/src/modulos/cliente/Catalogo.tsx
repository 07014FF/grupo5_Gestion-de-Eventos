import { Link } from "react-router-dom";
import { eventsMock, money } from "../../datos/mock";
import { Card, CardBody, Button, Badge } from "../../componentes/UI";

export default function Catalogo(){
  return (
    <div>
      <h2 className="text-2xl font-bold mb-5">Eventos disponibles</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventsMock.map((ev, idx)=>(
          <Card key={ev.id}>
            <div className="relative">
              <img src={ev.banner} alt={ev.name} className="rounded-t-2xl w-full h-44 object-cover" />
              {idx === 0 && <div className="absolute top-3 left-3"><Badge>Nuevo</Badge></div>}
            </div>
            <CardBody>
              <h3 className="font-semibold text-lg text-ink-900">{ev.name}</h3>
              <p className="text-sm text-ink-700">{ev.venue} · {new Date(ev.date).toLocaleString()}</p>
              <p className="text-sm mt-3 text-ink-700 line-clamp-2">{ev.description}</p>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-ink-700">
                  desde <strong className="text-ink-900">{money(ev.ticketTypes[0].price)}</strong>
                </span>
                <Link to={`/eventos/${ev.id}`}><Button>Ver evento</Button></Link>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
