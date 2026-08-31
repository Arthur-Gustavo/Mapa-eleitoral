// Cores dos partidos
export const coresPartido = {
    'PDT': '#FF00FA',
    'MDB': '#0CBC00',
    'PP': '#1CA0FF',
    'UNIÃO': '#80FF32',
    'DEM': '#80FF32',
    'UNIÃO BRASIL': '#80FF32',
    'PSC': '#76da6fff',
    'PRTB': '#a59846ff',
    'PSD': '#A2FF00',
    'PL': '#0000AB',
    'PT': '#FF0000',
    'PSDB': '#02F6FF',
    'PSOL': '#CA3A75',
    'REDE': '#6BCF42',
    'NOVO': '#FF6B00',
    'CIDADANIA': '#ff3489ff',
    'PODE': '#b746acff',
    'SOLIDARIEDADE': '#eb6f1dff',
    'PATRIOTA': '#05ffcfff',
    'PROS': '#00A79D',
    'PSB': '#F3E861',
    'REPUBLICANOS': '#01FF9E',
    'PV': '#32CD32',
    'PRD': '#05FFCF',
    'PCB': '#FF0000',
    'PCO': '#FF0000',
    'PSTU': '#FF0000',
    'PC do B': 'rgb(110, 0, 1)',
    'AVANTE': '#BC5E02',
    'MOBILIZA': '#C6045C',
    'PSL': 'rgb(8, 148, 57)',
    'PCdoB': 'rgb(110, 0, 1)',
    'PHS': 'rgb(188, 94, 2)',
    'PTB': 'rgb(185, 175, 24)',
    'PRP': '#769e3a'
};

// Mapeamentos extras
coresPartido['PRB'] = coresPartido['REPUBLICANOS'];
coresPartido['PPS'] = coresPartido['CIDADANIA'];

