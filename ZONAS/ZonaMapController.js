// ZonaMapController.js
import { getColorByPercentage } from '../modules/colors.js';

export class ZonaMapController {
    constructor(mapContainerId) {
        // Só cria o mapa se ele ainda não existir
        if (!window._leafletMap) {
            this.map = L.map(mapContainerId).setView([-14.235, -51.925], 5);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB'
            }).addTo(this.map);
            window._leafletMap = this.map;
        } else {
            this.map = window._leafletMap;
        }
        this.zoneLayer = null;
        this.onClickCallback = null;
    }

    loadZonaGeoJSON(geojson) {
        if (this.zoneLayer) this.map.removeLayer(this.zoneLayer);
        this.zoneLayer = L.geoJSON(geojson, {
            style: this._defaultStyle,
            onEachFeature: (feature, layer) => {
                layer.on('click', () => {
                    if (this.onClickCallback) {
                        const zoneData = feature.properties?.zonaData || null;
                        this.onClickCallback(feature, zoneData);
                    }
                });
            }
        }).addTo(this.map);
        this.map.fitBounds(this.zoneLayer.getBounds());
    }

    _defaultStyle(feature) {
        return {
            color: '#fff',
            weight: 1.5,
            fillColor: '#aaa',
            fillOpacity: 0.5
        };
    }

    applyResultsToZones(resultsMap) {
        if (!this.zoneLayer) return;
        this.zoneLayer.eachLayer(layer => {
            const zonaNum = layer.feature.properties.zona;
            const data = resultsMap.get(zonaNum);
            if (data && data.winner) {
                const color = getColorByPercentage(data.winner, data.percentage);
                layer.setStyle({ fillColor: color, fillOpacity: 0.8 });
                layer.feature.properties.zonaData = data;
            } else {
                layer.setStyle({ fillColor: '#ccc', fillOpacity: 0.5 });
            }
        });
    }

    onZoneClick(callback) {
        this.onClickCallback = callback;
    }
}