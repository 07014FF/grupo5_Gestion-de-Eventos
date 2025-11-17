import { useParams, useNavigate, Link } from "react-router-dom";
import { eventsMock, money } from "../../datos/mock";
import { Card, CardBody, Button, Select } from "../../componentes/UI";
import { useState, useEffect } from "react";

export default function Evento(){
  const { id } = useParams();
  const ev = eventsMock.find(e=>e.id===id)!;
  const [tt, setTt] = useState(ev.ticketTypes[0].id);
  const nav = useNavigate();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    // countdown simple: calcula tiempo restante hasta la fecha del evento
    const target = new Date(ev.date).getTime();
    const update = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft('En curso o finalizado');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    };
    update();
    const idt = setInterval(update, 60_000);
    return () => clearInterval(idt);
  }, [ev.date]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        {/* Banner más controlado: altura responsiva y mejor crop */}
        <div className="rounded-2xl overflow-hidden">
          <img src={ev.banner} className="w-full h-56 md:h-72 lg:h-80 object-cover object-center" alt={ev.name} />
        </div>

        <div className="mt-5">
          <h1 className="text-3xl font-extrabold text-ink-900">{ev.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-ink-700">
            <p>{ev.venue}</p>
            <span>·</span>
            <p>{new Date(ev.date).toLocaleString()}</p>
            {timeLeft && <span className="ml-4 text-sm text-gray-500">Cuenta regresiva: {timeLeft}</span>}
          </div>

          <p className="mt-4 text-ink-700 leading-relaxed">{ev.description}</p>

          {/* Ideas para más interactividad: mapa, galería, programa */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <button className="col-span-1 md:col-span-1 px-4 py-2 border rounded-lg text-sm hover:shadow">Ver mapa</button>
            <button className="col-span-1 md:col-span-1 px-4 py-2 border rounded-lg text-sm hover:shadow">Compartir</button>
            <a
              className="col-span-1 md:col-span-1 px-4 py-2 border rounded-lg text-sm hover:shadow inline-flex items-center justify-center"
              href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.name)}&dates=${new Date(ev.date).toISOString().replace(/[-:]|\.(\d{3})/g,'')}/${new Date(new Date(ev.date).getTime()+2*60*60*1000).toISOString().replace(/[-:]|\.(\d{3})/g,'')}&details=${encodeURIComponent(ev.description)}&location=${encodeURIComponent(ev.venue)}`}
              target="_blank"
              rel="noreferrer"
            >
              Añadir al calendario
            </a>
          </div>
        </div>
      </div>

      <aside className="md:col-span-1">
        <div className="sticky top-24">
          <Card>
            <CardBody>
              <p className="text-sm text-ink-700">{ev.venue}</p>
              <p className="text-sm text-ink-700 mb-3">{new Date(ev.date).toLocaleString()}</p>

              <label className="text-sm font-semibold">Tipo de entrada</label>
              <Select value={tt} onChange={e=>setTt(e.target.value)} className="mt-1">
                {ev.ticketTypes.map(t=><option key={t.id} value={t.id}>{t.name} — {money(t.price)}</option>)}
              </Select>

              {/* Disponibilidad */}
              <div className="mt-3 text-sm text-ink-700">
                {(() => {
                  const t = ev.ticketTypes.find(x=>x.id===tt)!;
                  return (
                    <>
                      <p>Disponibles: <strong>{t.quota}</strong></p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                        <div className="h-2 bg-green-600" style={{ width: `calc(${Math.max(0, Math.min(100, (t.quota/Math.max(1,t.quota))*100))}% )` }} />
                      </div>
                    </>
                  );
                })()}
              </div>

              <Button
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
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
        </div>
      </aside>
    </div>
  );
}
