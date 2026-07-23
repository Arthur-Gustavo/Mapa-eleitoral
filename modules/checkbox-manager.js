// modules/checkbox-manager.js - VERSÃO DROPDOWN
import { todasUFs, regioes, nomesRegioes } from './constants.js';

class CheckboxManager {
    constructor() {
        this.dropdownButton = null;
        this.dropdownContent = null;
        this.checkboxes = new Map();
        this.regiaoDropdown = null;
        this.onChangeCallback = null;
        this.estadosSelecionados = new Set([...todasUFs]);
        this.isOpen = false;
    }

    init() {
        this.createDropdown();
        this.setupRegiaoDropdown();
        this.renderCheckboxes();
        this.setupClickOutside();
        this.updateButtonText();
    }

    createDropdown() {
        // Localizar o grupo de filtro do estado
        const estadoFilterGroup = document.querySelector('.filter-group:has(#estado)');
        if (!estadoFilterGroup) return;

        // Esconder o dropdown original
        const estadoSelect = document.getElementById('estado');
        estadoSelect.style.display = 'none';
        this.originalEstadoSelect = estadoSelect;

        // Criar botão do dropdown
        this.dropdownButton = document.createElement('button');
        this.dropdownButton.className = 'dropdown-estados-button';
        this.dropdownButton.id = 'dropdown-estados-button';
        this.dropdownButton.innerHTML = '<i class="fas fa-chevron-down" style="margin-right: 8px;"></i> Estados (Todos)';
        this.dropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Criar conteúdo do dropdown
        this.dropdownContent = document.createElement('div');
        this.dropdownContent.className = 'dropdown-estados-content';
        this.dropdownContent.id = 'dropdown-estados-content';
        this.dropdownContent.style.display = 'none';

        // Container para as checkboxes
        this.container = document.createElement('div');
        this.container.className = 'checkbox-container';
        this.dropdownContent.appendChild(this.container);

        // Adicionar ao DOM
        estadoFilterGroup.appendChild(this.dropdownButton);
        estadoFilterGroup.appendChild(this.dropdownContent);
    }

    setupRegiaoDropdown() {
        this.regiaoDropdown = document.getElementById('regiao');
        if (this.regiaoDropdown) {
            this.regiaoDropdown.addEventListener('change', () => {
                this.handleRegiaoChange();
            });
        }
    }

    handleRegiaoChange() {
        const regiaoSelecionada = this.regiaoDropdown.value;

        if (regiaoSelecionada === 'BR') {
            this.estadosSelecionados = new Set([...todasUFs]);
        } else if (regioes[regiaoSelecionada]) {
            this.estadosSelecionados = new Set([...regioes[regiaoSelecionada]]);
        }

        this.renderCheckboxes();
        this.updateButtonText();

        if (this.onChangeCallback) {
            this.onChangeCallback(this.getEstadosSelecionados());
        }
    }

    renderCheckboxes() {
        if (!this.container) return;

        this.container.innerHTML = '';
        this.checkboxes.clear();

        // Agrupar estados por região
        const estadosPorRegiao = {};

        todasUFs.forEach(uf => {
            let regiaoDoEstado = 'BR';
            for (const [regiao, estados] of Object.entries(regioes)) {
                if (estados.includes(uf)) {
                    regiaoDoEstado = regiao;
                    break;
                }
            }

            if (!estadosPorRegiao[regiaoDoEstado]) {
                estadosPorRegiao[regiaoDoEstado] = [];
            }
            estadosPorRegiao[regiaoDoEstado].push(uf);
        });

        // Botão "Selecionar Todos"
        const selectAllContainer = document.createElement('div');
        selectAllContainer.className = 'checkbox-select-all';

        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = 'select-all-estados';
        selectAllCheckbox.checked = this.estadosSelecionados.size === todasUFs.length;
        selectAllCheckbox.indeterminate = this.estadosSelecionados.size > 0 && this.estadosSelecionados.size < todasUFs.length;

        const selectAllLabel = document.createElement('label');
        selectAllLabel.htmlFor = 'select-all-estados';
        selectAllLabel.textContent = 'Selecionar Todos';
        selectAllLabel.className = 'select-all-label';

        selectAllCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.estadosSelecionados = new Set([...todasUFs]);
            } else {
                this.estadosSelecionados.clear();
            }

            this.renderCheckboxes();
            this.updateButtonText();

