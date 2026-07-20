package com.tiendaflics.tiendaflics_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Date;

@Component
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final int MIN_SECRET_LENGTH = 32;

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        this.key = resolveKey(secret);
        this.expirationMs = expirationMs;
    }

    /**
     * Nunca debe existir un secreto por defecto "conocido" (ni en application.yaml ni aquí):
     * cualquier valor fijo en el código fuente permite forjar tokens válidos sin credenciales.
     * Si no se configuró JWT_SECRET (o es demasiado corto), se genera una clave aleatoria
     * solo para este arranque; las sesiones emitidas antes de reiniciar dejan de ser válidas.
     */
    private static SecretKey resolveKey(String secret) {
        if (secret == null || secret.isBlank() || secret.length() < MIN_SECRET_LENGTH) {
            log.warn("JWT_SECRET no esta configurado (o tiene menos de {} caracteres). Se genero una clave "
                    + "aleatoria solo para este arranque: los tokens existentes quedan invalidos y los nuevos "
                    + "dejaran de servir si el proceso se reinicia. Define JWT_SECRET como variable de entorno "
                    + "(minimo {} caracteres) antes de desplegar en un entorno real.", MIN_SECRET_LENGTH, MIN_SECRET_LENGTH);
            byte[] randomKey = new byte[64];
            new SecureRandom().nextBytes(randomKey);
            return Keys.hmacShaKeyFor(randomKey);
        }
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generarToken(String subject, String tipo, Integer idPersona, String rol) {
        Date ahora = new Date();
        Date expiracion = new Date(ahora.getTime() + expirationMs);

        return Jwts.builder()
                .subject(subject)
                .claim("tipo", tipo)
                .claim("idPersona", idPersona)
                .claim("rol", rol)
                .issuedAt(ahora)
                .expiration(expiracion)
                .signWith(key)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
