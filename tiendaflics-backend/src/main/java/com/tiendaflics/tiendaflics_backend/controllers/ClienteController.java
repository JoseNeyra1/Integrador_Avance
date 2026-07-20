package com.tiendaflics.tiendaflics_backend.controllers;

import com.tiendaflics.tiendaflics_backend.entities.Cliente;
import com.tiendaflics.tiendaflics_backend.entities.Persona;
import com.tiendaflics.tiendaflics_backend.repositories.ClienteRepository;
import com.tiendaflics.tiendaflics_backend.repositories.PersonaRepository;
import com.tiendaflics.tiendaflics_backend.security.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*") // Permite la conexión desde tu frontend (Live Server)
public class ClienteController {

    @Autowired
    private PersonaRepository personaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    // 1. ENDPOINT DE REGISTRO
    @PostMapping("/registro")
    public ResponseEntity<?> registrarCliente(@Valid @RequestBody RegistroRequest request) {
        try {
            // Paso A: Guardar los datos básicos en la tabla Persona
            Persona nuevaPersona = new Persona();
            nuevaPersona.setNombre(request.getNombre());
            nuevaPersona.setDocumento(request.getDocumento());
            nuevaPersona.setEmail(request.getEmail());

            // save() inserta en la BD y nos devuelve el objeto con el ID autogenerado
            Persona personaGuardada = personaRepository.save(nuevaPersona);

            // Paso B: Crear el perfil de Cliente usando el ID de la Persona recién creada
            Cliente nuevoCliente = new Cliente();
            nuevoCliente.setIdPersona(personaGuardada.getIdPersona());
            nuevoCliente.setPuntosLealtad(0);
            nuevoCliente.setPassword(passwordEncoder.encode(request.getPassword()));
            clienteRepository.save(nuevoCliente);

            // Paso C: Devolver los datos + token al frontend para que inicie sesión automáticamente
            String token = jwtService.generarToken(personaGuardada.getEmail(), "CLIENTE", personaGuardada.getIdPersona(), "CLIENTE");
            LoginResponse response = new LoginResponse(personaGuardada.getIdPersona(), personaGuardada.getNombre(), personaGuardada.getEmail(), token);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Error al registrar: Puede que el correo o DNI ya existan."));
        }
    }

    // 2. ENDPOINT DE INICIO DE SESIÓN
    @PostMapping("/login")
    public ResponseEntity<?> iniciarSesion(@Valid @RequestBody LoginRequest request) {
        // Buscamos a la persona por su correo
        Optional<Persona> personaOpt = personaRepository.findByEmail(request.getEmail());

        if (personaOpt.isPresent()) {
            Persona persona = personaOpt.get();
            // Buscamos si esa persona es un cliente registrado
            Optional<Cliente> clienteOpt = clienteRepository.findById(persona.getIdPersona());

            if (clienteOpt.isPresent()) {
                Cliente cliente = clienteOpt.get();
                // Validamos la contraseña con BCrypt
                if (passwordEncoder.matches(request.getPassword(), cliente.getPassword())) {
                    String token = jwtService.generarToken(persona.getEmail(), "CLIENTE", persona.getIdPersona(), "CLIENTE");
                    LoginResponse response = new LoginResponse(persona.getIdPersona(), persona.getNombre(), persona.getEmail(), token);
                    return ResponseEntity.ok(response);
                }
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Correo o contraseña incorrectos"));
    }

    // --- CLASES AUXILIARES (DTOs) PARA RECIBIR Y ENVIAR JSON ---

    public static class RegistroRequest {
        // Se detectó en la auditoría de seguridad que este endpoint público aceptaba
        // HTML/JS arbitrario como nombre (p. ej. "<img src=x onerror=...>"). Se restringe
        // a caracteres propios de un nombre de persona.
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
        @Pattern(regexp = "^[\\p{L} .'-]+$", message = "El nombre solo puede contener letras, espacios, puntos, apóstrofes y guiones")
        private String nombre;
        @NotBlank(message = "El documento es obligatorio")
        @Size(max = 20, message = "El documento no puede superar los 20 caracteres")
        private String documento;
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        @Size(max = 100, message = "El correo no puede superar los 100 caracteres")
        private String email;
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
        private String password;

        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
        public String getDocumento() { return documento; }
        public void setDocumento(String documento) { this.documento = documento; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginRequest {
        @NotBlank(message = "El correo es obligatorio")
        private String email;
        @NotBlank(message = "La contraseña es obligatoria")
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginResponse {
        private Integer idPersona;
        private String nombre;
        private String email;
        private String token;

        public LoginResponse(Integer idPersona, String nombre, String email, String token) {
            this.idPersona = idPersona;
            this.nombre = nombre;
            this.email = email;
            this.token = token;
        }

        public Integer getIdPersona() { return idPersona; }
        public String getNombre() { return nombre; }
        public String getEmail() { return email; }
        public String getToken() { return token; }
    }
}
