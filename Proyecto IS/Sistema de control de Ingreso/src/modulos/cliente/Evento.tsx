import { useParams, useNavigate, Link } from "react-router-dom";
import { eventsMock, money } from "../../datos/mock";
import { Card, CardBody, Button, Select } from "../../componentes/UI";
import { useState } from "react";

export default function Evento(){
  const { id } = useParams();
  const ev = eventsMock.find(e=>e.id===id)!;
  const [tt, setTt] = useState(ev.ticketTypes[0].id);
  const nav = useNavigate();

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <img src={ev.banner} className="rounded-2xl w-full h-64 object-cover"/>
        <h1 className="text-3xl font-extrabold mt-5 text-ink-900">{ev.name}</h1>
        <p className="text-ink-700">{ev.venue} · {new Date(ev.date).toLocaleString()}</p>
        <p className="mt-4 text-ink-700 leading-relaxed">{ev.description}</p>
      </div>

      <aside className="md:col-span-1">
        <Card>
          <CardBody>
            <p className="text-sm text-ink-700">{ev.venue}</p>
            <p className="text-sm text-ink-700 mb-3">{new Date(ev.date).toLocaleString()}</p>

            <label className="text-sm font-semibold">Tipo de entrada</label>
            <Select value={tt} onChange={e=>setTt(e.target.value)} className="mt-1">
              {ev.ticketTypes.map(t=><option key={t.id} value={t.id}>{t.name} — {money(t.price)}</option>)}
            </Select>

           
<Button
  className="w-full mt-4"
  onClick={() =>
    nav("/compra", {
      state: {
        eventId: ev.id,
        ticketTypeId: tt, // el tipo de entrada seleccionado
      },
    })
  }
>
  Comprar ahora
</Button>

            <Link to="/" className="block text-xs text-gray-500 mt-3 hover:underline">← Volver a eventos</Link>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}
