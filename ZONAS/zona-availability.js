let availabilityCache = null;

// Detecta automaticamente se está rodando no GitHub Pages
const BASE_PATH =
    window.location.hostname === 'arthur-gustavo.github.io'
        ? '/Mapa-eleitoral'
        : '';

export async function hasZonaData(municipioUppercase, ufUppercase) {
    if (availabilityCache === null) {
        try {
            const resp = await fetch(`${BASE_PATH}/ZONAS/cidades-com-zonas.json`);

            if (!resp.ok) {
                throw new Error('Allow-list not found');
            }

            const list = await resp.json();

            availabilityCache = new Set(
                list.map(item =>
                    `${item.municipio}`.toUpperCase() +
                    '|' +
                    `${item.uf}`.toUpperCase()
                )
            );
        } catch (e) {
            console.warn('Could not load zonas allow-list', e);
            availabilityCache = new Set();
        }
    }

    return availabilityCache.has(`${municipioUppercase}|${ufUppercase}`);
}