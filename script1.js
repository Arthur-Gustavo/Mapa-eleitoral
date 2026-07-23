// Importar todos os módulos
import { regioes, todasUFs, cargoMap, codigosEleicao } from './modules/constants.js';
import { initMap, getMap, getLayerGroup, setLayerGroup, getMapStyle, createGeoJsonLayer } from './modules/map.js';
import { getColorByPercentage, coresPartido } from './modules/colors.js';
import checkboxManager from './modules/checkbox-manager.js';
import {
    carregarMalha,
    carregarRegioesIntermediarias,
    carregarDadosTSE,
    processarDadosMunicipio,
    getGeoJsonData,
    setGeoJsonData,
    getEstadosCarregar,
    setEstadosCarregar,
    getMunicipiosAtivos,
    setMunicipiosAtivos,
    getRegioesIntermediariasData,
    getUFsPorRegiao
} from './modules/data-loader.js';

import {
    showLoading,
    hideLoading,
    updateProgress,
    preencherSeletorRegioesIntermediarias,
    aplicarFiltroEstado,
    mostrarDetalhesMunicipio,
    mostrarEstatisticasRegionais
} from './modules/ui-handlers.js';

import {
    atualizarAgregadorPartidos,
    atualizarVotosPartidos
} from './modules/statistics.js';

import { exportarMapa } from './modules/export.js';
import { verificarDependencias, carregarJSON } from './modules/utils.js';

// Função para extrair dados básicos de seções da API do TSE
function extrairSecoesBasico(apiData) {
    try {
        if (!apiData || !apiData.s) return null;
        return {
            ts: apiData.s.ts || "0",
            st: apiData.s.st || "0"
        };
    } catch (error) {
        console.error('Erro ao extrair dados de seções:', error);
        return null;
    }
}

