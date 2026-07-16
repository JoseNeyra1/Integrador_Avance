package com.tiendaflics.tiendaflics_backend.config;

import com.tiendaflics.tiendaflics_backend.security.JsonAuthErrorHandlers;
import com.tiendaflics.tiendaflics_backend.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                            JwtAuthFilter jwtAuthFilter,
                                            JsonAuthErrorHandlers jsonAuthErrorHandlers) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jsonAuthErrorHandlers)
                        .accessDeniedHandler(jsonAuthErrorHandlers)
                )
                .authorizeHttpRequests(auth -> auth
                        // Preflight CORS: el navegador nunca manda credenciales en un OPTIONS,
                        // así que debe quedar siempre libre o el preflight falla con 401/403.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Endpoints públicos
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/clientes/registro", "/api/clientes/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/productos/**", "/api/categorias").permitAll()
                        // Gestión de catálogo: solo ADMIN
                        .requestMatchers(HttpMethod.POST, "/api/productos", "/api/categorias").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/productos/**", "/api/categorias/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/productos/**", "/api/categorias/**").hasRole("ADMIN")
                        // Panel de pedidos (admin): listar todos y cambiar estado
                        .requestMatchers(HttpMethod.GET, "/api/pedidos").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/pedidos/*/estado").hasRole("ADMIN")
                        // Caja (POS): ADMIN o VENDEDOR
                        .requestMatchers("/api/ventas/**").hasAnyRole("ADMIN", "VENDEDOR")
                        // Pedidos de cliente (creación, listado propio, timeline): cualquier autenticado,
                        // el ownership fino (cliente solo ve lo suyo) se valida dentro del controller
                        .requestMatchers("/api/pedidos/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(Arrays.asList(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        return request -> config;
    }
}
