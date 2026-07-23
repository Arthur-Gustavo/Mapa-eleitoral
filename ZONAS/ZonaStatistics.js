// ZonaStatistics.js
import { coresPartido } from '../modules/colors.js';

export class ZonaStatistics {
    static updateZoneStatistics(resultsMap, cityName) {
        ZonaStatistics.showAggregatedResults(resultsMap, cityName);
        const totalZones = resultsMap.size;
        const winnersCount = new Map();
        for (const data of resultsMap.values()) {
            const winner = data.winner;
            winnersCount.set(winner, (winnersCount.get(winner) || 0) + 1);
        }
        const sorted = [...winnersCount.entries()].sort((a, b) => b[1] - a[1]);
        let html = `<div class="current-region">${cityName} - Zonas Eleitorais</div>`;
        html += `<h3>Resumo das Zonas</h3>`;
        html += `<p>Total de zonas: ${totalZones}</p>`;
        html += `<h4>Zonas vencidas por partido</h4><ul>`;
        for (const [party, count] of sorted) {
            const color = coresPartido[party] || '#999';
            html += `<li><strong style="color:${color}">${party}</strong>: ${count} zona${count !== 1 ? 's' : ''}</li>`;
        }
        html += `</ul>`;
        document.getElementById('panel-content').innerHTML = html;
    }

