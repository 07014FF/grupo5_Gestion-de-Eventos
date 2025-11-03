// src/modulos/cliente/Compra.tsx
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import QRCode from "qrcode";
import { eventsMock, money } from "../../datos/mock";
import { Card, CardBody, Button, Input, Select } from "../../componentes/UI";

// 👉 NUEVO: extendemos Buyer con campos de pago
type Buyer = {
  nombre: string;
  email: string;
  dni: string;
  telefono: string;
  cantidad: number;
  tarjeta: string;      // 16 dígitos
  titular: string;      // nombre en tarjeta
  vencimiento: string;  // MM/AA
  cvv: string;          // 3-4 dígitos
};

export default function Compra() {
  const nav = useNavigate();
  const loc = useLocation() as { state?: { eventId?: string; ticketTypeId?: string } };

  // fallback si vinieron sin state
  const ev = useMemo(() => {
    const id = loc.state?.eventId ?? "ev1";
    return eventsMock.find(e => e.id === id)!;
  }, [loc.state]);

  const [ticketTypeId, setTicketTypeId] = useState(loc.state?.ticketTypeId ?? ev.ticketTypes[0].id);
  const ticket = ev.ticketTypes.find(t => t.id === ticketTypeId)!;

  // 👉 NUEVO: inicializamos los nuevos campos
  const [buyer, setBuyer] = useState<Buyer>({
    nombre: "",
    email: "",
    dni: "",
    telefono: "",
    cantidad: 1,
    tarjeta: "",
    titular: "",
    vencimiento: "",
    cvv: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof Buyer, v: any) => setBuyer(b => ({ ...b, [k]: v }));

  const validate = () => {
    const err: Record<string, string> = {};
    if (!buyer.nombre.trim()) err.nombre = "Ingresa tu nombre completo";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) err.email = "Email inválido";
    if (!/^\d{8,12}$/.test(buyer.dni)) err.dni = "DNI/Doc. inválido (8-12 dígitos)";
    if (!/^\d{6,15}$/.test(buyer.telefono)) err.telefono = "Teléfono inválido (6-15 dígitos)";
    if (buyer.cantidad < 1) err.cantidad = "Mínimo 1 entrada";

    // 👉 NUEVO: validaciones de pago
    const cleanCard = buyer.tarjeta.replace(/\s+/g, "");
    if (!/^\d{16}$/.test(cleanCard)) err.tarjeta = "Número de tarjeta inválido (16 dígitos)";
    if (!buyer.titular.trim()) err.titular = "Ingresa el nombre del titular";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(buyer.vencimiento)) err.vencimiento = "Usa formato MM/AA";
    if (!/^\d{3,4}$/.test(buyer.cvv)) err.cvv = "CVV inválido";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const total = buyer.cantidad * ticket.price;

  const handlePay = async () => {
    if (!validate()) return;

    // payload que codificaremos en el QR (puede ser el ID real de la orden en backend)
    const payload = {
      evId: ev.id,
      evName: ev.name,
      ttId: ticket.id,
      ttName: ticket.name,
      qty: buyer.cantidad,
      buyer: {
        nombre: buyer.nombre,
        email: buyer.email,
        dni: buyer.dni,
        telefono: buyer.telefono
      },
      ts: Date.now(),
      nonce: Math.random().toString(36).slice(2, 10),
    };

    // Generamos el QR como DataURL (PNG)
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
      width: 400,
      margin: 1,
    });

    // Vamos a la pantalla de éxito con datos para mostrar
    nav("/exito", {
      state: {
        email: buyer.email,
        eventName: ev.name,
        qrDataUrl,
        payload,
        total,
      },
    });
  };

  // 👉 NUEVO: helpers de máscara visual (opcional)
  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

  const formatExp = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 4);
    if (clean.length <= 2) return clean;
    return clean.slice(0, 2) + "/" + clean.slice(2);
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Resumen / selección */}
      <div className="md:col-span-1">
        <Card>
          <CardBody>
            <h2 className="text-xl font-semibold">{ev.name}</h2>
            <p className="text-sm text-gray-600">{ev.venue} · {new Date(ev.date).toLocaleString()}</p>

            <label className="text-sm font-semibold mt-4 block">Tipo de entrada</label>
            <Select
              className="mt-1"
              value={ticketTypeId}
              onChange={e => setTicketTypeId(e.target.value)}
            >
              {ev.ticketTypes.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} — {money(t.price)}
                </option>
              ))}
            </Select>

            <label className="text-sm font-semibold mt-4 block">Cantidad</label>
            <Input
              type="number"
              min={1}
              value={buyer.cantidad}
              onChange={e => set("cantidad", Math.max(1, Number(e.target.value)))}
              className={errors.cantidad ? "border-red-400" : ""}
            />
            {errors.cantidad && <p className="text-xs text-red-600 mt-1">{errors.cantidad}</p>}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-700">Total</span>
              <strong>{money(total)}</strong>
            </div>
          </CardBody>
        </Card>
        <Link to="/" className="block text-xs text-gray-500 mt-3 hover:underline">← Volver a eventos</Link>
      </div>

      {/* Datos del comprador + Método de pago */}
      <div className="md:col-span-2">
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold">Datos del comprador</h3>

            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-sm">Nombre y Apellidos</label>
                <Input
                  placeholder="Ej: Ana Torres"
                  value={buyer.nombre}
                  onChange={e => set("nombre", e.target.value)}
                  className={errors.nombre ? "border-red-400" : ""}
                />
                {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
              </div>

              <div>
                <label className="text-sm">Email</label>
                <Input
                  placeholder="tucorreo@ejemplo.com"
                  value={buyer.email}
                  onChange={e => set("email", e.target.value)}
                  className={errors.email ? "border-red-400" : ""}
                />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="text-sm">DNI / Documento</label>
                <Input
                  placeholder="87654321"
                  value={buyer.dni}
                  onChange={e => set("dni", e.target.value)}
                  className={errors.dni ? "border-red-400" : ""}
                />
                {errors.dni && <p className="text-xs text-red-600 mt-1">{errors.dni}</p>}
              </div>

              <div>
                <label className="text-sm">Teléfono</label>
                <Input
                  placeholder="987654321"
                  value={buyer.telefono}
                  onChange={e => set("telefono", e.target.value)}
                  className={errors.telefono ? "border-red-400" : ""}
                />
                {errors.telefono && <p className="text-xs text-red-600 mt-1">{errors.telefono}</p>}
              </div>
            </div>

            {/* 👉 NUEVO: MÉTODO DE PAGO */}
            <h3 className="text-lg font-semibold mt-6">Método de pago</h3>

            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div className="md:col-span-2">
                <label className="text-sm">Número de tarjeta</label>
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={buyer.tarjeta}
                  onChange={e => set("tarjeta", formatCard(e.target.value))}
                  className={errors.tarjeta ? "border-red-400" : ""}
                />
                {errors.tarjeta && <p className="text-xs text-red-600">{errors.tarjeta}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm">Nombre del titular</label>
                <Input
                  placeholder="Como aparece en la tarjeta"
                  value={buyer.titular}
                  onChange={e => set("titular", e.target.value)}
                  className={errors.titular ? "border-red-400" : ""}
                />
                {errors.titular && <p className="text-xs text-red-600">{errors.titular}</p>}
              </div>

              <div>
                <label className="text-sm">Vencimiento (MM/AA)</label>
                <Input
                  placeholder="MM/AA"
                  value={buyer.vencimiento}
                  onChange={e => set("vencimiento", formatExp(e.target.value))}
                  className={errors.vencimiento ? "border-red-400" : ""}
                />
                {errors.vencimiento && <p className="text-xs text-red-600">{errors.vencimiento}</p>}
              </div>

              <div>
                <label className="text-sm">CVV</label>
                <Input
                  placeholder="123"
                  value={buyer.cvv}
                  onChange={e => set("cvv", e.target.value.replace(/\D/g, "").slice(0,4))}
                  className={errors.cvv ? "border-red-400" : ""}
                />
                {errors.cvv && <p className="text-xs text-red-600">{errors.cvv}</p>}
              </div>
            </div>

            <Button className="mt-4" onClick={handlePay}>
              Pagar (mock) y generar QR
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Al completar verás tu QR y lo enviaremos a <strong>{buyer.email || "tu correo"}</strong>.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
