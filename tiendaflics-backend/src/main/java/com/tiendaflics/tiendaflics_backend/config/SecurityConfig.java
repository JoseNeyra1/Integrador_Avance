package com.tiendaflics.tiendaflics_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;

import java.util.Arrays;

@Configuration
public class SecurityConfig {

    // Lista de orígenes permitidos, configurable por variable de entorno CORS_ALLOWED_ORIGINS
    // (separados por coma). En desarrollo por defecto permite Live Server.
    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. CORS restringido a los orígenes configurados (no "*")
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
                    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(Arrays.asList("*"));
                    return config;
                }))
                // 2. Apagamos CSRF porque es una API sin estado (stateless) consumida por el frontend
                .csrf(csrf -> csrf.disable())
                // 3. NOTA IMPORTANTE: por ahora todas las rutas quedan abiertas (sin login obligatorio
                // a nivel de Spring Security) porque el proyecto usa un login "manual" vía AuthController
                // y ClienteController. Antes de manejar datos reales de clientes/ventas en producción,
                // lo recomendable es migrar a autenticación con JWT y proteger las rutas según el rol.
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                );

        return http.build();
    }
}