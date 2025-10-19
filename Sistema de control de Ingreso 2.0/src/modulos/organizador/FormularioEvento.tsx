import { useState } from "react";
import { Card, CardBody, Button, Input } from "../../componentes/UI";

type Ticket = { name:string; price:number; quota:number };

export default function FormularioEvento(){
  const [tickets, setTickets] = useState<Ticket[]>([{name:"General", price:25, quota:100}]);
  const edit = (i:number, v:Ticket) => setTickets(t => t.map((x,idx)=> idx===i? v : x));
  const add = () => setTickets(t => [...t, {name:"", price:0, quota:0}]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold">Nuevo evento</h2>
          <div className="space-y-3 mt-4">
            <Input placeholder="Nombre del evento" />
            <Input placeholder="Lugar" />
            <Input placeholder="Fecha y hora (YYYY-MM-DD HH:mm)" />
          </div>
        </CardBody>
      </Card>

      <Card className="md:col-span-2">
        <CardBody>
          <h3 className="font-semibold">Tipos de entrada</h3>
          <div className="space-y-2 mt-2">
            {tickets.map((t, i)=>(
              <div key={i} className="grid grid-cols-3 gap-2">
                <Input placeholder="Nombre" value={t.name} onChange={e=>edit(i,{...t, name:e.target.value})}/>
                <Input type="number" placeholder="Precio" value={t.price} onChange={e=>edit(i,{...t, price:+e.target.value})}/>
                <Input type="number" placeholder="Cupos" value={t.quota} onChange={e=>edit(i,{...t, quota:+e.target.value})}/>
              </div>
            ))}
            <Button onClick={add}>+ Agregar tipo</Button>
          </div>
          <Button className="mt-4">Guardar (mock)</Button>
        </CardBody>
      </Card>
    </div>
  );
}
