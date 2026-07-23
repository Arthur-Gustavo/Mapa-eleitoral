import { coresPartido } from './colors.js';
import { nomesRegioes, todasUFs } from './constants.js';
import { getGeoJsonData, getRegioesIntermediariasData, getMunicipiosAtivos, setMunicipiosAtivos, getEstadosCarregar } from './data-loader.js';
import { getMap, getLayerGroup, fitMapToBounds } from './map.js';
import { atualizarAgregadorPartidos, atualizarVotosPartidos } from './statistics.js';
import checkboxManager from './checkbox-manager.js';
import { hasZonaData } from '../ZONAS/zona-availability.js';

// Criar botão flutuante para zonas (canto inferior esquerdo)
const zonaFloatBtn = document.createElement('button');
zonaFloatBtn.id = 'btn-zonas-float';
zonaFloatBtn.innerHTML = '<i class="fas fa-layer-group"></i> Zonas';
zonaFloatBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
    background: linear-gradient(135deg, #ff9800, #f57c00);
    border: none;
    color: #000;
    font-weight: bold;
    padding: 8px 16px;
    border-radius: 40px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    white-space: nowrap;
    width: auto;
    min-width: auto;
    height: auto;
`;
zonaFloatBtn.onmouseenter = () => zonaFloatBtn.style.transform = 'translateY(-2px)';
zonaFloatBtn.onmouseleave = () => zonaFloatBtn.style.transform = 'translateY(0)';
document.body.appendChild(zonaFloatBtn);

// Variáveis de estado da UI
let regiaoIntermediariaSelecionada = null;
// REMOVIDO: let evitandoRecursao = false; // ← ESTE É O PROBLEMA PRINCIPAL!

// Funções de utilidade da UI
export function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

export function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

export function updateProgress(current, total) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const percentage = Math.round((current / total) * 100);

    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${current} de ${total} municípios processados (${percentage}%)`;
}

// Formatação de nomes
export function formatarNomeExibicao(nomeCompleto) {
    if (!nomeCompleto) return '';

    const partes = nomeCompleto.trim().split(' ');

    if (partes.length <= 2) {
        return nomeCompleto;
    }

    const primeiroNome = partes[0];
    const ultimoSobrenome = partes[partes.length - 1];

    const sufixos = ['FILHO', 'NETO', 'JÚNIOR', 'JUNIOR', 'SOBRINHO', 'NETA', 'SOBRINHA'];
    let nomeFormatado = primeiroNome;

    if (sufixos.includes(ultimoSobrenome.toUpperCase()) && partes.length >= 3) {
        const penultimo = partes[partes.length - 2];
        nomeFormatado += ` ${penultimo} ${ultimoSobrenome}`;
    } else {
        nomeFormatado += ` ${ultimoSobrenome}`;
    }

    return nomeFormatado;
}

export function formatarNomeExibicao2(nomeCompleto) {
    if (!nomeCompleto) return '';

    const partes = nomeCompleto.trim().split(' ');

    if (partes.length <= 2) {
        return nomeCompleto;
    }

    return `${partes[0]} ${partes[1]}`;
}

// Preenchimento de seletores
export function preencherSeletorEstados() {
    const estadoSelect = document.getElementById('estado');
    estadoSelect.innerHTML = '<option value="TODOS">Todos</option>';

    todasUFs.forEach(uf => {
        const option = document.createElement('option');
        option.value = uf;
        option.textContent = uf;
        estadoSelect.appendChild(option);
    });
}

export function preencherSeletorRegioesIntermediarias() {
    const regiaoIntermediariaSelect = document.getElementById('regiao-intermediaria');
    const estadosSelecionados = checkboxManager.getEstadosSelecionados();

    regiaoIntermediariaSelect.innerHTML = '<option value="TODAS">Todas</option>';

    const regioesData = getRegioesIntermediariasData();
    if (!regioesData) return;

    // Para cada região intermediária, verificar se pertence a algum estado selecionado
    Object.keys(regioesData).forEach(key => {
        const municipiosRegiao = regioesData[key];

        // Verificar se há algum município desta região em algum estado selecionado
        const pertenceAosEstados = municipiosRegiao.some(m =>
            estadosSelecionados.includes(m.uf)
        );

        if (pertenceAosEstados) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            regiaoIntermediariaSelect.appendChild(option);
        }
    });
}

