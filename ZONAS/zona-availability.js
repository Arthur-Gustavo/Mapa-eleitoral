let availabilityCache = null;

export async function hasZonaData(municipioUppercase, ufUppercase) {
    if (availabilityCache === null) {
        try {
            const resp = await fetch('/ZONAS/cidades-com-zonas.json');
            if (!resp.ok) throw new Error('Allow-list not found');
            const list = await resp.json();

            availabilityCache = new Set(
                list.map(item => `${item.municipio}`.toUpperCase() + '|' + `${item.uf}`.toUpperCase())
            );
        } catch (e) {
            console.warn('Could not load zonas allow-list', e);
            availabilityCache = new Set();
        }
    }

    return availabilityCache.has(`${municipioUppercase}|${ufUppercase}`);
}