// Degradês para eleições presidenciais, governador e senador
export const degradesPresidenciais = {
    'PT': {
        '<50%': 'rgb(255, 83, 73)',
        '50-59.99%': 'rgb(255, 12, 2)',
        '60-69.99%': 'rgb(223, 8, 0)',
        '70-79.99%': 'rgb(195, 7, 0)',
        '80-89.99%': 'rgb(158, 5, 0)',
        '90%+': 'rgb(128, 4, 0)'
    },
    'PL': {
        '<50%': 'rgb(64, 64, 179)',
        '50-59.99%': 'rgb(0, 0, 171)',
        '60-69.99%': 'rgb(0, 0, 120)',
        '70-79.99%': 'rgb(0, 0, 85)',
        '80-89.99%': 'rgb(0, 0, 60)',
        '90%+': 'rgb(0, 0, 35)'
    },
    'NOVO': {
        '<50%': 'rgb(255, 169, 83)',
        '50-59.99%': 'rgb(255, 128, 0)',
        '60-69.99%': 'rgb(219, 110, 0)',
        '70-79.99%': 'rgb(182, 91, 0)',
        '80-89.99%': 'rgb(135, 67, 0)',
        '90%+': 'rgb(106, 53, 0)'
    },
    'PSD': {
        '<50%': 'rgb(189, 252, 74)',
        '50-59.99%': 'rgb(162, 255, 0)',
        '60-69.99%': 'rgb(139, 218, 0)',
        '70-79.99%': 'rgb(120, 181, 11)',
        '80-89.99%': 'rgb(112, 165, 15)',
        '90%+': 'rgba(85, 126, 10, 1)'
    },
    'MDB': {
        '<50%': 'rgb(49, 255, 35)',
        '50-59.99%': 'rgb(12, 188, 0)',
        '60-69.99%': 'rgb(10, 158, 0)',
        '70-79.99%': 'rgb(8, 134, 0)',
        '80-89.99%': 'rgb(6, 111, 0)',
        '90%+': 'rgba(4, 80, 0, 1)'
    },
    'UNIÃO BRASIL': {
        '<50%': 'rgb(157, 255, 97)',
        '50-59.99%': 'rgb(128, 255, 50)',
        '60-69.99%': 'rgb(114, 229, 44)',
        '70-79.99%': 'rgb(104, 206, 42)',
        '80-89.99%': 'rgb(100, 178, 52)',
        '90%+': 'rgba(83, 138, 49, 1)'
    },
    'DEM': {
        '<50%': 'rgb(157, 255, 97)',
        '50-59.99%': 'rgb(128, 255, 50)',
        '60-69.99%': 'rgb(114, 229, 44)',
        '70-79.99%': 'rgb(104, 206, 42)',
        '80-89.99%': 'rgb(100, 178, 52)',
        '90%+': 'rgba(83, 138, 49, 1)'
    },
    'REPUBLICANOS': {
        '<50%': 'rgb(133, 255, 210)',
        '50-59.99%': 'rgb(1, 255, 158)',
        '60-69.99%': 'rgb(0, 210, 131)',
        '70-79.99%': 'rgb(0, 195, 122)',
        '80-89.99%': 'rgba(1, 177, 112, 1)',
        '90%+': 'rgba(0, 156, 99, 1)'
    },
    'PSDB': {
        '<50%': 'rgb(105, 250, 255)',
        '50-59.99%': 'rgb(2, 246, 255)',
        '60-69.99%': 'rgb(0, 208, 215)',
        '70-79.99%': 'rgb(0, 179, 185)',
        '80-89.99%': 'rgba(0, 146, 151, 1)',
        '90%+': 'rgba(0, 113, 117, 1)'
    },
    'PP': {
        '<50%': 'rgb(58, 173, 255)',
        '50-59.99%': 'rgb(28, 160, 255)',
        '60-69.99%': 'rgb(14, 135, 222)',
        '70-79.99%': 'rgb(23, 115, 191)',
        '80-89.99%': 'rgba(17, 106, 171, 1)',
        '90%+': 'rgba(16, 96, 153, 1)'
    },
    'PSB': {
        '<50%': 'rgb(239, 231, 132)',
        '50-59.99%': 'rgb(243, 232, 97)',
        '60-69.99%': 'rgba(224, 214, 64, 1)',
        '70-79.99%': 'rgb(212, 201, 61)',
        '80-89.99%': 'rgba(181, 173, 67, 1)',
        '90%+': 'rgba(158, 151, 58, 1)'
    },
    'PSL': {
        '<50%': 'rgb(51, 190, 99)',
        '50-59.99%': 'rgb(8, 148, 57)',
        '60-69.99%': 'rgba(0, 121, 41, 1)',
        '70-79.99%': 'rgb(0, 94, 32)',
        '80-89.99%': 'rgba(0, 74, 25, 1)',
        '90%+': 'rgba(0, 53, 18, 1)'
    },
    'PDT': {
        '<50%': 'rgb(255, 105, 253)',
        '50-59.99%': 'rgb(255, 0, 250)',
        '60-69.99%': 'rgba(229, 0, 224, 1)',
        '70-79.99%': 'rgb(202, 0, 197)',
        '80-89.99%': 'rgba(185, 0, 180, 1)',
        '90%+': 'rgba(156, 0, 151, 1)'
    },
    'PC do B': {
        '<50%': 'rgb(136, 12, 14)',
        '50-59.99%': 'rgb(110, 0, 1)',
        '60-69.99%': 'rgb(95, 2, 3)',
        '70-79.99%': 'rgb(78, 6, 7)',
        '80-89.99%': 'rgb(63, 4, 5)',
        '90%+': 'rgb(48, 2, 2)'
    }
};

// Função para obter cor baseada na porcentagem
export function getColorByPercentage(partido, porcentagem) {
    if (!degradesPresidenciais[partido]) {
        return coresPartido[partido] || 'rgb(180,180,180)';
    }

    const faixas = degradesPresidenciais[partido];
    porcentagem = parseFloat(porcentagem);

    if (porcentagem < 50) return faixas['<50%'];
    if (porcentagem < 60) return faixas['50-59.99%'];
    if (porcentagem < 70) return faixas['60-69.99%'];
    if (porcentagem < 80) return faixas['70-79.99%'];
    if (porcentagem < 90) return faixas['80-89.99%'];
    return faixas['90%+'];
}