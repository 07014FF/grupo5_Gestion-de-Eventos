import { Link, Outlet, useLocation } from "react-router-dom";
import { Container } from "../componentes/UI";
import { useAuth } from "../auth/AuthContext";

export default function Layout(){
  const loc = useLocation();
  const { user, logout } = useAuth();
  const pill = (active:boolean) =>
    `px-4 py-2 rounded-xl font-semibold ${active ? "bg-black text-white" : "text-ink-900 hover:bg-gray-100"}`;

  const isHome = loc.pathname === "/";

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <Container>
          <div className="h-16 flex items-center justify-between">
            <Link to="/" className="font-extrabold text-lg tracking-tight">
              Ingreso<span className="text-brand">QR</span>
            </Link>

            <nav className="flex items-center gap-2">
              <Link to="/" className={pill(isHome)}>Eventos</Link>

              {!user && (
                <Link to="/iniciar-sesion" className="px-4 py-2 rounded-xl font-semibold bg-black text-white">
                  Iniciar sesión
                </Link>
              )}

              {user && user.isOrganizer && (
                <Link to="/organizador" className={pill(loc.pathname.startsWith("/organizador"))}>
                  Organizador
                </Link>
              )}

              {user && (
                <button onClick={logout} className="px-3 py-2 text-sm rounded-lg hover:bg-gray-100">
                  Salir
                </button>
              )}
            </nav>
          </div>
        </Container>
      </header>

      {isHome && (
  <section className="relative overflow-hidden text-white py-16">
    {/* Carrusel de fondo */}
   <div className="absolute inset-0 z-0 overflow-hidden">
  <div className="bg-slide" style={{ backgroundImage: "url('https://yurimaguasonline.com/wp-content/uploads/2021/07/Carnaval-de-Iquitos.jpg')" }}></div>
  <div className="bg-slide" style={{ backgroundImage: "url('https://illapa.com/wp-content/uploads/2024/04/Fiesta-de-la-anaconda.webp')" }}></div>
  <div className="bg-slide" style={{ backgroundImage: "url('https://blog.viajesmachupicchu.travel/wp-content/uploads/2024/11/danza-de-la-boa-1024x664.jpg')" }}></div>
  <div className="absolute inset-0 bg-black/50"></div>
</div>


    

    <Container>
      <div className="relative z-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold drop-shadow-lg">
          Descubre experiencias increíbles
        </h1>
        <p className="mt-2 text-white/90">Encuentra los mejores eventos cerca de ti</p>
      </div>

      {/* Buscador */}
      <form
        onSubmit={(e)=>{
          e.preventDefault();
          const q = (e.currentTarget as any).q.value.trim();
          const cat = (e.currentTarget as any).cat?.value ?? "";
          const u = new URLSearchParams();
          if (q) u.set("q", q);
          if (cat) u.set("cat", cat);
          window.location.href = "/?"+u.toString();
        }}
        className="relative z-10 mt-8 mx-auto max-w-3xl rounded-full bg-white shadow-lg p-2 flex items-center gap-2"
      >
        <input
          name="q"
          placeholder="Buscar eventos, artistas, lugares..."
          className="flex-1 px-5 py-3 text-ink-900 rounded-full outline-none"
        />
        <button className="px-5 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-600 transition">
          🔎 Buscar
        </button>
      </form>

      {/* Categorías */}
      <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
        {[
          {k:"",      label:"Todos", icon:"🪄"},
          {k:"musica",label:"Música", icon:"🎵"},
          {k:"cultura",label:"Cultura", icon:"🎨"},
          {k:"deportes",label:"Deportes", icon:"⚽"},
          {k:"entretenimiento",label:"Entretenimiento", icon:"🎭"},
          {k:"gastronomia",label:"Gastronomía", icon:"🍽️"},
        ].map(x=>(
          <button
            key={x.k}
            onClick={()=>{
              const p = new URLSearchParams(window.location.search);
              if (x.k) p.set("cat", x.k); else p.delete("cat");
              window.location.href = "/?"+p.toString();
            }}
            className="rounded-full border border-white/50 bg-white/20 backdrop-blur px-4 py-2 hover:bg-white/30 transition"
            title={x.label}
          >
            <span className="mr-1">{x.icon}</span>{x.label}
          </button>
        ))}
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
