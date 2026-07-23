// zona-utils.js
let municipiosCache = null;

export async function loadMunicipios() {
    if (municipiosCache) return municipiosCache;
    const resp = await fetch('../municipios.json');
    if (!resp.ok) throw new Error('Não foi possível carregar municipios.json');
    municipiosCache = await resp.json();
    return municipiosCache;
}