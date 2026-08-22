import { useState } from "react";

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        onLoginSuccess(data.token);
      } else {
        setError(data.error || "Credenciales incorrectas");
      }
    } catch {
      setError("No se pudo conectar con el servidor backend.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-border bg-card p-6 rounded-xl shadow-sm space-y-4"
      >
        <h2 className="text-xl font-bold text-center">Iniciar Sesión</h2>

        {error && (
          <div className="p-2 text-xs bg-red-500/10 text-red-500 rounded border border-red-500/20 text-center">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground">Correo</label>
          <input
            type="email"
            placeholder="admin@senati.pe"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 mt-1 border border-border rounded bg-background text-sm"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Contraseña</label>
          <input
            type="password"
            placeholder="123"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mt-1 border border-border rounded bg-background text-sm"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground p-2 rounded font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}