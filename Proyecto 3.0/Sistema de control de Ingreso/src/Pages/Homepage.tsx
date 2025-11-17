// src/pages/HomePage.tsx
import { useSearchParams, Link } from "react-router-dom";
import { Container, Card, CardBody, Badge, Button } from "../componentes/UI";
import { eventsMock } from "../datos/mock"; // Asegúrate que la ruta a tus datos mock es correcta
import { Footer } from "../componentes/Footer";

// --- Componente de la sección Hero (con botones de categoría funcionales) ---
function HeroSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get("cat") || "";

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q") as string;
    
    const newParams = new URLSearchParams(searchParams);
    if (q) newParams.set("q", q); else newParams.delete("q");
    setSearchParams(newParams);
  };

  const handleCategoryClick = (categoryKey: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryKey) newParams.set("cat", categoryKey); else newParams.delete("cat");
    setSearchParams(newParams);
  };

  const categories = [
    { k: "", label: "Todos", icon: "🪄" },
    { k: "musica", label: "Música", icon: "🎵" },
    { k: "cultura", label: "Cultura", icon: "🎨" },
    { k: "deportes", label: "Deportes", icon: "⚽" },
    { k: "entretenimiento", label: "Entretenimiento", icon: "🎭" },
    { k: "gastronomia", label: "Gastronomía", icon: "🍽️" },
  ];

  return (
    <section className="relative h-[500px] flex items-center justify-center text-white">
      {/* Capa de Imagen de Fondo */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://yurimaguasonline.com/wp-content/uploads/2021/07/Carnaval-de-Iquitos.jpg')" }}
      ></div>
      {/* Capa de Superposición Oscura + Efecto Blur */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"></div>

      {/* Contenido */}
      <div className="relative z-10 w-full">
        <Container>
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold drop-shadow-lg">Descubre la Magia de la Amazonía</h1>
            <p className="mt-2 text-white/90 text-lg">Los mejores eventos culturales de Iquitos y la selva te esperan.</p>
          </div>
          <form onSubmit={handleSearch} className="mt-8 mx-auto max-w-3xl rounded-full bg-white shadow-lg p-2 flex items-center gap-2">
            <input name="q" defaultValue={searchParams.get("q") || ""} placeholder="Buscar por nombre de evento..." className="flex-1 px-5 py-3 text-ink-900 rounded-full outline-none bg-transparent" />
            <button type="submit" className="px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-600 transition">Buscar</button>
          </form>
          
          {/* --- BOTONES DE CATEGORÍA ACTUALIZADOS --- */}
          <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
            {categories.map(cat => (
              <button 
                key={cat.k} 
                onClick={() => handleCategoryClick(cat.k)} 
                className={`rounded-full border backdrop-blur px-4 py-2 hover:bg-white/30 transition text-sm font-semibold ${
                  currentCategory === cat.k 
                    ? 'bg-white text-ink-900 border-transparent' // Estilo activo
                    : 'border-white/50 bg-white/20 text-white' // Estilo inactivo
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </Container>
      </div>
    </section>
  );
}


// --- Componente principal de la página de inicio (con lista de eventos) ---
export default function HomePage() {
  // Aquí puedes añadir lógica de filtrado real basada en `useSearchParams()`
  // Por ahora, simplemente mostramos todos los eventos del mock.
  
  return (
    <>
      <HeroSection />
      <Container>
        <div className="py-12">
          <h2 className="text-3xl font-bold mb-8">Eventos Disponibles</h2>

          {/* --- LISTA DE EVENTOS ACTUALIZADA --- */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(eventsMock as AppEvent[]).map(e => (
              <Card key={e.id}>
                <img src={e.banner} className="rounded-t-2xl w-full h-48 object-cover" alt={e.name} />
                {e.isNew && <div className="absolute top-4 left-4"><Badge>Nuevo</Badge></div>}
                <CardBody>
                  <h3 className="text-xl font-semibold text-ink-900 truncate">{e.name}</h3>
                  <p className="text-sm text-ink-600 mt-1">{e.venue} · {new Date(e.date).toLocaleDateString()}</p>
                  <p className="text-ink-700 text-sm mt-3 line-clamp-2">{e.summary}</p> {/* line-clamp-2 limita a 2 líneas */}
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-ink-800 font-semibold">desde S/. {(e.price ?? 0).toFixed(2)}</p>
                    <Link to={`/eventos/${e.id}`}><Button>Ver evento</Button></Link>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </Container>

      <section className="bg-gray-50 py-16">
        <Container>
          <div className="text-center">
           <h2 className="text-3xl font-bold text-ink-900">Sobre EVENT APP</h2>
           <p className="mt-4 max-w-2xl mx-auto text-ink-700">Somos la plataforma líder en la gestión de accesos para eventos culturales en la Amazonía peruana, modernizando la tradición con tecnología segura y fácil de usar.</p>
          </div>
        </Container>
        
      </section>
      <Footer />
    </>
  );
}

type AppEvent = {
  id: string;
  name: string;
  date: string;
  venue?: string;
  banner?: string;
  summary?: string;
  isNew?: boolean;
  price?: number;
};