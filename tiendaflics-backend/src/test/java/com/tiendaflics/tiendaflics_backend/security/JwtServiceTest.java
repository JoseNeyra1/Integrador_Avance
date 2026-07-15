package com.tiendaflics.tiendaflics_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    private static final String SECRETO_PRUEBA = "clave-de-pruebas-suficientemente-larga-1234567890";

    private final JwtService jwtService = new JwtService(SECRETO_PRUEBA, 60_000L);

    @Test
    void debeGenerarYValidarUnTokenConLosClaimsCorrectos() {
        String token = jwtService.generarToken("admin", "STAFF", 1, "ADMIN");

        Claims claims = jwtService.parseClaims(token);

        assertThat(claims.getSubject()).isEqualTo("admin");
        assertThat(claims.get("tipo", String.class)).isEqualTo("STAFF");
        assertThat(claims.get("idPersona", Integer.class)).isEqualTo(1);
        assertThat(claims.get("rol", String.class)).isEqualTo("ADMIN");
    }

    @Test
    void debeRechazarUnTokenExpirado() {
        JwtService servicioExpirado = new JwtService(SECRETO_PRUEBA, -1000L);
        String token = servicioExpirado.generarToken("admin", "STAFF", 1, "ADMIN");

        assertThrows(ExpiredJwtException.class, () -> servicioExpirado.parseClaims(token));
    }
}
