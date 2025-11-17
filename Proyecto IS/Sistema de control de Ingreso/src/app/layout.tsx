import { Link, Outlet, useLocation } from "react-router-dom";
import { Container } from "../componentes/UI";

export default function Layout(){
  const loc = useLocation();
  const pill = (active:boolean) =>
    `px-4 py-2 rounded-xl font-semibold ${active ? "bg-black text-white" : "text-ink-900 hover:bg-gray-100"}`;

  const isHome = loc.pathname === "/";

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <Container>
          <div className="h-16 flex items-center justify-between">
            <Link to="/" className="font-extrabold text-lg tracking-tight">Ingreso<span className="text-brand">QR</span></Link>
            <nav className="flex gap-2">
              <Link to="/" className={pill(loc.pathname === "/")}>Eventos</Link>
              <Link to="/organizador" className={pill(loc.pathname.startsWith("/organizador"))}>Organizador</Link>
            </nav>
          </div>
        </Container>
      </header>

      {isHome && (
        <section className="bg-gradient-to-r from-rose-50 to-white border-b">
          <Container>
            <div className="py-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-ink-900">
                Encuentra tu próximo <span className="text-brand">evento</span>
              </h1>
              <p className="text-ink-700 mt-2 max-w-2xl">
                Compra entradas seguras y recibe tu código QR al instante. Cultura, música y experiencias únicas.
              </p>
            </div>
          </Container>
        </section>
      )}

      <main className="py-8">
        <Container>
          <Outlet/>
        </Container>
      </main>
    </div>
  );
}
