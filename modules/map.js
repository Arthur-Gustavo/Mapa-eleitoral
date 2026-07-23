import { getColorByPercentage, coresPartido } from './colors.js';

// Configurações do mapa
let map = null;
let layerGroup = null;

export function initMap() {
    if (map) {
        console.warn('Mapa já inicializado');
        return map;
    }

    console.log('Inicializando mapa...');
    map = L.map('map').setView([-1.5, -52], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    layerGroup = L.layerGroup().addTo(map);
    return map;
}

export function getMap() {
    return map;
}

export function getLayerGroup() {
    return layerGroup;
}

export function setLayerGroup(newLayerGroup) {
    if (layerGroup) {
        map.removeLayer(layerGroup);
    }
    layerGroup = newLayerGroup;
}

export function getMapStyle(feature, cargoSelecionado) {
    const partido = feature.properties.vencedor;
    let cor;

    if (['presidente', 'governador', 'senador'].includes(cargoSelecionado) &&
        feature.properties.resultados && feature.properties.resultados.length > 0) {
        const vencedor = feature.properties.resultados[0];
        cor = getColorByPercentage(partido, vencedor.perc);
    } else {
        cor = coresPartido[partido] || 'rgb(180,180,180)';
    }

    return {
        color: 'white',
        weight: 1,
        fillColor: cor,
        fillOpacity: 0.7
    };
}

export function fitMapToBounds(bounds) {
    if (bounds && map) {
        map.fitBounds(bounds);
    }
}

export function createGeoJsonLayer(features, onEachFeature, styleFunction) {
    return L.geoJSON(features, {
        style: styleFunction,
        onEachFeature: onEachFeature
    });
}