// Prefija rutas absolutas ('/algo') con la base de montaje de la app (ej. '/ticket-crs'),
// necesario porque la app puede no estar desplegada en la raíz del dominio.
// Es un no-op si 'path' ya es una URL completa (ej. generada por Ziggy route()),
// para poder envolver valores de origen mixto sin riesgo de doble prefijo.
export function url(path) {
    if (!path || /^([a-z][a-z\d+\-.]*:)?\/\//i.test(path)) {
        return path;
    }
    return `${window.APP_BASE_PATH || ''}${path}`;
}
