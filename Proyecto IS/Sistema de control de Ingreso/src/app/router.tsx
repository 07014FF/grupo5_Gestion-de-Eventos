import { createBrowserRouter } from "react-router-dom";
import Layout from "./layout";
import Catalogo from "../modulos/cliente/Catalogo";
import Evento from "../modulos/cliente/Evento";
import Compra from "../modulos/cliente/Compra";
import Exito from "../modulos/cliente/Exito";
import Panel from "../modulos/organizador/Panel";
import FormularioEvento from "../modulos/organizador/FormularioEvento";
import DetalleEvento from "../modulos/organizador/DetalleEvento";

export const router = createBrowserRouter([
  { path:"/", element:<Layout/>, children:[
    { index:true, element:<Catalogo/> },
    { path:"eventos/:id", element:<Evento/> },
    { path:"compra", element:<Compra/> },
    { path:"exito", element:<Exito/> },
    { path:"organizador", element:<Panel/> },
    { path:"organizador/nuevo", element:<FormularioEvento/> },
    { path:"organizador/:id", element:<DetalleEvento/> },
  ] }
]);
