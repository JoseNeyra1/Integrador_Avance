// Helper de fetch compartido: arma la URL con API_BASE_URL y agrega el token JWT
// (de staff o de cliente, el que esté guardado) a la cabecera Authorization.
function obtenerToken() {
    const staff = localStorage.getItem('flics_usuario');
    if (staff) {
        try {
            const token = JSON.parse(staff).token;
            if (token) return token;
        } catch (e) { /* ignorar JSON inválido */ }
    }

    const cliente = localStorage.getItem('flics_cliente_web');
    if (cliente) {
        try {
            const token = JSON.parse(cliente).token;
            if (token) return token;
        } catch (e) { /* ignorar JSON inválido */ }
    }

    return null;
}

async function apiFetch(path, options = {}) {
    const token = obtenerToken();
    const headers = Object.assign({}, options.headers || {});
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

    if (response.status === 401) {
        manejarSesionInvalida();
    }

    return response;
}

// Si el backend rechaza el token (sesión vieja de antes de activar JWT, o expirada),
// limpiamos la sesión guardada y mandamos a la persona a iniciar sesión de nuevo
// en vez de dejar que vea un error genérico de "no se pudo procesar".
function manejarSesionInvalida() {
    const teniaSesionStaff = !!localStorage.getItem('flics_usuario');
    const teniaSesionCliente = !!localStorage.getItem('flics_cliente_web');

    if (!teniaSesionStaff && !teniaSesionCliente) {
        return;
    }

    localStorage.removeItem('flics_usuario');
    localStorage.removeItem('flics_cliente_web');

    const path = window.location.pathname;
    if (path.includes('login-personal.html') || path.includes('login-cliente.html')) {
        return;
    }

    if (teniaSesionStaff) {
        window.location.href = 'login-personal.html';
    } else {
        alert('Tu sesión expiró. Vuelve a iniciar sesión para continuar.');
        window.location.href = 'login-cliente.html';
    }
}
