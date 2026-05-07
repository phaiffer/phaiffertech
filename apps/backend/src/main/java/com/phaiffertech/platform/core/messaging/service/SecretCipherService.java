package com.phaiffertech.platform.core.messaging.service;

import com.phaiffertech.platform.shared.security.JwtProperties;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class SecretCipherService {

    private static final String PREFIX = "v1";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;

    private final JwtProperties jwtProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    public SecretCipherService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    public String encrypt(String value) {
        if (!hasText(value)) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_BYTES];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(value.trim().getBytes(StandardCharsets.UTF_8));
            return PREFIX + ":" + Base64.getEncoder().encodeToString(iv) + ":"
                    + Base64.getEncoder().encodeToString(ciphertext);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Could not protect message channel secret.", ex);
        }
    }

    public String decrypt(String protectedValue) {
        if (!hasText(protectedValue)) {
            return null;
        }
        String[] parts = protectedValue.split(":", 3);
        if (parts.length != 3 || !PREFIX.equals(parts[0])) {
            throw new IllegalStateException("Unsupported protected secret format.");
        }
        try {
            byte[] iv = Base64.getDecoder().decode(parts[1]);
            byte[] ciphertext = Base64.getDecoder().decode(parts[2]);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(TAG_BITS, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Could not read message channel secret.", ex);
        }
    }

    private SecretKeySpec key() throws GeneralSecurityException {
        byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(digest, "AES");
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
