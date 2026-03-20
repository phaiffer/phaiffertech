package com.phaiffertech.platform.core.notification.service;

import com.phaiffertech.platform.core.notification.config.NotificationMailProperties;
import com.phaiffertech.platform.core.notification.dto.MailMessage;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class SmtpMailDeliveryService implements MailDeliveryService {

    private final JavaMailSender javaMailSender;
    private final NotificationMailProperties notificationMailProperties;

    public SmtpMailDeliveryService(
            JavaMailSender javaMailSender,
            NotificationMailProperties notificationMailProperties
    ) {
        this.javaMailSender = javaMailSender;
        this.notificationMailProperties = notificationMailProperties;
    }

    @Override
    public void send(MailMessage message) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, StandardCharsets.UTF_8.name());
            helper.setTo(message.to());
            helper.setSubject(message.subject());
            helper.setText(message.textBody(), false);
            helper.setFrom(resolveSenderAddress());
            javaMailSender.send(mimeMessage);
        } catch (MessagingException | UnsupportedEncodingException exception) {
            throw new IllegalStateException("Failed to send mail message.", exception);
        }
    }

    private InternetAddress resolveSenderAddress() throws MessagingException, UnsupportedEncodingException {
        String fromName = notificationMailProperties.getFromName();
        if (fromName == null || fromName.isBlank()) {
            return new InternetAddress(notificationMailProperties.getFromAddress());
        }
        return new InternetAddress(
                notificationMailProperties.getFromAddress(),
                fromName,
                StandardCharsets.UTF_8.name()
        );
    }
}
