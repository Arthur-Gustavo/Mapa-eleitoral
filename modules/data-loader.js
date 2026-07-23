// modules/data-loader.js - CORRIGIDO
import { regioes, todasUFs, cargoMap, codigosEleicao } from './constants.js';

// Variáveis de estado
let geoJsonData = null;
let regioesIntermediariasData = null;
let estadosCarregar = ['AP'];
let municipiosAtivos = [...estadosCarregar];

export async function carregarMalha(estadosSelecionados) {
    // Verificar se ZZ está nos estados selecionados
    const temZZ = estadosSelecionados && estadosSelecionados.includes('ZZ');
    const temOutrosEstados = estadosSelecionados && estadosSelecionados.some(uf => uf !== 'ZZ');

    if (temZZ && !temOutrosEstados) {
        // CASO 1: Apenas ZZ selecionado - carregar mapa mundial
        return await carregarMalhaMundial();
    } else if (temZZ && temOutrosEstados) {
        // CASO 2: ZZ e outros estados - carregar ambos
        const [geoBrasil, geoMundo] = await Promise.all([
            carregarMalhaBrasil(),
            carregarMalhaMundial()
        ]);
        return combinarGeoJSONs(geoBrasil, geoMundo);
    } else {
        // CASO 3: Apenas estados brasileiros
        return await carregarMalhaBrasil();
    }
}

async function carregarMalhaBrasil() {
    try {
        const response = await fetch('MALHA.zip');
        if (!response.ok) throw new Error('Erro ao carregar o arquivo ZIP');
        const blob = await response.blob();
        const zip = await JSZip.loadAsync(blob);
        const geojsonFile = Object.keys(zip.files).find(f => f.toLowerCase().endsWith('.geojson'));
        if (!geojsonFile) throw new Error('Nenhum arquivo GeoJSON encontrado no ZIP');
        const fileData = await zip.file(geojsonFile).async('text');
        return JSON.parse(fileData);
    } catch (error) {
        console.error('Erro ao carregar malha do ZIP:', error);
        console.log('Usando fallback: malha-simplificada3.geojson');
        const response = await fetch('malha-simplificada3.geojson');
        return await response.json();
    }
}

async function carregarMalhaMundial() {
    try {
        const response = await fetch('mundo.geojson');
        if (!response.ok) throw new Error('Erro ao carregar mundo.geojson');
        return await response.json();
    } catch (error) {
        console.error('Erro ao carregar mundo.geojson:', error);
        return {
            type: 'FeatureCollection',
            features: []
        };
    }
}

function combinarGeoJSONs(geo1, geo2) {
    return {
        type: 'FeatureCollection',
        features: [...geo1.features, ...geo2.features]
    };
}

// Carregar regiões intermediárias - EXATAMENTE como no original
export async function carregarRegioesIntermediarias() {
    try {
        const response = await fetch('regioesint_com_tse.json');
        regioesIntermediariasData = await response.json();
    } catch (error) {
        console.error('Erro ao carregar regiões intermediárias:', error);
        // Não mostrar alerta, apenas log
        regioesIntermediariasData = null;
    }
}

// Carregar dados do TSE - EXATAMENTE como no original
export async function carregarDadosTSE(ano, turno, cargo, siglaUF, codigoTSE) {
    let raw = [];

    // Para anos 2002, 2006, 2010, 2014, 2018, 2022 - dados locais
    if (['2002', '2006', '2010', '2014', '2018', '2022'].includes(ano)) {
        const cargoNome = cargo;
        const path = `jsons-2022/${cargoNome}_${ano}_${turno}.json`;
        try {
            const resp = await fetch(path);
            if (resp.ok) {
                const localJson = await resp.json();
                const dado = localJson[codigoTSE];
                if (dado) {
                    const carga = dado.carga[0];
                    carga.agr.forEach(colig => {
                        colig.cand.forEach(c => {
                            raw.push({
                                nome: c.nm ? c.nm : c.nmu,
                                partido: colig.sg,
                                votos: parseInt(c.vapor)
                            });
                        });
                    });
                }
            }
        } catch (e) {
            console.warn('Erro ao carregar dados locais', e);
        }
    }
    // Para 2024, 2026 - requisição ao TSE
    else if (ano === '2024' || ano === '2026') {
        const ufLower = siglaUF.toLowerCase();
        const codigoTurno = codigosEleicao[ano]?.[turno] || '000';
        const url = `https://resultados.tse.jus.br/oficial/ele${ano}/${codigoTurno}/dados/${ufLower}/${ufLower}${codigoTSE}-c${cargoMap[cargo]}-e000${codigoTurno}-u.json`;
        try {
            const resp = await fetch(url);
            if (resp.ok) {
                const resJson = await resp.json();
                const carga = resJson.carg ? resJson.carg[0] : resJson.carga[0];
                carga.agr.forEach(colig => {
                    colig.par.forEach(part => {
                        part.cand.forEach(c => {
                            raw.push({
                                nome: c.nm ? c.nm : (c.nmu || c.nm),
                                partido: part.sg || c.sgp,
                                votos: parseInt(c.vap || c.vapor)
                            });
                        });
                    });
                });
            }
        } catch (e) {
            console.warn('Erro ao buscar dados do TSE', e);
        }
    }

    return raw;
}

// Processar dados brutos para um município - EXATAMENTE como no original
export function processarDadosMunicipio(raw) {
    const agg = {};
    raw.forEach(r => {
        if (!agg[r.nome]) agg[r.nome] = { ...r };
        else agg[r.nome].votos += r.votos;
    });

    let candidatos = Object.values(agg);
    const total = candidatos.reduce((sum, c) => sum + c.votos, 0);
    candidatos.forEach(c => c.perc = total ? ((c.votos / total) * 100).toFixed(2) : '0');

    candidatos.sort((a, b) => b.votos - a.votos);

    return {
        resultados: candidatos,
        vencedor: candidatos[0]?.partido || null
    };
}

// Getters e Setters
export function getGeoJsonData() { return geoJsonData; }
export function setGeoJsonData(data) { geoJsonData = data; }

export function getEstadosCarregar() { return estadosCarregar; }
export function setEstadosCarregar(estados) { estadosCarregar = estados; }

export function getMunicipiosAtivos() { return municipiosAtivos; }
export function setMunicipiosAtivos(municipios) { municipiosAtivos = municipios; }

export function getRegioesIntermediariasData() { return regioesIntermediariasData; }

// Função para obter UFs baseadas na região selecionada
export function getUFsPorRegiao(regiao) {
    if (regiao !== 'BR' && regioes[regiao]) {
        return regioes[regiao];
    } else {
        return [...todasUFs];
    }
}