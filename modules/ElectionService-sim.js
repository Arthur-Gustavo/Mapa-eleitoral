
// modules/ElectionService.js
//
// Centraliza a identificação do código de eleição utilizado pelo TSE.
// O restante da aplicação não precisa saber se o cargo pertence ao
// pleito federal ou estadual.
//
// IMPORTANTE:
// Os códigos de produção de 2026 ainda não devem ser preenchidos com
// os códigos do simulado (21270 / 21272).
//
// Quando o TSE disponibilizar os códigos oficiais de produção,
// eles serão cadastrados em constants.js ou obtidos pelo arquivo
// de configuração oficial, conforme a estratégia definida para o projeto.

import { cargoMap, codigosEleicao } from './constants.js';

/**
 * Define a qual tipo de eleição cada cargo pertence.
 *
 * Em 2026:
 * - Presidente -> Federal
 * - Governador -> Estadual
 * - Senador -> Estadual
 * - Deputado Federal -> Estadual
 * - Deputado Estadual/Distrital -> Estadual
 *
 * Para eleições municipais, os cargos municipais continuam sendo
 * tratados pelos códigos correspondentes àquele ano.
 */
const tipoEleicaoPorCargo = {
    presidente: 'federal',
    governador: 'estadual',
    senador: 'estadual',
    deputado_federal: 'estadual',
    deputado_estadual: 'estadual',
    deputado_distrital: 'estadual',

    // Mantido para compatibilidade com 2024 e outros anos municipais.
    prefeito: 'municipal',
    vereador: 'municipal'
};

/**
 * Retorna o tipo de eleição correspondente ao cargo.
 */
export function getTipoEleicao(cargo) {
    const tipo = tipoEleicaoPorCargo[cargo];

    if (!tipo) {
        throw new Error(`Tipo de eleição não configurado para o cargo: ${cargo}`);
    }

    return tipo;
}

/**
 * Retorna o código da eleição para determinado ano, turno e cargo.
 *
 * Para 2024:
 * mantém o comportamento antigo:
 *   1º turno -> 619
 *   2º turno -> 620
 *
 * Para 2026:
 * a estrutura passa a separar:
 *   turno -> federal / estadual / municipal
 */
export function getCodigoEleicao(ano, turno, cargo) {
    const anoConfig = codigosEleicao[ano];

    if (!anoConfig) {
        throw new Error(`Ano de eleição não configurado: ${ano}`);
    }

    const tipo = getTipoEleicao(cargo);

    // Estrutura antiga: ano -> turno -> código
    // Mantida para anos que ainda utilizam esse formato.
    if (
        anoConfig[turno] &&
        typeof anoConfig[turno] === 'string'
    ) {
        return anoConfig[turno];
    }

    // Estrutura nova:
    // ano -> turno -> federal/estadual/municipal -> código
    const codigo = anoConfig[turno]?.[tipo];

    if (!codigo || codigo === '000') {
        throw new Error(
            `Código de eleição não configurado para ${ano}, ` +
            `${turno}º turno, eleição ${tipo}, cargo ${cargo}.`
        );
    }

    return codigo;
}

/**
 * Retorna o código do cargo utilizado no nome do arquivo do TSE.
 */
export function getCodigoCargo(cargo) {
    const codigo = cargoMap[cargo];

    if (!codigo) {
        throw new Error(`Código TSE não configurado para o cargo: ${cargo}`);
    }

    return codigo;
}

/**
 * Monta a URL oficial dos arquivos municipais de resultados.
 *
 * Exemplo conceitual:
 * https://resultados.tse.jus.br/oficial/ele2026/XXXX/dados/mg/mg41238-c0001-e0XXXX-u.json
 */
export function construirUrlResultado({
    ano,
    turno,
    cargo,
    siglaUF,
    codigoTSE
}) {
    const codigoEleicao = getCodigoEleicao(ano, turno, cargo);
    const codigoCargo = getCodigoCargo(cargo);

    const ufLower = siglaUF.toLowerCase();
    const municipio = String(codigoTSE).padStart(5, '0');
    const eleicao = String(codigoEleicao).padStart(6, '0');

    if (String(ano) === '2026') {
        return (
            `https://resultados-sim.tse.jus.br/simulado/` +
            `simulado2026/ele2026/` +
            `${codigoEleicao}/` +
            `dados/${ufLower}/` +
            `${ufLower}${municipio}-c${codigoCargo}-e${eleicao}-u.json`
        );
    }

    return (
        `https://resultados.tse.jus.br/oficial/` +
        `ele${ano}/` +
        `${codigoEleicao}/` +
        `dados/${ufLower}/` +
        `${ufLower}${municipio}-c${codigoCargo}-e${eleicao}-u.json`
    );
}