            if (this.onChangeCallback) {
                this.onChangeCallback(this.getEstadosSelecionados());
            }
        });

        selectAllContainer.appendChild(selectAllCheckbox);
        selectAllContainer.appendChild(selectAllLabel);
        this.container.appendChild(selectAllContainer);

        // Criar checkboxes por região
        Object.keys(regioes).forEach(regiao => {
            if (regiao === 'BR' || !estadosPorRegiao[regiao]) return;

            const regiaoHeader = document.createElement('div');
            regiaoHeader.className = 'checkbox-regiao-header';
            regiaoHeader.innerHTML = `
                <input type="checkbox" id="regiao-${regiao}" 
                       ${this.isRegiaoCompleta(regiao) ? 'checked' : ''}>
                <label for="regiao-${regiao}" class="regiao-label">
                    ${nomesRegioes[regiao]}
                </label>
            `;

            const regiaoCheckbox = regiaoHeader.querySelector('input');
            regiaoCheckbox.addEventListener('change', (e) => {
                this.toggleRegiao(regiao, e.target.checked);
                this.updateButtonText();

                if (this.onChangeCallback) {
                    this.onChangeCallback(this.getEstadosSelecionados());
                }
            });

            this.container.appendChild(regiaoHeader);

            const estadosContainer = document.createElement('div');
            estadosContainer.className = 'checkbox-estados-container';

            estadosPorRegiao[regiao].forEach(uf => {
                const checkboxItem = this.createCheckboxItem(uf);
                estadosContainer.appendChild(checkboxItem);
            });

            this.container.appendChild(estadosContainer);
        });
    }

    createCheckboxItem(uf) {
        const item = document.createElement('div');
        item.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `estado-${uf}`;
        checkbox.value = uf;
        checkbox.checked = this.estadosSelecionados.has(uf);

        const label = document.createElement('label');
        label.htmlFor = `estado-${uf}`;
        label.textContent = uf;
        label.className = 'checkbox-label';

        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.estadosSelecionados.add(uf);
            } else {
                this.estadosSelecionados.delete(uf);
            }

            this.updateRegiaoCheckbox(uf);
            this.updateButtonText();
            this.updateSelectAllCheckbox();

            if (this.onChangeCallback) {
                this.onChangeCallback(this.getEstadosSelecionados());
            }
        });

        item.appendChild(checkbox);
        item.appendChild(label);

        this.checkboxes.set(uf, checkbox);
        return item;
    }

    isRegiaoCompleta(regiao) {
        const estadosDaRegiao = regioes[regiao];
        return estadosDaRegiao.every(uf => this.estadosSelecionados.has(uf));
    }

    updateRegiaoCheckbox(ufChanged) {
        let regiaoDoEstado = null;
        for (const [regiao, estados] of Object.entries(regioes)) {
            if (regiao !== 'BR' && estados.includes(ufChanged)) {
                regiaoDoEstado = regiao;
                break;
            }
        }

        if (regiaoDoEstado) {
            const regiaoCheckbox = document.getElementById(`regiao-${regiaoDoEstado}`);
            if (regiaoCheckbox) {
                regiaoCheckbox.checked = this.isRegiaoCompleta(regiaoDoEstado);
                regiaoCheckbox.indeterminate = this.isRegiaoParcial(regiaoDoEstado);
            }
        }
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all-estados');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = this.estadosSelecionados.size === todasUFs.length;
            selectAllCheckbox.indeterminate = this.estadosSelecionados.size > 0 && this.estadosSelecionados.size < todasUFs.length;
        }
    }

    isRegiaoParcial(regiao) {
        const estadosDaRegiao = regioes[regiao];
        const selecionados = estadosDaRegiao.filter(uf =>
            this.estadosSelecionados.has(uf)
        ).length;

        return selecionados > 0 && selecionados < estadosDaRegiao.length;
    }

    toggleRegiao(regiao, selecionar) {
        const estadosDaRegiao = regioes[regiao];

        if (selecionar) {
            estadosDaRegiao.forEach(uf => this.estadosSelecionados.add(uf));
        } else {
            estadosDaRegiao.forEach(uf => this.estadosSelecionados.delete(uf));
        }

        this.renderCheckboxes();
        this.updateSelectAllCheckbox();
        this.updateButtonText();
        if (this.onChangeCallback) {
            this.onChangeCallback(this.getEstadosSelecionados());
        }
    }

    updateButtonText() {
        if (!this.dropdownButton) return;

        const selecionados = this.getEstadosSelecionados();
        if (selecionados.length === 0) {
            this.dropdownButton.innerHTML = '<i class="fas fa-chevron-down" style="margin-right: 8px;"></i> Estados (Nenhum)';
        } else if (selecionados.length === todasUFs.length) {
            this.dropdownButton.innerHTML = '<i class="fas fa-chevron-down" style="margin-right: 8px;"></i> Estados (Todos)';
        } else if (selecionados.length === 1) {
            this.dropdownButton.innerHTML = `<i class="fas fa-chevron-down" style="margin-right: 8px;"></i> ${selecionados[0]}`;
        } else if (selecionados.length <= 3) {
            this.dropdownButton.innerHTML = `<i class="fas fa-chevron-down" style="margin-right: 8px;"></i> ${selecionados.join(', ')}`;
        } else {
            this.dropdownButton.innerHTML = `<i class="fas fa-chevron-down" style="margin-right: 8px;"></i> ${selecionados.length} estados`;
        }
    }

    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        if (this.dropdownContent) {
            this.dropdownContent.style.display = 'block';
            this.isOpen = true;
            this.dropdownButton.innerHTML = this.dropdownButton.innerHTML.replace('fa-chevron-down', 'fa-chevron-up');
        }
    }

    closeDropdown() {
        if (this.dropdownContent) {
            this.dropdownContent.style.display = 'none';
            this.isOpen = false;
            this.dropdownButton.innerHTML = this.dropdownButton.innerHTML.replace('fa-chevron-up', 'fa-chevron-down');
        }
    }

    setupClickOutside() {
        document.addEventListener('click', (e) => {
            if (!this.dropdownContent || !this.dropdownButton || !this.isOpen) return;

            const isClickInside = this.dropdownContent.contains(e.target) ||
                this.dropdownButton.contains(e.target);

            if (!isClickInside) {
                this.closeDropdown();
            }
        });
    }

    getEstadosSelecionados() {
        return Array.from(this.estadosSelecionados);
    }

    setEstadosSelecionados(estados) {
        this.estadosSelecionados = new Set(estados);
        this.renderCheckboxes();
        this.updateButtonText();

        if (this.onChangeCallback) {
            this.onChangeCallback(this.getEstadosSelecionados());
        }
    }

    setOnChangeCallback(callback) {
        this.onChangeCallback = callback;
    }
}

const checkboxManager = new CheckboxManager();
export default checkboxManager;