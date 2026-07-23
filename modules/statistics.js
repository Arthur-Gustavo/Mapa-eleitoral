import { nomesRegioes } from './constants.js';
import { coresPartido } from './colors.js';
import { formatarNomeExibicao2 } from './ui-handlers.js';
import { getGeoJsonData, getRegioesIntermediariasData, getMunicipiosAtivos } from './data-loader.js';

// Atualizar agregador de partidos (Top 5 prefeituras)
export function atualizarAgregadorPartidos() {
    const estadosSelecionados = document.getElementById('estado').value;
    const regiaoIntermediariaSelecionada = document.getElementById('regiao-intermediaria').value;
    const contagem = {};
    let totalMunicipios = 0;

    const geoData = getGeoJsonData();
    if (geoData && geoData.features) {
        geoData.features.forEach(feature => {
            const uf = feature.properties.SIGLA_UF;
            const codigoTSE = String(feature.properties.codigo_tse);
            const partido = feature.properties.vencedor;

            let deveContar = false;

            // Filtro por região intermediária
            if (regiaoIntermediariaSelecionada !== 'TODAS' && getRegioesIntermediariasData()) {
                const municipiosRegiao = getRegioesIntermediariasData()[regiaoIntermediariaSelecionada];
                deveContar = municipiosRegiao.some(m =>
                    String(m.codigo_tse) === codigoTSE
                );
            }
            // Filtro por estado
            else if (estadosSelecionados !== 'TODOS') {
                deveContar = estadosSelecionados === uf;
            }
            // Sem filtro específico
            else {
                deveContar = getMunicipiosAtivos().includes(uf);
            }

            if (deveContar && partido) {
                contagem[partido] = (contagem[partido] || 0) + 1;
                totalMunicipios++;
            }
        });

        const ranking = Object.entries(contagem)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        let html = '';
        ranking.forEach(([partido, quantidade], index) => {
            const porcentagem = totalMunicipios > 0 ? ((quantidade / totalMunicipios) * 100).toFixed(1) : 0;
            html += `
                <div class="party-stat">
                    <div class="party-rank" style="background: ${coresPartido[partido] || '#999'}; 
                        color: ${['PL', 'PT', 'PSOL'].includes(partido) ? 'white' : 'black'}">
                        ${index + 1}
                    </div>
                    <div class="party-info">
                        <div style="display: flex; justify-content: space-between;">
                            <strong>${partido}</strong>
                            <span>${quantidade} (${porcentagem}%)</span>
                        </div>
                        <div style="height: 5px; background: #333; border-radius: 3px; margin-top: 5px;">
                            <div style="height: 100%; background: ${coresPartido[partido] || '#999'}; 
                                width: ${porcentagem}%; border-radius: 3px;"></div>
                        </div>
                    </div>
                </div>
            `;
        });

        const partyStats = document.getElementById('party-stats');
        if (partyStats) {
            partyStats.innerHTML = html || '<p>Nenhum dado disponível</p>';
        }
    }
}

// Atualizar estatísticas de votos (Top 15)
export function atualizarVotosPartidos() {
    const estadosSelecionados = document.getElementById('estado').value;
    const regiaoIntermediariaSelecionada = document.getElementById('regiao-intermediaria').value;
    const cargo = document.getElementById('cargo').value;

    const votosAgrupados = {};
    let totalVotos = 0;

    const geoData = getGeoJsonData();
    if (geoData && geoData.features) {
        geoData.features.forEach(feature => {
            const uf = feature.properties.SIGLA_UF;
            const codigoTSE = String(feature.properties.codigo_tse);

            let deveContar = false;

            if (regiaoIntermediariaSelecionada !== 'TODAS' && getRegioesIntermediariasData()) {
                const municipiosRegiao = getRegioesIntermediariasData()[regiaoIntermediariaSelecionada];
                deveContar = municipiosRegiao.some(m =>
                    String(m.codigo_tse) === codigoTSE
                );
            } else if (estadosSelecionados !== 'TODOS') {
                deveContar = estadosSelecionados === uf;
            } else {
                deveContar = getMunicipiosAtivos().includes(uf);
            }

            if (deveContar && feature.properties.resultados && Array.isArray(feature.properties.resultados)) {
                feature.properties.resultados.forEach(candidato => {
                    if (candidato.partido && candidato.votos) {
                        let chave;
                        let labelExibicao;

                        if (cargo === 'senador') {
                            // Para senador: agrupa por candidato individual (nome + partido)
                            chave = `${candidato.nome}|${candidato.partido}`;
                            labelExibicao = `${formatarNomeExibicao2(candidato.nome)} (${candidato.partido})`;
                        } else {
                            chave = candidato.partido;
                            labelExibicao = candidato.partido;
                        }

                        if (!votosAgrupados[chave]) {
                            votosAgrupados[chave] = {
                                label: labelExibicao,
                                partido: candidato.partido,
                                votos: 0,
                                nomeCompleto: candidato.nome
                            };
                        }
                        votosAgrupados[chave].votos += candidato.votos;
                        totalVotos += candidato.votos;
                    }
                });
            }
        });

        const ranking = Object.values(votosAgrupados)
            .sort((a, b) => b.votos - a.votos)
            .slice(0, 15);

        let html = '';
        ranking.forEach(item => {
            const porcentagem = totalVotos > 0 ? ((item.votos / totalVotos) * 100).toFixed(2) : 0;
            const corPartido = coresPartido[item.partido] || '#fff';

            const tooltipAttr = cargo === 'senador' ? `title="${item.nomeCompleto}"` : '';

            html += `
                <tr ${tooltipAttr}>
                    <td style="color: ${corPartido}"><strong>${item.label}</strong></td>
                    <td>${item.votos.toLocaleString()}</td>
                    <td>${porcentagem}%</td>
                </tr>
            `;
        });

        const votosStats = document.getElementById('votos-stats');
        if (votosStats) {
            votosStats.innerHTML = html || '<tr><td colspan="3">Nenhum dado disponível</td></tr>';
        }
    }
}

