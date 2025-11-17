// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router'; // Importas tu router
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/*
      El AuthProvider ya no va aquí.
      Lo moveremos a 'router.tsx' para que esté "dentro" del router
      y así pueda usar useNavigate() sin problemas.
    */}
    <RouterProvider router={router} />
  </React.StrictMode>
);