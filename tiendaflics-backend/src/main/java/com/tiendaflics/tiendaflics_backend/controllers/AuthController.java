package com.tiendaflics.tiendaflics_backend.controllers;

import com.tiendaflics.tiendaflics_backend.entities.UsuarioPersonal;
import com.tiendaflics.tiendaflics_backend.repositories.UsuarioPersonalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioPersonalRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> iniciarSesion(@RequestBody LoginRequest request) {
        // 1. Buscamos si el usuario existe y está activo usando el método que creamos en el repositorio
        Optional<UsuarioPersonal> usuarioOpt = usuarioRepository.findByIdUsuarioAndActivoTrue(request.getIdUsuario());

        if (usuarioOpt.isPresent()) {
            UsuarioPersonal usuario = usuarioOpt.get();

            // 2. Comparamos la contraseña usando BCrypt (hash almacenado en la base de datos)
            if (passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {

                // 3. Si es correcta, devolvemos los datos básicos (sin la contraseña por seguridad)
                LoginResponse response = new LoginResponse(usuario.getIdUsuario(), usuario.getRol().name());
                return ResponseEntity.ok(response);
            }
        }

        // Si falla, devolvemos un error 401 (No autorizado)
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales incorrectas o usuario inactivo");
    }

    // --- Clases Auxiliares (DTOs) para enviar y recibir los JSON ---

    public static class LoginRequest {
        private String idUsuario;
        private String password;

        public String getIdUsuario() { return idUsuario; }
        public void setIdUsuario(String idUsuario) { this.idUsuario = idUsuario; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginResponse {
        private String idUsuario;
        private String rol;

        public LoginResponse(String idUsuario, String rol) {
            this.idUsuario = idUsuario;
            this.rol = rol;
        }

        public String getIdUsuario() { return idUsuario; }
        public String getRol() { return rol; }
    }
}