    static showZoneDetails(feature, zoneData) {
        if (!zoneData) {
            document.getElementById('panel-content').innerHTML = '<p>Dados da zona não disponíveis.</p>';
            return;
        }
        const zonaNum = feature.properties.zona;
        let html = `<div class="current-region">Zona ${zonaNum}</div>`;

        // Seções totalizadas (se disponível)
        if (zoneData.secoes && zoneData.secoes.total > 0) {
            const percSecoes = (zoneData.secoes.totalizadas / zoneData.secoes.total * 100).toFixed(2);
            html += `
            <div class="secoes-card" style="margin-bottom: 20px;">
                <div class="secoes-header">
                    <h4 style="margin:0;"><i class="fas fa-poll"></i> Totalização de Seções</h4>
                    <span class="secoes-percent">${percSecoes.replace('.', ',')}%</span>
                </div>
                <div class="secoes-grid">
                    <div class="secoes-item">
                        <div class="secoes-label">Total de Seções</div>
                        <div class="secoes-value secoes-total">${zoneData.secoes.total.toLocaleString()}</div>
                    </div>
                    <div class="secoes-item">
                        <div class="secoes-label">Seções Totalizadas</div>
                        <div class="secoes-value secoes-totalizadas">${zoneData.secoes.totalizadas.toLocaleString()}</div>
                    </div>
                </div>
                <div class="progress-container">
                    <div class="progress-info">
                        <span>Progresso</span>
                        <span>${percSecoes.replace('.', ',')}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percSecoes, 100)}%;"></div>
                    </div>
                </div>
            </div>
        `;
        }

        // Lista de candidatos (todos com card e barra)
        html += `<h3 style="margin-top: 20px;">Candidatos</h3>`;
        for (const cand of zoneData.allCandidates) {
            const cor = coresPartido[cand.partido] || '#999';
            const textoCor = (cand.partido === 'PL' || cand.partido === 'PT') ? 'white' : 'black';
            html += `
            <div class="candidate-card" style="border-left-color: ${cor};">
                <div class="candidate-header">
                    <div class="candidate-name">${cand.nome}</div>
                    <div class="candidate-party" style="background: ${cor}; color: ${textoCor};">${cand.partido}</div>
                </div>
                <div class="stats-container">
                    <div class="stat-item">
                        <div class="stat-label">Votos</div>
                        <div class="stat-value">${cand.votos.toLocaleString()}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Porcentagem</div>
                        <div class="stat-value">${cand.perc}%</div>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <div style="height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${Math.min(cand.perc, 100)}%; height: 100%; background: ${cor};"></div>
                    </div>
                </div>
            </div>
        `;
        }
        document.getElementById('panel-content').innerHTML = html;
    }
    static showAggregatedResults(resultsMap, cityName) {
        if (!resultsMap || resultsMap.size === 0) {
            document.getElementById('panel-content').innerHTML = '<p>Nenhum dado disponível para esta cidade.</p>';
            return;
        }

        // Agrega todos os candidatos de todas as zonas
        const aggregated = new Map(); // key: candidato.nome|partido
        let totalVotosGeral = 0;

        for (const zoneData of resultsMap.values()) {
            for (const cand of zoneData.allCandidates) {
                const key = `${cand.nome}|${cand.partido}`;
                if (!aggregated.has(key)) {
                    aggregated.set(key, {
                        nome: cand.nome,
                        partido: cand.partido,
                        votos: 0
                    });
                }
                aggregated.get(key).votos += cand.votos;
                totalVotosGeral += cand.votos;
            }
        }

        // Converter para array, calcular percentuais e ordenar
        let candidatesAgg = Array.from(aggregated.values()).map(c => ({
            ...c,
            perc: totalVotosGeral > 0 ? (c.votos / totalVotosGeral * 100).toFixed(2) : '0.00'
        }));
        candidatesAgg.sort((a, b) => b.votos - a.votos);

        // Somar seções totalizadas
        let totalSecoes = 0;
        let totalSecoesTotalizadas = 0;
        for (const zoneData of resultsMap.values()) {
            if (zoneData.secoes) {
                totalSecoes += zoneData.secoes.total;
                totalSecoesTotalizadas += zoneData.secoes.totalizadas;
            }
        }
        const percSecoes = totalSecoes > 0 ? (totalSecoesTotalizadas / totalSecoes * 100).toFixed(2) : '0.00';

        // Montar HTML
        let html = `<div class="current-region">${cityName} - TOTAL DAS ZONAS</div>`;

        if (totalSecoes > 0) {
            html += `
            <div class="secoes-card" style="margin-bottom: 20px;">
                <div class="secoes-header">
                    <h4 style="margin:0;"><i class="fas fa-poll"></i> Totalização de Seções (Município)</h4>
                    <span class="secoes-percent">${percSecoes.replace('.', ',')}%</span>
                </div>
                <div class="secoes-grid">
                    <div class="secoes-item">
                        <div class="secoes-label">Total de Seções</div>
                        <div class="secoes-value secoes-total">${totalSecoes.toLocaleString()}</div>
                    </div>
                    <div class="secoes-item">
                        <div class="secoes-label">Seções Totalizadas</div>
                        <div class="secoes-value secoes-totalizadas">${totalSecoesTotalizadas.toLocaleString()}</div>
                    </div>
                </div>
                <div class="progress-container">
                    <div class="progress-info">
                        <span>Progresso</span>
                        <span>${percSecoes.replace('.', ',')}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percSecoes, 100)}%;"></div>
                    </div>
                </div>
            </div>
        `;
        }

        html += `<h3>Resultado Agregado (Todas as Zonas)</h3>`;
        for (const cand of candidatesAgg) {
            const cor = coresPartido[cand.partido] || '#999';
            const textoCor = (cand.partido === 'PL' || cand.partido === 'PT') ? 'white' : 'black';
            html += `
            <div class="candidate-card" style="border-left-color: ${cor};">
                <div class="candidate-header">
                    <div class="candidate-name">${cand.nome}</div>
                    <div class="candidate-party" style="background: ${cor}; color: ${textoCor};">${cand.partido}</div>
                </div>
                <div class="stats-container">
                    <div class="stat-item">
                        <div class="stat-label">Votos</div>
                        <div class="stat-value">${cand.votos.toLocaleString()}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Porcentagem</div>
                        <div class="stat-value">${cand.perc}%</div>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <div style="height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${Math.min(cand.perc, 100)}%; height: 100%; background: ${cor};"></div>
                    </div>
                </div>
            </div>
        `;
        }
        document.getElementById('panel-content').innerHTML = html;
    }
}