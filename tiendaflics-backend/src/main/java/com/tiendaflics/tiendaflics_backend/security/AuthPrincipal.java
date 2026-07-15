package com.tiendaflics.tiendaflics_backend.security;

public record AuthPrincipal(Integer idPersona, String subject, String tipo, String rol) {
}