// Função principal de carregamento de dados
export async function carregarDados() {
    showLoading();

    const ano = document.getElementById('ano').value;
    const turno = document.getElementById('turno').value;
    const cargo = document.getElementById('cargo').value;

    const estadosSelecionados = checkboxManager.getEstadosSelecionados();

    console.log(`Carregando dados para: ${estadosSelecionados.length} estados`);

    try {
        // Carregar malha geográfica
        const geo = await carregarMalha(estadosSelecionados);

        // Carregar dados dos municípios
        let municipiosData;
        try {
            municipiosData = await fetch('municipios.json').then(r => r.json());
        } catch (error) {
            console.error('Erro ao carregar municipios.json:', error);
            alert('Erro: arquivo municipios.json não encontrado.');
            hideLoading();
            return;
        }

        // Filtrar features pelos estados selecionados
        const features = geo.features.filter(f =>
            f.properties && estadosSelecionados.includes(f.properties.SIGLA_UF)
        );

        console.log(`Features filtradas: ${features.length}`);

        const geoJsonComDados = {
            type: 'FeatureCollection',
            features: []
        };

        const totalMunicipios = features.length;
        let municipiosProcessados = 0;
        updateProgress(municipiosProcessados, totalMunicipios);

        // Carregar dados locais para anos 2010-2022 (se necessário)
        let localJson = null;
        if (['2002', '2006', '2010', '2014', '2018', '2022'].includes(ano)) {
            try {
                const cargoNome = cargo;
                const path = `jsons-2022/${cargoNome}_${ano}_${turno}.json`;
                const resp = await fetch(path);
                if (resp.ok) localJson = await resp.json();
            } catch (e) {
                console.warn('Erro ao carregar dados locais:', e);
                localJson = null;
            }
        }

        // Processar em lotes para não travar
        const processarLote = async (lote) => {
            const promessas = lote.map(async (feature) => {
                if (!feature.properties) return null;

                const siglaUF = feature.properties.SIGLA_UF;
                const nome = feature.properties.NM_MUN.toUpperCase();

                // Encontrar município correspondente
                let matches = [];

                if (siglaUF === 'ZZ') {
                    // Busca por país: procura todos os municípios com mesmo país
                    matches = municipiosData.filter(m =>
                        m.uf === 'ZZ' &&
                        m.pais &&
                        m.pais.toUpperCase() === nome
                    );

                    if (matches.length === 0) {
                        // Fallback: tenta buscar por município (para cidades individuais)
                        const matchCidade = municipiosData.find(m =>
                            m.uf === 'ZZ' && m.municipio.toUpperCase() === nome
                        );
                        if (matchCidade) matches = [matchCidade];
                    }
                } else {
                    // Para Brasil, busca normal
                    const match = municipiosData.find(m =>
                        m.uf === siglaUF && m.municipio.toUpperCase() === nome
                    );
                    if (match) matches = [match];
                }

                if (matches.length === 0) {
                    console.warn(`❌ Não encontrado: ${nome} (${siglaUF})`);
                    return null;
                }

                console.log(`✅ ${siglaUF}-${nome}: ${matches.length} correspondência(s)`);

                let secoesAcumuladas = null;
                let raw = [];

                // Para cada match (pode ser 1 ou vários)
                for (const match of matches) {
                    const codigoTSE = match.codigo_tse.toString().padStart(5, '0');

                    // Dados locais (2010-2022)
                    if (['2002', '2006', '2010', '2014', '2018', '2022'].includes(ano) && localJson && localJson[codigoTSE]) {
                        const dado = localJson[codigoTSE];
                        const carga = dado.carga[0];
                        if (carga && carga.agr) {
                            carga.agr.forEach(colig => {
                                if (colig.cand) {
                                    colig.cand.forEach(c => {
                                        raw.push({
                                            nome: c.nm ? c.nm : c.nmu,
                                            partido: colig.sg,
                                            votos: parseInt(c.vapor) || 0
                                        });
                                    });
                                }
                            });
                        }
                    }
                    // Dados TSE (2024, 2026)
                    else if (ano === '2024' || ano === '2026') {
                        try {
                            const ufLower = siglaUF.toLowerCase();
                            const codigoTurno = codigosEleicao[ano]?.[turno] || '000';
                            const url = `https://resultados.tse.jus.br/oficial/ele${ano}/${codigoTurno}/dados/${ufLower}/${ufLower}${codigoTSE}-c${cargoMap[cargo]}-e000${codigoTurno}-u.json`;

                            const resp = await fetch(url);
                            if (resp.ok) {
                                const resJson = await resp.json();
                                const secoesBasico = extrairSecoesBasico(resJson);

                                // Acumular seções
                                if (secoesBasico) {
                                    if (secoesAcumuladas === null) {
                                        secoesAcumuladas = {
                                            ts: parseInt(secoesBasico.ts) || 0,
                                            st: parseInt(secoesBasico.st) || 0
                                        };
                                    } else {
                                        secoesAcumuladas.ts += parseInt(secoesBasico.ts) || 0;
                                        secoesAcumuladas.st += parseInt(secoesBasico.st) || 0;
                                    }
                                }

                                const carga = resJson.carg ? resJson.carg[0] : resJson.carga[0];
                                if (carga && carga.agr) {
                                    carga.agr.forEach(colig => {
                                        if (colig.par) {
                                            colig.par.forEach(part => {
                                                if (part.cand) {
                                                    part.cand.forEach(c => {
                                                        raw.push({
                                                            nome: c.nm ? c.nm : (c.nmu || c.nm),
                                                            partido: part.sg || c.sgp,
                                                            votos: parseInt(c.vap || c.vapor) || 0
                                                        });
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        } catch (e) {
                            console.log(`Sem dados online para ${siglaUF}-${nome} (${codigoTSE})`);
                        }
                    }
                }

                // Se não houver dados, retornar null
                if (raw.length === 0) return null;

                // Agrupar por candidato (para soma de múltiplas cidades)
                const agg = {};
                raw.forEach(r => {
                    const chave = `${r.nome}|${r.partido}`;
                    if (!agg[chave]) {
                        agg[chave] = { ...r };
                    } else {
                        agg[chave].votos += r.votos;
                    }
                });

                let candidatos = Object.values(agg);
                const total = candidatos.reduce((sum, c) => sum + c.votos, 0);
                candidatos.forEach(c => c.perc = total ? ((c.votos / total) * 100).toFixed(2) : '0');

                candidatos.sort((a, b) => b.votos - a.votos);

                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        codigo_tse: matches[0].codigo_tse,
                        resultados: candidatos,
                        vencedor: candidatos[0]?.partido || null,
                        agregado: matches.length > 1,
                        qtde_cidades_agregadas: matches.length,
                        secoes: secoesAcumuladas
                    }
                };
            });

            const resultados = await Promise.all(promessas);
            resultados.filter(r => r !== null).forEach(r => {
                geoJsonComDados.features.push(r);
            });

            return resultados.length;
        };

        // Processar em lotes
        const tamanhoLote = 30;
        for (let i = 0; i < features.length; i += tamanhoLote) {
            const lote = features.slice(i, i + tamanhoLote);
            await processarLote(lote);

            municipiosProcessados += lote.length;
            updateProgress(municipiosProcessados, totalMunicipios);

            await new Promise(resolve => setTimeout(resolve, 0));
        }

        // Atualizar dados globais
        setGeoJsonData(geoJsonComDados);
        setEstadosCarregar(estadosSelecionados);
        setMunicipiosAtivos([...estadosSelecionados]);

        // Criar ou atualizar layer group no mapa
        const map = getMap();
        if (getLayerGroup()) {
            map.removeLayer(getLayerGroup());
        }

        const newLayerGroup = L.geoJSON(geoJsonComDados.features, {
            style: feature => {
                const cargoSelecionado = cargo;
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
            },
            onEachFeature: (feature, layer) => {
                layer.on('click', () => {
                    mostrarDetalhesMunicipio(feature.properties);
                });
            }
        }).addTo(map);

        setLayerGroup(newLayerGroup);

        // Ajustar visualização do mapa
        if (newLayerGroup.getBounds().isValid()) {
            map.fitBounds(newLayerGroup.getBounds());
        } else {
            map.setView([-15, -55], 4);
        }

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Ocorreu um erro ao carregar os dados: ' + error.message);
    } finally {
        hideLoading();
        mostrarEstatisticasRegionais();
    }
}

// Configurar event listeners
function configurarEventListeners() {
    console.log('Configurando event listeners...');

    document.getElementById('refresh-button').addEventListener('click', carregarDados);
    document.getElementById('export-button').addEventListener('click', exportarMapa);
    document.getElementById('regiao-intermediaria').addEventListener('change', aplicarFiltroEstado);

    document.querySelector('.close-btn').addEventListener('click', () => {
        document.getElementById('info-panel').classList.add('hidden');
    });

    document.getElementById('toggle-panel').addEventListener('click', () => {
        const panel = document.getElementById('info-panel');
        const toggleBtn = document.getElementById('toggle-panel');

        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            mostrarEstatisticasRegionais();
        } else {
            panel.classList.add('hidden');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        }
    });

    checkboxManager.setOnChangeCallback((estadosSelecionados) => {
        console.log('Estados selecionados:', estadosSelecionados);
        aplicarFiltroEstado();
        preencherSeletorRegioesIntermediarias();
        mostrarEstatisticasRegionais();
    });

    console.log('Event listeners configurados');
}

// Função de inicialização
async function inicializar() {
    console.log('Inicializando Mapa Eleitoral Interativo...');

    if (!verificarDependencias()) {
        alert('Erro: Bibliotecas necessárias não foram carregadas. Recarregue a página.');
        return;
    }

    try {
        initMap();
        checkboxManager.init();
        await carregarRegioesIntermediarias();
        preencherSeletorRegioesIntermediarias();
        configurarEventListeners();
        await carregarDados();
        document.getElementById('info-panel').classList.remove('hidden');
        mostrarEstatisticasRegionais();
        console.log('Aplicação inicializada com sucesso!');
    } catch (error) {
        console.error('Erro na inicialização:', error);
        alert('Erro ao inicializar a aplicação: ' + error.message);
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
} else {
    inicializar();
}

// Exportar funções para o escopo global (para debugging)
window.carregarDados = carregarDados;
window.exportarMapa = exportarMapa;
window.aplicarFiltroEstado = aplicarFiltroEstado;
window.mostrarEstatisticasRegionais = mostrarEstatisticasRegionais;