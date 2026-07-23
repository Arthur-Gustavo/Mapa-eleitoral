import { getGeoJsonData, getRegioesIntermediariasData } from './data-loader.js';
import { getColorByPercentage } from './colors.js';
import { coresPartido } from './colors.js';

export function exportarMapa() {
    const geoData = getGeoJsonData();
    if (!geoData) {
        alert('Por favor, aguarde o carregamento completo dos dados antes de exportar.');
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'export-overlay';
    overlay.innerHTML = `
        <div class="spinner"></div>
        <div>Gerando imagem em alta resolução...</div>
    `;
    document.body.appendChild(overlay);

    const exportCanvas = document.createElement('canvas');
    exportCanvas.className = 'map-export-canvas';
    document.body.appendChild(exportCanvas);

    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

    // Filtrar features para exportação
    let featuresToExport = [...geoData.features];
    const regiaoIntermediariaSelecionada = document.getElementById('regiao-intermediaria').value;

    // Se uma região intermediária estiver selecionada, filtrar por ela
    if (regiaoIntermediariaSelecionada !== 'TODAS' && getRegioesIntermediariasData()) {
        const codigosTSE = getRegioesIntermediariasData()[regiaoIntermediariaSelecionada].map(m =>
            String(m.codigo_tse)
        );
        featuresToExport = geoData.features.filter(f =>
            codigosTSE.includes(String(f.properties.codigo_tse))
        );
    }
    // Se um estado estiver selecionado, filtrar por ele
    else {
        const estadoSelecionado = document.getElementById('estado').value;
        if (estadoSelecionado !== 'TODOS') {
            featuresToExport = geoData.features.filter(f =>
                f.properties.SIGLA_UF === estadoSelecionado
            );
        }
    }

    featuresToExport.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates.forEach(polygon => {
                polygon.forEach(point => {
                    minLng = Math.min(minLng, point[0]);
                    minLat = Math.min(minLat, point[1]);
                    maxLng = Math.max(maxLng, point[0]);
                    maxLat = Math.max(maxLat, point[1]);
                });
            });
        } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(polygons => {
                polygons.forEach(polygon => {
                    polygon.forEach(point => {
                        minLng = Math.min(minLng, point[0]);
                        minLat = Math.min(minLat, point[1]);
                        maxLng = Math.max(maxLng, point[0]);
                        maxLat = Math.max(maxLat, point[1]);
                    });
                });
            });
        }
    });

    const margin = 0.5;
    minLng -= margin;
    minLat -= margin;
    maxLng += margin;
    maxLat += margin;

    const width = maxLng - minLng;
    const height = maxLat - minLat;
    const aspectRatio = width / height;

    const canvasHeight = 3000;
    const canvasWidth = canvasHeight * aspectRatio;

    exportCanvas.width = canvasWidth;
    exportCanvas.height = canvasHeight;

    const ctx = exportCanvas.getContext('2d');

    // Fundo transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const scaleX = canvasWidth / width;
    const scaleY = canvasHeight / height;

    const project = (lng, lat) => {
        const x = (lng - minLng) * scaleX;
        const y = canvasHeight - ((lat - minLat) * scaleY);
        return [x, y];
    };

    featuresToExport.forEach(feature => {
        const geometry = feature.geometry;
        const vencedor = feature.properties.vencedor;

        // Determinar cor baseada no cargo
        const cargo = document.getElementById('cargo').value;
        let cor;

        // Aplicar degradê para presidente, governador e senador
        if (['presidente', 'governador', 'senador'].includes(cargo) &&
            feature.properties.resultados && feature.properties.resultados.length > 0) {
            const vencedorData = feature.properties.resultados[0];
            cor = getColorByPercentage(vencedor, vencedorData.perc);
        } else {
            cor = coresPartido[vencedor] || 'rgb(180,180,180)';
        }

        if (geometry.type === 'Polygon') {
            geometry.coordinates.forEach(polygon => {
                ctx.beginPath();
                polygon.forEach((point, idx) => {
                    const [x, y] = project(point[0], point[1]);
                    if (idx === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                ctx.closePath();
                ctx.fillStyle = cor;
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        }

        if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach(polygons => {
                polygons.forEach(polygon => {
                    ctx.beginPath();
                    polygon.forEach((point, idx) => {
                        const [x, y] = project(point[0], point[1]);
                        if (idx === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    });
                    ctx.closePath();
                    ctx.fillStyle = cor;
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                });
            });
        }
    });

    setTimeout(() => {
        const dataURL = exportCanvas.toDataURL('image/png');

        overlay.innerHTML = `
            <h2>Exportação de Alta Resolução</h2>
            <img src="${dataURL}" class="export-preview" alt="Mapa Exportado">
            <div class="export-actions">
                <button class="export-btn cancel" id="cancel-export">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button class="export-btn" id="save-export">
                    <i class="fas fa-download"></i> Salvar PNG
                </button>
            </div>
        `;

        document.getElementById('save-export').addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `Mapa_Eleitoral_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = dataURL;
            link.click();
            document.body.removeChild(overlay);
            document.body.removeChild(exportCanvas);
        });

        document.getElementById('cancel-export').addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.body.removeChild(exportCanvas);
        });
    }, 1000);
}