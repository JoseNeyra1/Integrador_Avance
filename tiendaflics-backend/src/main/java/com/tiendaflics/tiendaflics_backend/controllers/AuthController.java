package com.tiendaflics.tiendaflics_backend.controllers;

import com.tiendaflics.tiendaflics_backend.entities.UsuarioPersonal;
import com.tiendaflics.tiendaflics_backend.repositories.UsuarioPersonalRepository;
import com.tiendaflics.tiendaflics_backend.security.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Permite que el Live Server se conecte
public class AuthController {

    @Autowired
    private UsuarioPersonalRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> iniciarSesion(@Valid @RequestBody LoginRequest request) {
        // 1. Buscamos si el usuario existe y está activo usando el método que creamos en el repositorio
        Optional<UsuarioPersonal> usuarioOpt = usuarioRepository.findByIdUsuarioAndActivoTrue(request.getIdUsuario());

        if (usuarioOpt.isPresent()) {
            UsuarioPersonal usuario = usuarioOpt.get();

            // 2. Comparamos la contraseña usando BCrypt
            if (passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {

                String token = jwtService.generarToken(
                        usuario.getIdUsuario(), "STAFF", usuario.getIdPersona(), usuario.getRol().name()
                );

                // 3. Si es correcta, devolvemos los datos básicos (sin la contraseña) + el token
                LoginResponse response = new LoginResponse(
                        usuario.getIdPersona(), usuario.getIdUsuario(), usuario.getRol().name(), token
                );
                return ResponseEntity.ok(response);
            }
        }

        // Si falla, devolvemos un error 401 (No autorizado)
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Credenciales incorrectas o usuario inactivo"));
    }

    // --- Clases Auxiliares (DTOs) para enviar y recibir los JSON ---

    public static class LoginRequest {
        @NotBlank(message = "El usuario es obligatorio")
        private String idUsuario;
        @NotBlank(message = "La contraseña es obligatoria")
        private String password;

        public String getIdUsuario() { return idUsuario; }
        public void setIdUsuario(String idUsuario) { this.idUsuario = idUsuario; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginResponse {
        private Integer idPersona;
        private String idUsuario;
        private String rol;
        private String token;

        public LoginResponse(Integer idPersona, String idUsuario, String rol, String token) {
            this.idPersona = idPersona;
            this.idUsuario = idUsuario;
            this.rol = rol;
            this.token = token;
        }

        public Integer getIdPersona() { return idPersona; }
        public String getIdUsuario() { return idUsuario; }
        public String getRol() { return rol; }
        public String getToken() { return token; }
    }
}
