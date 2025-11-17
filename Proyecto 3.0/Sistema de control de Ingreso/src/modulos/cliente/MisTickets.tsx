// src/modulos/cliente/MisTickets.tsx
import { Container } from "../../componentes/UI";

// Simulación de datos de tickets
const mockTickets = [
  { id: '1', eventName: 'Carnaval de Iquitos 2026', date: '25 de Febrero, 2026', qrData: 'TICKET-12345-CARNAVAL' },
  { id: '2', eventName: 'Fiesta de la Anaconda', date: '15 de Marzo, 2026', qrData: 'TICKET-67890-ANACONDA' },
];

export default function MisTicketsPage() {
  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink-900">Mis Tickets</h1>
        <p className="text-ink-700">Aquí encontrarás todos los códigos QR para tus eventos.</p>
      </div>

      <div className="space-y-6">
        {mockTickets.map(ticket => (
          <div key={ticket.id} className="bg-white p-6 rounded-xl shadow-soft flex flex-col md:flex-row items-center gap-6">
            {/* Placeholder para el QR */}
            <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">QR Code</span>
              {/* Aquí irá el componente <QRCodeDisplay text={ticket.qrData} /> */}
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-ink-900">{ticket.eventName}</h2>
              <p className="text-ink-700 mt-1">Fecha: {ticket.date}</p>
              <button className="mt-4 px-4 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-600">
                Descargar Ticket
              </button>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}