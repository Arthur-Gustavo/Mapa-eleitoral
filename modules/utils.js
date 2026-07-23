// Funções utilitárias gerais

// Verificar se todas as dependências estão carregadas
export function verificarDependencias() {
    if (typeof L === 'undefined') {
        console.error('Leaflet não foi carregado!');
        return false;
    }
    if (typeof JSZip === 'undefined') {
        console.error('JSZip não foi carregado!');
        return false;
    }
    if (typeof html2canvas === 'undefined') {
        console.warn('html2canvas não foi carregado. A exportação pode não funcionar.');
    }
    return true;
}

// Formatar número com separadores de milhar
export function formatarNumero(numero) {
    return numero.toLocaleString('pt-BR');
}

// Carregar arquivo JSON
export async function carregarJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`Erro ao carregar ${url}:`, error);
        return null;
    }
}

// Debounce function para otimizar eventos
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}