// Aplicar filtros de estado/região
export function aplicarFiltroEstado() {
    const estadosSelecionados = checkboxManager.getEstadosSelecionados();
    const regiaoIntermediariaSelecionada = document.getElementById('regiao-intermediaria').value;

    const map = getMap();
    const layerGroup = getLayerGroup();

    if (layerGroup) {
        layerGroup.eachLayer(layer => {
            const featureUF = layer.feature.properties.SIGLA_UF;
            const codigoTSE = String(layer.feature.properties.codigo_tse);
            let deveMostrar = false;

            if (regiaoIntermediariaSelecionada !== 'TODAS' && getRegioesIntermediariasData()) {
                const municipiosRegiao = getRegioesIntermediariasData()[regiaoIntermediariaSelecionada];
                deveMostrar = municipiosRegiao.some(m =>
                    String(m.codigo_tse) === codigoTSE
                );
            } else {
                // Agora verifica se o estado está na lista de selecionados
                deveMostrar = estadosSelecionados.includes(featureUF);
            }

            if (deveMostrar) {
                map.addLayer(layer);
            } else {
                map.removeLayer(layer);
            }
        });
    }

    // 1. Atualizar as estatísticas
    atualizarAgregadorPartidos();
    atualizarVotosPartidos();

    // 2. Atualizar o painel para mostrar as novas estatísticas
    mostrarEstatisticasRegionais();

    // 3. Ajustar visualização do mapa
    if (regiaoIntermediariaSelecionada !== 'TODAS' && getRegioesIntermediariasData()) {
        const municipiosRegiao = getRegioesIntermediariasData()[regiaoIntermediariaSelecionada].map(m =>
            String(m.codigo_tse)
        );
        const regiaoFeatures = getGeoJsonData().features.filter(f =>
            municipiosRegiao.includes(String(f.properties.codigo_tse))
        );

        if (regiaoFeatures.length > 0) {
            const regiaoLayer = L.geoJSON(regiaoFeatures);
            fitMapToBounds(regiaoLayer.getBounds());
        }
    } else if (estadosSelecionados.length > 0) {
        // Ajustar para mostrar todos os estados selecionados
        const estadosFeatures = getGeoJsonData().features.filter(f =>
            estadosSelecionados.includes(f.properties.SIGLA_UF)
        );

        if (estadosFeatures.length > 0) {
            const estadosLayer = L.geoJSON(estadosFeatures);
            fitMapToBounds(estadosLayer.getBounds());
        }
    }
}


