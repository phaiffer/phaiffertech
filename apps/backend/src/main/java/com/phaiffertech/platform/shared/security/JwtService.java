package com.phaiffertech.platform.shared.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    public String generateAccessToken(AuthenticatedUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(jwtProperties.getAccessMinutes(), ChronoUnit.MINUTES);
        return generateAccessToken(user, expiresAt);
    }

    public String generateAccessToken(AuthenticatedUser user, Instant expiresAt) {
        Instant now = Instant.now();
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("tenantId", user.tenantId().toString());
        claims.put("role", user.role());
        claims.put("roles", user.roles());
        claims.put("email", user.email());
        claims.put("permissions", user.permissions());

        if (user.impersonation() != null) {
            claims.put("impersonationSessionId", user.impersonation().sessionId().toString());
            claims.put("impersonationSourceTenantId", user.impersonation().sourceTenantId().toString());
            claims.put("impersonationSourceUserId", user.impersonation().sourceUserId().toString());
            claims.put("impersonationStartedAt", user.impersonation().startedAt().toString());
            claims.put("impersonationExpiresAt", user.impersonation().expiresAt().toString());
        }

        return Jwts.builder()
                .issuer(jwtProperties.getIssuer())
                .subject(user.userId().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .claims(claims)
                .signWith(signingKey())
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token) {
        Claims claims = parseClaims(token);
        return claims.getExpiration().toInstant().isAfter(Instant.now());
    }

    public AuthenticatedUser toAuthenticatedUser(String token) {
        Claims claims = parseClaims(token);
        Set<String> roles = extractStringSet(claims, "roles");
        if (roles.isEmpty()) {
            roles = Set.of(claims.get("role", String.class));
        }
        Set<String> permissions = extractPermissions(claims);
        return new AuthenticatedUser(
                UUID.fromString(claims.getSubject()),
                UUID.fromString(claims.get("tenantId", String.class)),
                claims.get("email", String.class),
                claims.get("role", String.class),
                roles,
                permissions,
                extractImpersonation(claims)
        );
    }

    public Instant getRefreshExpiration() {
        return Instant.now().plus(jwtProperties.getRefreshDays(), ChronoUnit.DAYS);
    }

    private SecretKey signingKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private Set<String> extractPermissions(Claims claims) {
        return extractStringSet(claims, "permissions");
    }

    private Set<String> extractStringSet(Claims claims, String claimKey) {
        Object claim = claims.get(claimKey);
        if (!(claim instanceof Collection<?> values)) {
            return Set.of();
        }

        Set<String> resolved = new HashSet<>();
        for (Object value : values) {
            if (value instanceof String text && !text.isBlank()) {
                resolved.add(text);
            }
        }

        return Set.copyOf(resolved);
    }

    private SupportImpersonationDetails extractImpersonation(Claims claims) {
        String sessionId = claims.get("impersonationSessionId", String.class);
        if (sessionId == null || sessionId.isBlank()) {
            return null;
        }

        return new SupportImpersonationDetails(
                UUID.fromString(sessionId),
                UUID.fromString(claims.get("impersonationSourceTenantId", String.class)),
                UUID.fromString(claims.get("impersonationSourceUserId", String.class)),
                Instant.parse(claims.get("impersonationStartedAt", String.class)),
                Instant.parse(claims.get("impersonationExpiresAt", String.class))
        );
    }
}
