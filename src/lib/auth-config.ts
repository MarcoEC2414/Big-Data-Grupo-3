/**
 * Configuración centralizada de autenticación y control de acceso.
 *
 * Todo el sistema reconoce un único administrador (ADMIN_EMAIL) y exige
 * que cualquier cuenta pertenezca al dominio institucional de SENATI
 * (INSTITUTIONAL_EMAIL_DOMAIN). Ningún otro archivo debe declarar listas
 * propias de administradores: deben importar las utilidades de este módulo.
 */

export const ADMIN_EMAIL = "admin@senati.pe";
export const INSTITUTIONAL_EMAIL_DOMAIN = "@senati.pe";

/**
 * Normaliza un correo (trim + minúsculas) para comparaciones consistentes.
 */
export function normalizarCorreo(correo?: string | null): string {
  return (correo || "").trim().toLowerCase();
}

/**
 * Valida que un correo pertenezca al dominio institucional de SENATI.
 */
export function esCorreoInstitucional(correo?: string | null): boolean {
  const c = normalizarCorreo(correo);
  return c.length > INSTITUTIONAL_EMAIL_DOMAIN.length && c.endsWith(INSTITUTIONAL_EMAIL_DOMAIN);
}

/**
 * Determina si un correo corresponde al administrador único del sistema.
 */
export function esAdministradorUnico(correo?: string | null): boolean {
  return normalizarCorreo(correo) === ADMIN_EMAIL;
}