// Painel de detalhes do município
export function mostrarDetalhesMunicipio(properties) {
    const panel = document.getElementById('info-panel');
    const content = document.getElementById('panel-content');
    if (!panel || !content) return;

    panel.classList.remove('hidden');

    // Obter ano atual
    const ano = document.getElementById('ano').value;

    let html = `<h3 style="margin-top: 0; color: #ffd700;">${properties.NM_MUN} - ${properties.SIGLA_UF}</h3>`;

    // 🆕 ADICIONAR TOTALIZAÇÃO DE SEÇÕES PARA O MUNICÍPIO (2024/2026)
    if ((ano === '2024' || ano === '2026') && properties.secoes) {
        const secoes = properties.secoes;
        const totalSecoes = parseInt(secoes.ts) || 0;
        const secoesTotalizadas = parseInt(secoes.st) || 0;
        const percentual = totalSecoes > 0
            ? ((secoesTotalizadas / totalSecoes) * 100).toFixed(2)
            : '0.00';

        html += `
            <div style="
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
                border-left: 4px solid #3498db;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 style="margin: 0; color: #fff; font-size: 16px;">
                        <i class="fas fa-poll" style="margin-right: 8px; color: #3498db;"></i>
                        Totalização de Seções
                    </h4>
                    <span style="background: rgba(52, 152, 219, 0.2); color: #3498db; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                        ${parseFloat(percentual).toFixed(2).replace('.', ',')}%
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                    <div style="text-align: center; background: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 6px;">
                        <div style="font-size: 11px; color: #aaa; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                            Total de Seções
                        </div>
                        <div style="font-size: 22px; font-weight: bold; color: #2ecc71;">
                            ${totalSecoes.toLocaleString('pt-BR')}
                        </div>
                    </div>
                    <div style="text-align: center; background: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 6px;">
                        <div style="font-size: 11px; color: #aaa; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                            Seções Totalizadas
                        </div>
                        <div style="font-size: 22px; font-weight: bold; color: #3498db;">
                            ${secoesTotalizadas.toLocaleString('pt-BR')}
                        </div>
                    </div>
                </div>
                
                <!-- Barra de Progresso -->
                <div style="margin-top: 5px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px; color: #aaa;">
                        <span>Progresso da Totalização</span>
                        <span>${parseFloat(percentual).toFixed(2).replace('.', ',')}%</span>
                    </div>
                    <div style="height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden;">
                        <div style="
                            width: ${Math.min(parseFloat(percentual), 100)}%;
                            height: 100%;
                            background: linear-gradient(90deg, #2ecc71, #3498db);
                            border-radius: 4px;
                            transition: width 0.5s ease;
                        "></div>
                    </div>
                </div>
            </div>
        `;
    }

    if (!properties.resultados || properties.resultados.length === 0) {
        html += '<p>Resultados indisponíveis no momento</p>';
    } else {
        const vencedor = properties.resultados[0];
        html += `
            <div class="candidate-card" style="border-left-color: ${coresPartido[vencedor.partido] || '#999'}">
                <div class="candidate-header">
                    <div class="candidate-name">${vencedor.nome}</div>
                    <div class="candidate-party" style="background: ${coresPartido[vencedor.partido] || '#999'}; color: ${vencedor.partido === 'PL' ? 'white' : 'black'}">
                        ${vencedor.partido}
                    </div>
                </div>
                <div class="winner-badge">
                    <i class="fas fa-trophy"></i> Vencedor
                </div>
                <div class="stats-container">
                    <div class="stat-item">
                        <div class="stat-label">Votos</div>
                        <div class="stat-value">${vencedor.votos.toLocaleString()}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Porcentagem</div>
                        <div class="stat-value">${vencedor.perc}%</div>
                    </div>
                </div>
            </div>
            <h4 style="margin: 20px 0 10px; color: #ffd700;">Todos os Candidatos</h4>
        `;

        properties.resultados.forEach((c, index) => {
            if (index === 0) return;

            html += `
                <div class="candidate-card" style="border-left-color: ${coresPartido[c.partido] || '#999'}">
                    <div class="candidate-header">
                        <div class="candidate-name">${c.nome}</div>
                        <div class="candidate-party" style="background: ${coresPartido[c.partido] || '#999'}; color: ${c.partido === 'PL' ? 'white' : 'black'}">
                            ${c.partido}
                        </div>
                    </div>
                    <div class="stats-container">
                        <div class="stat-item">
                            <div class="stat-label">Votos</div>
                            <div class="stat-value">${c.votos.toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Porcentagem</div>
                            <div class="stat-value">${c.perc}%</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    content.innerHTML = html;

    // --- CONTROLE DO BOTÃO FLUTUANTE DE ZONAS ---
    const cidadeNome = properties.NM_MUN;
    hasZonaData(properties.NM_MUN.toUpperCase(), properties.SIGLA_UF.toUpperCase()).then(hasZonas => {
        const btn = document.getElementById('btn-zonas-float');
        if (btn) {
            if (hasZonas) {
                // Atualiza a ação do botão com os dados atuais
                btn.onclick = () => {
                    const codigo = properties.codigo_tse;
                    const ano = document.getElementById('ano').value;
                    const cargoSelect = document.getElementById('cargo');
                    const cargoMap = { presidente: '0001', governador: '0003', senador: '0005', prefeito: '0011' };
                    const cargoCode = cargoMap[cargoSelect.value];
                    window.location.href = `../ZONAS/zone.html?municipio=${codigo}&uf=${properties.SIGLA_UF}&ano=${ano}&cargo=${cargoCode}`;
                };
                btn.style.display = 'flex';
            } else {
                btn.style.display = 'none';
            }
        }
    });

}

function mostrarTotalizacaoSecoes() {
    const ano = document.getElementById('ano').value;
    if (ano !== '2024' && ano !== '2026') return null;

    const geoData = getGeoJsonData();
    if (!geoData || !geoData.features) return null;

    // 🆕 SIMPLES: Somar todas as seções de todas as features
    let totalSecoes = 0;
    let secoesTotalizadas = 0;
    let municipiosComDados = 0;

    geoData.features.forEach(feature => {
        if (feature && feature.properties && feature.properties.secoes) {
            const secoes = feature.properties.secoes;
            if (secoes.ts !== undefined && secoes.st !== undefined) {
                totalSecoes += parseInt(secoes.ts) || 0;
                secoesTotalizadas += parseInt(secoes.st) || 0;
                municipiosComDados++;
            }
        }
    });

    if (municipiosComDados === 0) return null;

    const percentual = totalSecoes > 0
        ? ((secoesTotalizadas / totalSecoes) * 100).toFixed(2)
        : '0.00';

    return {
        totalSecoes,
        secoesTotalizadas,
        percentual: parseFloat(percentual),
        municipiosComDados
    };
}

// 🆕 Funções auxiliares simples (se ainda forem necessárias)
function formatarNumero(num) {
    return num.toLocaleString('pt-BR');
}

function formatarPercentual(percentual) {
    return parseFloat(percentual).toFixed(2).replace('.', ',') + '%';
}

// Mostrar estatísticas regionais no painel
export function mostrarEstatisticasRegionais() {
    try {
        const content = document.getElementById('panel-content');
        if (!content) return;

        const estadosSelecionados = checkboxManager.getEstadosSelecionados(); // Array de estados
        const regiao = document.getElementById('regiao').value;
        const cargo = document.getElementById('cargo').value;
        const regiaoIntermediariaSelecionada = document.getElementById('regiao-intermediaria').value;

        let titulo = '';

        // LÓGICA CORRETA: Decidir qual título mostrar baseado nos filtros ativos
        if (regiaoIntermediariaSelecionada !== 'TODAS' && regiaoIntermediariaSelecionada) {
            titulo = `Região Intermediária: ${regiaoIntermediariaSelecionada}`;
        }
        // SE TEM ESTADOS SELECIONADOS (via checkboxes)
        else if (estadosSelecionados.length > 0 && estadosSelecionados.length < todasUFs.length) {
            if (estadosSelecionados.length === 1) {
                titulo = `Estado: ${estadosSelecionados[0]}`;
            } else if (estadosSelecionados.length <= 5) {
                titulo = `Estados: ${estadosSelecionados.join(', ')}`;
            } else {
                titulo = `${estadosSelecionados.length} Estados Selecionados`;
            }
        }
        // SE TODOS OS ESTADOS estão selecionados
        else if (estadosSelecionados.length === todasUFs.length) {
            const nomeRegiao = nomesRegioes[regiao] || 'Todo Brasil';
            titulo = `Região: ${nomeRegiao}`;
        }
        // CASO PADRÃO (região)
        else {
            const nomeRegiao = nomesRegioes[regiao] || 'Todo Brasil';
            titulo = `Região: ${nomeRegiao}`;
        }

        // Título dinâmico baseado no cargo
        const tituloVotacao = cargo === 'senador'
            ? 'Votação Nominal por Candidato (Top 15)'
            : 'Votação Nominal por Partido (Top 15)';

        let html = `
            <div class="current-region">${titulo}</div>
            
            <div id="party-summary">
                <h3>Prefeituras por Partido (Top 5)</h3>
                <div id="party-stats">Carregando dados...</div>
            </div>

            <div id="votos-summary">
                <h3>${tituloVotacao}</h3>
                <table class="votos-table">
                    <thead>
                        <tr>
                            <th>${cargo === 'senador' ? 'Candidato (Partido)' : 'Partido'}</th>
                            <th>Total de Votos</th>
                            <th>%</th>
                        </tr>
                    </thead>
                    <tbody id="votos-stats">
                        <tr><td colspan="3">Carregando dados...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        const dadosSecoes = mostrarTotalizacaoSecoes();
        if (dadosSecoes) {
            html += `
        <div class="secoes-container" style="
            background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            border-left: 4px solid #ffd700;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #fff; font-size: 16px;">
                    <i class="fas fa-chart-bar" style="margin-right: 8px;"></i>
                    Totalização de Seções
                </h4>
                <span style="background: rgba(255, 255, 255, 0.2); color: #ffd700; padding: 3px 8px; border-radius: 4px; font-size: 12px;">
                    ${dadosSecoes.percentual.toFixed(2).replace('.', ',')}%
                </span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">Total Seções</div>
                    <div style="font-size: 20px; font-weight: bold; color: #4CAF50;">
                        ${dadosSecoes.totalSecoes.toLocaleString('pt-BR')}
                    </div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">Totalizadas</div>
                    <div style="font-size: 20px; font-weight: bold; color: #2196F3;">
                        ${dadosSecoes.secoesTotalizadas.toLocaleString('pt-BR')}
                    </div>
                </div>
            </div>
            
            <div style="background: rgba(0, 0, 0, 0.2); height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="
                    width: ${Math.min(dadosSecoes.percentual, 100)}%;
                    height: 100%;
                    background: linear-gradient(90deg, #4CAF50, #2196F3);
                    transition: width 0.5s ease;
                "></div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: #aaa;">
                <span>${dadosSecoes.municipiosComDados} município(s)</span>
                <span>${dadosSecoes.percentual.toFixed(2).replace('.', ',')}% apurado</span>
            </div>
        </div>
    `;
        }

        content.innerHTML = html;

        // ATUALIZAR AS ESTATÍSTICAS
        if (typeof atualizarAgregadorPartidos === 'function') {
            atualizarAgregadorPartidos();
        }

        if (typeof atualizarVotosPartidos === 'function') {
            atualizarVotosPartidos();
        }
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}