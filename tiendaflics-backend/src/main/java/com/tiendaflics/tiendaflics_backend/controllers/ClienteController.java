package com.tiendaflics.tiendaflics_backend.controllers;

import com.tiendaflics.tiendaflics_backend.entities.Cliente;
import com.tiendaflics.tiendaflics_backend.entities.Persona;
import com.tiendaflics.tiendaflics_backend.repositories.ClienteRepository;
import com.tiendaflics.tiendaflics_backend.repositories.PersonaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*") // Permite la conexión desde tu frontend (Live Server)
public class ClienteController {

    @Autowired
    private PersonaRepository personaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    // 1. ENDPOINT DE REGISTRO
    @PostMapping("/registro")
    public ResponseEntity<?> registrarCliente(@RequestBody RegistroRequest request) {
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
            // Dependiendo de cómo mapeaste tu entidad Cliente, usas el ID o el objeto Persona
            nuevoCliente.setIdPersona(personaGuardada.getIdPersona());
            nuevoCliente.setPuntosLealtad(0);
            nuevoCliente.setPassword(request.getPassword()); // Guardamos la contraseña
            clienteRepository.save(nuevoCliente);

            // Paso C: Devolver los datos al frontend para que inicie sesión automáticamente
            LoginResponse response = new LoginResponse(personaGuardada.getIdPersona(), personaGuardada.getNombre(), personaGuardada.getEmail());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al registrar: Puede que el correo o DNI ya existan.");
        }
    }

    // 2. ENDPOINT DE INICIO DE SESIÓN
    @PostMapping("/login")
    public ResponseEntity<?> iniciarSesion(@RequestBody LoginRequest request) {
        // Buscamos a la persona por su correo
        Optional<Persona> personaOpt = personaRepository.findByEmail(request.getEmail());

        if (personaOpt.isPresent()) {
            Persona persona = personaOpt.get();
            // Buscamos si esa persona es un cliente registrado
            Optional<Cliente> clienteOpt = clienteRepository.findById(persona.getIdPersona());

            if (clienteOpt.isPresent()) {
                Cliente cliente = clienteOpt.get();
                // Validamos la contraseña
                if (cliente.getPassword().equals(request.getPassword())) {
                    LoginResponse response = new LoginResponse(persona.getIdPersona(), persona.getNombre(), persona.getEmail());
                    return ResponseEntity.ok(response);
                }
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Correo o contraseña incorrectos");
    }

    // --- CLASES AUXILIARES (DTOs) PARA RECIBIR Y ENVIAR JSON ---

    public static class RegistroRequest {
        private String nombre;
        private String documento;
        private String email;
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
        private String email;
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

        public LoginResponse(Integer idPersona, String nombre, String email) {
            this.idPersona = idPersona;
            this.nombre = nombre;
            this.email = email;
        }

        public Integer getIdPersona() { return idPersona; }
        public String getNombre() { return nombre; }
        public String getEmail() { return email; }
    }
}