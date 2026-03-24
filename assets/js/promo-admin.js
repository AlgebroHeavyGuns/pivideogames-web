class PromoCodeAdmin {
    constructor() {
        this.apiBaseUrl = 'https://web-production-adbf1.up.railway.app';
        this.tokens = {
            get: null,
            create: null,
            delete: null
        };
        this.codes = [];
        this.init();
    }

    init() {
        this.loadTokensFromStorage();
        this.bindEvents();
        
        if (this.tokens.get) {
            this.showAdminPanel();
            this.loadCodes();
        }
    }

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadCodes();
            });
        }

        const createBtn = document.getElementById('createBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateModal();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Create modal
        const closeCreateModal = document.getElementById('closeCreateModal');
        if (closeCreateModal) {
            closeCreateModal.addEventListener('click', () => {
                this.hideCreateModal();
            });
        }

        const cancelCreate = document.getElementById('cancelCreate');
        if (cancelCreate) {
            cancelCreate.addEventListener('click', () => {
                this.hideCreateModal();
            });
        }

        const createCodeForm = document.getElementById('createCodeForm');
        if (createCodeForm) {
            createCodeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createCode();
            });
        }

        const createModal = document.getElementById('createModal');
        if (createModal) {
            createModal.addEventListener('click', (e) => {
                if (e.target.id === 'createModal') {
                    this.hideCreateModal();
                }
            });
        }
    }

    loadTokensFromStorage() {
        this.tokens.get = localStorage.getItem('promo_get_token');
        this.tokens.create = localStorage.getItem('promo_create_token');
        this.tokens.delete = localStorage.getItem('promo_delete_token');
    }

    saveTokensToStorage() {
        if (this.tokens.get) localStorage.setItem('promo_get_token', this.tokens.get);
        if (this.tokens.create) localStorage.setItem('promo_create_token', this.tokens.create);
        if (this.tokens.delete) localStorage.setItem('promo_delete_token', this.tokens.delete);
    }

    async login() {
        const getTokenInput = document.getElementById('getToken');
        const createTokenInput = document.getElementById('createToken');
        const deleteTokenInput = document.getElementById('deleteToken');

        if (!getTokenInput || !createTokenInput || !deleteTokenInput) {
            console.error('Input elements not found');
            return;
        }

        const getToken = getTokenInput.value.trim();
        const createToken = createTokenInput.value.trim();
        const deleteToken = deleteTokenInput.value.trim();

        if (!getToken) {
            this.showError('loginError', 'El token de consulta es requerido');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/get-promo-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: getToken })
            });

            const data = await response.json();

            if (data.status === 'success') {
                this.tokens.get = getToken;
                this.tokens.create = createToken || null;
                this.tokens.delete = deleteToken || null;
                
                this.saveTokensToStorage();
                this.showAdminPanel();
                this.codes = data.data || [];
                this.renderCodes();
                this.hideError('loginError');
            } else {
                this.showError('loginError', data.message || 'Token inválido');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('loginError', 'Error de conexión. Verifica que la API esté funcionando.');
        }
    }

    async loadCodes() {
        if (!this.tokens.get) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/get-promo-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: this.tokens.get })
            });

            const data = await response.json();

            if (data.status === 'success') {
                this.codes = data.data || [];
                this.renderCodes();
                this.hideMessage();
            } else {
                this.showMessage('Error al cargar códigos: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Load codes error:', error);
            this.showMessage('Error de conexión al cargar códigos', 'error');
        }
    }

    async createCode() {
        if (!this.tokens.create) {
            this.showMessage('No tienes permisos para crear códigos', 'error');
            return;
        }

        const promoCodeInput = document.getElementById('newPromoCode');
        const descriptionInput = document.getElementById('newDescription');

        if (!promoCodeInput || !descriptionInput) {
            console.error('Input elements not found');
            return;
        }

        const promoCode = promoCodeInput.value.trim();
        const description = descriptionInput.value.trim();

        if (!promoCode || !description) {
            this.showMessage('Todos los campos son requeridos', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/create-promo-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: this.tokens.create,
                    promo_code: promoCode,
                    context: description
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                this.showMessage('Código creado exitosamente', 'success');
                this.hideCreateModal();
                this.loadCodes();
                const form = document.getElementById('createCodeForm');
                if (form) form.reset();
            } else {
                this.showMessage('Error al crear código: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Create code error:', error);
            this.showMessage('Error de conexión al crear código', 'error');
        }
    }

    async deleteCode(promoCode) {
        if (!this.tokens.delete) {
            this.showMessage('No tienes permisos para eliminar códigos', 'error');
            return;
        }

        if (!confirm(`¿Estás seguro de que quieres eliminar el código "${promoCode}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/delete-promo-code`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: this.tokens.delete,
                    promo_code: promoCode
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                this.showMessage('Código eliminado exitosamente', 'success');
                this.loadCodes();
            } else {
                this.showMessage('Error al eliminar código: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Delete code error:', error);
            this.showMessage('Error de conexión al eliminar código', 'error');
        }
    }

    renderCodes() {
        const tbody = document.getElementById('codesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.codes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay códigos promocionales</td></tr>';
            return;
        }

        let totalRedeemed = 0;
        let unusedCodes = 0;

        this.codes.forEach(code => {
            totalRedeemed += code.quantity_redeemed;
            if (code.quantity_redeemed === 0) unusedCodes++;

            const row = document.createElement('tr');
            const escapedPromoCode = this.escapeHtml(code.promo_code);
            
            row.innerHTML = `
                <td><strong>${escapedPromoCode}</strong></td>
                <td>${code.context && code.context.description ? this.escapeHtml(code.context.description) : 'Sin descripción'}</td>
                <td>${code.quantity_redeemed}</td>
                <td>${new Date(code.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-danger btn-sm ${!this.tokens.delete ? 'disabled' : ''}" 
                                onclick="window.promoAdmin.deleteCode('${escapedPromoCode}')"
                                ${!this.tokens.delete ? 'disabled title="No tienes permisos para eliminar códigos"' : ''}>
                            Eliminar
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Update statistics
        const totalCodesEl = document.getElementById('totalCodes');
        const totalRedeemedEl = document.getElementById('totalRedeemed');
        const unusedCodesEl = document.getElementById('unusedCodes');

        if (totalCodesEl) totalCodesEl.textContent = this.codes.length;
        if (totalRedeemedEl) totalRedeemedEl.textContent = totalRedeemed;
        if (unusedCodesEl) unusedCodesEl.textContent = unusedCodes;
    }

    showAdminPanel() {
        const loginSection = document.getElementById('loginSection');
        const adminPanel = document.getElementById('adminPanel');

        if (loginSection) loginSection.classList.add('hidden');
        if (adminPanel) adminPanel.classList.remove('hidden');
    }

    showLoginPanel() {
        const loginSection = document.getElementById('loginSection');
        const adminPanel = document.getElementById('adminPanel');

        if (loginSection) loginSection.classList.remove('hidden');
        if (adminPanel) adminPanel.classList.add('hidden');
    }

    showCreateModal() {
        if (!this.tokens.create) {
            this.showMessage('No tienes permisos para crear códigos', 'error');
            return;
        }
        const modal = document.getElementById('createModal');
        if (modal) modal.classList.add('show');
    }

    hideCreateModal() {
        const modal = document.getElementById('createModal');
        if (modal) modal.classList.remove('show');
        
        const form = document.getElementById('createCodeForm');
        if (form) form.reset();
    }

    logout() {
        localStorage.removeItem('promo_get_token');
        localStorage.removeItem('promo_create_token');
        localStorage.removeItem('promo_delete_token');
        
        this.tokens = { get: null, create: null, delete: null };
        this.codes = [];
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
        
        this.showLoginPanel();
        this.hideMessage();
        this.hideError('loginError');
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('message');
        if (!messageEl) return;

        messageEl.textContent = message;
        messageEl.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
        messageEl.classList.remove('hidden');
        
        setTimeout(() => {
            this.hideMessage();
        }, 5000);
    }

    hideMessage() {
        const messageEl = document.getElementById('message');
        if (messageEl) messageEl.classList.add('hidden');
    }

    showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        if (!errorEl) return;

        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }

    hideError(elementId) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) errorEl.classList.add('hidden');
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.promo-admin')) {
        window.promoAdmin = new PromoCodeAdmin();
    }
});