// ZONAS/zone.js
import { ZonaMapController } from './ZonaMapController.js';
import { ZonaDataService } from './ZonaDataService.js';
import { ZonaStatistics } from './ZonaStatistics.js';
import { loadMunicipios } from './zona-utils.js';

const cidadeSelect = document.getElementById('cidade-select');
const anoSelect = document.getElementById('ano');
const turnoSelect = document.getElementById('turno');
const cargoSelect = document.getElementById('cargo');
const backBtn = document.getElementById('btn-back');
const loadingOverlay = document.getElementById('loading-overlay');
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('progress-bar');
const closePanelBtn = document.getElementById('close-panel');
const infoPanel = document.getElementById('info-panel');

const urlParams = new URLSearchParams(window.location.search);
let municipioCodigo = urlParams.get('municipio');
let ano = urlParams.get('ano') || '2024';
let turno = urlParams.get('turno') || '1';
let cargo = urlParams.get('cargo') || '0011';

anoSelect.value = ano;
turnoSelect.value = turno;
cargoSelect.value = cargo;

let mapController = null;
let dataService = new ZonaDataService();
let currentCityData = null;

function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

function updateProgress(current, total) {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${current} de ${total} zonas processadas (${percent}%)`;
}

function extractCityFromZoneName(nome) {
    if (!nome || typeof nome !== 'string') return null;
    const parts = nome.split(' - ');
    return parts[1] ? parts[1].trim().toUpperCase() : null;
}

function extractZoneNumber(nome) {
    if (!nome || typeof nome !== 'string') return null;
    const match = nome.match(/^(\d+)[ºª]?\s+ZONA/i);
    return match ? parseInt(match[1], 10) : null;
}

async function populateCitySelect() {
    try {
        const [allowList, municipios] = await Promise.all([
            fetch('./cidades-com-zonas.json').then(r => r.json()),
            loadMunicipios()
        ]);

        const allowed = new Set(
            allowList.map(item => `${String(item.municipio).toUpperCase()}|${String(item.uf).toUpperCase()}`)
        );

        const cidadesDisponiveis = municipios
            .filter(m => allowed.has(`${String(m.municipio).toUpperCase()}|${String(m.uf).toUpperCase()}`))
            .sort((a, b) => {
                const aLabel = `${a.municipio} - ${a.uf}`;
                const bLabel = `${b.municipio} - ${b.uf}`;
                return aLabel.localeCompare(bLabel, 'pt-BR');
            });

        cidadeSelect.innerHTML = '';

        for (const city of cidadesDisponiveis) {
            const option = document.createElement('option');
            option.value = String(city.codigo_tse);
            option.textContent = `${city.municipio} - ${city.uf}`;
            cidadeSelect.appendChild(option);
        }

        if (municipioCodigo && [...cidadeSelect.options].some(opt => opt.value === String(municipioCodigo))) {
            cidadeSelect.value = String(municipioCodigo);
        } else if (cidadeSelect.options.length > 0) {
            cidadeSelect.selectedIndex = 0;
            municipioCodigo = cidadeSelect.value;
        }
    } catch (err) {
        console.error('Erro ao montar seletor de cidades:', err);
        cidadeSelect.innerHTML = '<option value="">Erro ao carregar cidades</option>';
    }
}

async function init() {
    showLoading(true);

    try {
        if (!municipioCodigo) {
            throw new Error('Município não especificado.');
        }

        const municipios = await loadMunicipios();
        currentCityData = municipios.find(m => String(m.codigo_tse) === String(municipioCodigo));

        if (!currentCityData) {
            throw new Error('Município não encontrado no cadastro.');
        }

        if (!mapController) {
            mapController = new ZonaMapController('map');
        }

        const geoJsonResp = await fetch('./geojson-zonas/teste.geojson');
        if (!geoJsonResp.ok) {
            throw new Error('Arquivo teste.geojson não encontrado.');
        }

        const allZonesGeoJSON = await geoJsonResp.json();
        const cityName = String(currentCityData.municipio).toUpperCase();

        const filteredFeatures = (allZonesGeoJSON.features || []).filter(feature => {
            const nome = feature?.properties?.nome;
            const cityFromName = extractCityFromZoneName(nome);
            return cityFromName === cityName;
        });

        if (filteredFeatures.length === 0) {
            throw new Error(`Nenhuma zona encontrada para ${cityName}`);
        }

        filteredFeatures.forEach(feature => {
            const nome = feature?.properties?.nome;
            const zonaNum = extractZoneNumber(nome);
            if (zonaNum !== null) {
                feature.properties.zona = zonaNum;
            }
        });

        const filteredGeoJSON = {
            type: 'FeatureCollection',
            features: filteredFeatures
        };

        mapController.loadZonaGeoJSON(filteredGeoJSON);

        const totalZones = filteredFeatures.length;
        let processed = 0;
        const resultsMap = new Map();

        for (const feature of filteredFeatures) {
            const zonaNum = feature.properties.zona;

            const result = await dataService.fetchZoneResults(
                String(currentCityData.uf).toLowerCase(),
                String(currentCityData.codigo_tse),
                zonaNum,
                ano,
                turno,
                cargo
            );

            if (result) {
                resultsMap.set(zonaNum, result);
            }

            processed++;
            updateProgress(processed, totalZones);
        }

        mapController.applyResultsToZones(resultsMap);

        // Se você quiser somente a visualização por zona, pode comentar esta linha.
        ZonaStatistics.showAggregatedResults(resultsMap, currentCityData.municipio);

        mapController.onZoneClick((feature, zoneData) => {
            ZonaStatistics.showZoneDetails(feature, zoneData);
            infoPanel.classList.remove('hidden');
        });

        if (closePanelBtn) {
            closePanelBtn.onclick = () => infoPanel.classList.add('hidden');
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao carregar zonas: ' + err.message);
    } finally {
        showLoading(false);
    }
}

async function reloadWithNewParams() {
    ano = anoSelect.value;
    turno = turnoSelect.value;
    cargo = cargoSelect.value;

    const newUrl = `?municipio=${municipioCodigo}&ano=${ano}&turno=${turno}&cargo=${cargo}`;
    window.history.pushState({}, '', newUrl);

    await init();
}

cidadeSelect.addEventListener('change', async () => {
    municipioCodigo = cidadeSelect.value;
    const newUrl = `?municipio=${municipioCodigo}&ano=${ano}&turno=${turno}&cargo=${cargo}`;
    window.history.pushState({}, '', newUrl);
    await init();
});

anoSelect.addEventListener('change', reloadWithNewParams);
turnoSelect.addEventListener('change', reloadWithNewParams);
cargoSelect.addEventListener('change', reloadWithNewParams);

backBtn.addEventListener('click', () => {
    window.location.href = '../new%20index.html';
});

(async () => {
    await populateCitySelect();
    await init();
})();