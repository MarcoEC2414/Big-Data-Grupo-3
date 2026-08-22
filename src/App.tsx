import { useState } from "react";
import { Login } from "./Login";
import { Shell } from "./components/Shell";

export default function App() {
  // Estado para verificar si existe un token en el almacenamiento local
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  // Callback que recibe el Login al iniciar sesión exitosamente
  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  // Si no hay token guardado, mostramos la pantalla de inicio de sesión
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Si el usuario está autenticado, renderizamos la aplicación dentro del Shell
  return (
    <Shell title="Dashboard General" subtitle="Sistema de Gestión Académica">
      <div className="p-6 space-y-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">
            ¡Bienvenido al Sistema!
          </h1>
          <p className="text-muted-foreground mt-2">
            Has iniciado sesión correctamente. Puedes utilizar el menú lateral para
            gestionar los alumnos, visualizar cursos y revisar reportes académicos.
          </p>
        </div>
      </div>
    </Shell>
  );
}