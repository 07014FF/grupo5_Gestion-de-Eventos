// src/app/router.tsx

import { createBrowserRouter } from "react-router-dom";
import Layout from "./layout";
import HomePage from "../Pages/Homepage";
import Evento from "../modulos/cliente/Evento";
import Compra from "../modulos/cliente/Compra";
import Exito from "../modulos/cliente/Exito";
import Panel from "../modulos/organizador/Panel";
import FormularioEvento from "../modulos/organizador/FormularioEvento";
import DetalleEvento from "../modulos/organizador/DetalleEvento";
import AuthPage from "../modulos/auth/AuthPage";
import { RegisterForm } from "../auth/RegisterForm";
import RequireOrganizer from "../auth/RequireOrganizer";

// --- PASO 1: Importa tu AuthProvider ---
import { AuthProvider } from "../auth/AuthContext";

export const router = createBrowserRouter([
  {
    path: "/",
    // --- PASO 2: Envuelve tu Layout con el AuthProvider ---
    // Así, el contexto está disponible para Layout y todos sus hijos.
    element: (
      <AuthProvider>
        <Layout />
      </AuthProvider>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "eventos/:id", element: <Evento /> },
      { path: "compra", element: <Compra /> },
      { path: "exito", element: <Exito /> },

      { path: "registrarse", element: <RegisterForm onSwitchToLogin={() => {}} /> },

      { path: "iniciar-sesion", element: <AuthPage /> },

      // Todas estas rutas ahora pueden usar useAuth() sin problemas
      {
        path: "organizador",
        element: (
          <RequireOrganizer>
            <Panel />
          </RequireOrganizer>
        ),
      },
      {
        path: "organizador/nuevo",
        element: (
          <RequireOrganizer>
            <FormularioEvento />
          </RequireOrganizer>
        ),
      },
      {
        path: "organizador/:id",
        element: (
          <RequireOrganizer>
            <DetalleEvento />
          </RequireOrganizer>
        ),
      },
    ],
  },
]);