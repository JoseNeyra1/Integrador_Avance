package com.tiendaflics.tiendaflics_backend.controllers;

import com.tiendaflics.tiendaflics_backend.entities.UsuarioPersonal;
import com.tiendaflics.tiendaflics_backend.repositories.UsuarioPersonalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioPersonalRepository usuarioPersonalRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        if (usuarioPersonalRepository.findByIdUsuarioAndActivoTrue("test-admin").isEmpty()) {
            UsuarioPersonal usuario = new UsuarioPersonal();
            usuario.setNombre("Admin de prueba");
            usuario.setIdUsuario("test-admin");
            usuario.setRol(UsuarioPersonal.Rol.ADMIN);
            usuario.setPassword(passwordEncoder.encode("clave123"));
            usuario.setActivo(true);
            usuarioPersonalRepository.save(usuario);
        }
    }

    @Test
    void loginConCredencialesCorrectasDevuelveToken() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idUsuario\":\"test-admin\",\"password\":\"clave123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.rol").value("ADMIN"));
    }

    @Test
    void loginConCredencialesIncorrectasDevuelve401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idUsuario\":\"test-admin\",\"password\":\"incorrecta\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listarProductosEsPublico() throws Exception {
        mockMvc.perform(get("/api/productos"))
                .andExpect(status().isOk());
    }

    @Test
    void eliminarProductoSinTokenDevuelveNoAutenticado() throws Exception {
        mockMvc.perform(delete("/api/productos/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void preflightCorsSiempreEsPermitido() throws Exception {
        // El navegador nunca manda credenciales en un preflight OPTIONS; si esto no
        // devuelve 200, el frontend en otro dominio nunca puede llamar a la API.
        mockMvc.perform(options("/api/pedidos")
                        .header("Origin", "http://localhost:5500")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk());
    }
}
