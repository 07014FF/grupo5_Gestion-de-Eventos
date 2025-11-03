// src/modulos/cliente/Exito.tsx
import { Link, useLocation } from "react-router-dom";
import { SecondaryButton, Button, Card, CardBody } from "../../componentes/UI";

export default function Exito(){
  const loc = useLocation() as {
    state?: { email?: string; eventName?: string; qrDataUrl?: string; total?: number; payload?: any }
  };
  const email = loc.state?.email ?? "(sin correo)";
  const eventName = loc.state?.eventName ?? "Evento";
  const qrDataUrl = loc.state?.qrDataUrl;

  return (
    <div className="max-w-2xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold">¡Compra exitosa!</h1>
      <p className="text-gray-700">
        Te enviamos tus entradas con código QR al correo <strong>{email}</strong>.
      </p>

      <Card>
        <CardBody className="flex flex-col items-center">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR de entrada" className="w-56 h-56" />
              <a href={qrDataUrl} download={`QR-${eventName}.png`} className="mt-3">
                <Button>Descargar QR</Button>
              </a>
            </>
          ) : (
            <p className="text-sm text-gray-600">No se encontró el QR (refresca o vuelve a comprar).</p>
          )}
        </CardBody>
      </Card>

      <div className="flex gap-2 justify-center">
        <Link to="/"><SecondaryButton>Volver a eventos</SecondaryButton></Link>
      </div>
    </div>
  );
}
