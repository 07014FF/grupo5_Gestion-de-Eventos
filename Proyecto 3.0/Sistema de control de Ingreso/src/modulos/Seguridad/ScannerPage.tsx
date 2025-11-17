// src/modulos/personal/ScannerPage.tsx
import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Container({ children, className, ...rest }: ContainerProps) {
  return (
    <div className={`max-w-7xl mx-auto px-4 ${className ?? ""}`} {...rest}>
      {children}
    </div>
  );
}

type ScanStatus = 'idle' | 'success' | 'error';

export function ScannerPage() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader', 
      { qrbox: { width: 250, height: 250 }, fps: 10 },
      false
    );

    const onScanSuccess = (decodedText: string) => {
      // Simulación de validación
      console.log(`QR Escaneado: ${decodedText}`);
      if (decodedText.includes('INVALIDO')) {
        setStatus('error');
        setMessage('ACCESO DENEGADO: Ticket no válido.');
      } else {
        setStatus('success');
        setMessage('ACCESO PERMITIDO: ¡Bienvenido!');
      }
    };

    const onScanFailure = (error: string) => {
      // No hacer nada en caso de fallo para no molestar al usuario
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      scanner.clear().catch(err => console.error("Fallo al limpiar scanner:", err));
    };
  }, []);

  return (
    <Container className="text-center">
      <h1 className="text-3xl font-bold text-ink-900">Escanear Acceso</h1>
      <p className="text-ink-700 mb-4">Apunta la cámara al código QR del ticket.</p>

      <div id="qr-reader" className="w-full max-w-lg mx-auto rounded-xl overflow-hidden border-4 border-gray-200"></div>

      {status !== 'idle' && (
        <div className={`mt-6 p-4 rounded-lg text-white font-bold text-xl ${status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {message}
        </div>
      )}
    </Container>
  );
}