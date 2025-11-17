// src/componentes/Footer.tsx
import { Link } from "react-router-dom";
import { Container } from "./UI";

export function Footer() {
  return (
    // 👇 Change the background color here
    <footer className="bg-emerald-800 text-white mt-auto"> {/* Changed bg-ink-900 to bg-emerald-800 */}
      <Container>
        <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-white"> {/* Ensure title is white */}
              EVENT APP
            </h3>
            {/* Adjusted text color for better contrast on green */}  
            <p className="text-emerald-200 text-sm"> 
              Tu puerta de entrada a experiencias culturales inolvidables en Iquitos y toda la selva.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              {/* Adjusted link colors */}
              <li><Link to="/acerca-de" className="text-emerald-200 hover:text-white">Acerca de Nosotros</Link></li>
              <li><Link to="/eventos" className="text-emerald-200 hover:text-white">Todos los Eventos</Link></li>
              <li><Link to="/privacidad" className="text-emerald-200 hover:text-white">Política de Privacidad</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contáctanos</h3>
             {/* Adjusted text color */}
            <p className="text-emerald-200 text-sm">
              Email: contacto@ingresoqr.pe<br/>
              Ubicación: Iquitos, Loreto, Perú
            </p>
          </div>
        </div>
         {/* Adjusted border and text color */}
        <div className="text-center text-sm text-emerald-300 border-t border-emerald-700 py-6">
          © {new Date().getFullYear()} EVENT APP. Todos los derechos reservados.
        </div>
      </Container>
    </footer>
  );
}