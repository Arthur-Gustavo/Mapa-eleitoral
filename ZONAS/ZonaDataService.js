// ZonaDataService.js
import { codigosEleicao } from '../modules/constants.js';

export class ZonaDataService {
    constructor() {
        this.cache = new Map(); // key -> { data, timestamp }
        this.TTL = 90 * 1000; // 90 seconds
    }

    _getCacheKey(uf, municipio, zona, ano, cargo) {
        return `${ano}|${cargo}|${uf}|${municipio}|${zona}`;
    }

    async fetchZoneResults(uf, municipioCodigo, zonaNum, ano, turno, cargoCode) {
        const cacheKey = this._getCacheKey(uf, municipioCodigo, zonaNum, ano, turno, cargoCode);
        const now = Date.now();
        const cached = this.cache.get(cacheKey);
        if (cached && (now - cached.timestamp) < this.TTL) {
            return cached.data;
        }

        const codTurno = codigosEleicao[ano]?.[turno] || '000';
        const zonaPadded = String(zonaNum).padStart(4, '0');
        const municipioPadded = String(municipioCodigo).padStart(5, '0');
        const url = `https://resultados.tse.jus.br/oficial/ele${ano}/${codTurno}/dados/${uf}/${uf}${municipioPadded}-z${zonaPadded}-c${cargoCode}-e000${codTurno}-u.json`;

        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const json = await response.json();
            const parsed = this._parseTSEJson(json);
            if (parsed) {
                this.cache.set(cacheKey, { data: parsed, timestamp: now });
            }
            return parsed;
        } catch (err) {
            console.warn(`Erro na zona ${zonaNum}:`, err);
            return null;
        }
    }

    _parseTSEJson(json) {
        const cargoData = json.carg?.[0];
        if (!cargoData || !cargoData.agr) return null;

        // Extração CORRETA das seções (campo "s" da API)
        let secoes = null;
        if (json.s && json.s.ts !== undefined) {
            secoes = {
                total: parseInt(json.s.ts) || 0,
                totalizadas: parseInt(json.s.st) || 0
            };
        } else if (json.secoes) { // fallback
            secoes = {
                total: parseInt(json.secoes.ts) || 0,
                totalizadas: parseInt(json.secoes.st) || 0
            };
        }

        // Processa candidatos (igual antes)
        const candidates = [];
        for (const colig of cargoData.agr) {
            const parties = colig.par || [];
            for (const partyGroup of parties) {
                const cands = partyGroup.cand || [];
                for (const cand of cands) {
                    candidates.push({
                        numero: cand.n,
                        nome: cand.nmu || cand.nm,
                        partido: partyGroup.sg,
                        votos: parseInt(cand.vap || cand.vapor),
                        perc: parseFloat((cand.pvap || '0').replace(',', '.'))
                    });
                }
            }
        }
        if (candidates.length === 0) return null;
        candidates.sort((a, b) => b.votos - a.votos);
        const totalVotos = candidates.reduce((sum, c) => sum + c.votos, 0);

        return {
            winner: candidates[0].partido,
            percentage: candidates[0].perc,
            candidateName: candidates[0].nome,
            totalVotes: totalVotos,
            allCandidates: candidates,
            secoes: secoes
        };
    }
}