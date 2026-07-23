// Mapeamento de cargos
export const cargoMap = {
    presidente: '0001',
    governador: '0003',
    senador: '0005',
    prefeito: '0011'
};

// Códigos de eleição
export const codigosEleicao = {
    2024: {
        1: '619',
        2: '620'
    },
    2026: {
        1: '000',
        2: '000'
    }
};

// Regiões do Brasil
export const regioes = {
    "N": ["AC", "AM", "AP", "PA", "RO", "RR", "TO"],
    "NE": ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
    "CO": ["DF", "GO", "MT", "MS"],
    "SE": ["ES", "MG", "RJ", "SP"],
    "S": ["PR", "RS", "SC"],
    "ZZ": ["ZZ"],
    "BR": []
};

export const nomesRegioes = {
    "N": "Norte",
    "NE": "Nordeste",
    "CO": "Centro-Oeste",
    "SE": "Sudeste",
    "S": "Sul",
    "ZZ": "Exterior",
    "BR": "Todo Brasil"
};

export const todasUFs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', 'ZZ'
];