// js/login-personal.js
document.addEventListener('DOMContentLoaded', () => {
    const btnIngresar = document.getElementById('btn-ingresar');
    
    if (btnIngresar) {
        btnIngresar.addEventListener('click', async () => {
            const idUsuario = document.getElementById('login-id').value.trim();
            const password = document.getElementById('login-pass').value;
            const errorLabel = document.getElementById('login-error');
            
            errorLabel.textContent = ''; 

            if(!idUsuario || !password) {
                errorLabel.textContent = '⚠️ Por favor, ingrese sus credenciales completas.';
                return;
            }

            btnIngresar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
            btnIngresar.disabled = true;

            try {
                const API_URL = window.BACKEND_API_URL || 'http://localhost:8080/api';
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idUsuario, password })
                });

                if (res.ok) {
                    const usuarioData = await res.json();
                    localStorage.setItem('flics_usuario', JSON.stringify(usuarioData));

                    if (usuarioData.rol === 'ADMIN') {
                        window.location.href = 'admin.html';
                    } else if (usuarioData.rol === 'VENDEDOR') {
                        window.location.href = 'pos.html';
                    }
                } else {
                    errorLabel.textContent = '❌ Credenciales incorrectas o acceso revocado.';
                    btnIngresar.innerHTML = 'Iniciar Sesión Segura <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>';
                    btnIngresar.disabled = false;
                }
            } catch (error) {
                errorLabel.textContent = '🔌 Error de conexión con el servidor interno.';
                btnIngresar.innerHTML = 'Iniciar Sesión Segura <i class="fas fa-arrow-right" style="margin-left: 8px;"></i>';
                btnIngresar.disabled = false;
                console.error(error);
            }
        });
    }
});