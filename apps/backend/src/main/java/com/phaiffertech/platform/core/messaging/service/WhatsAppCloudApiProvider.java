package com.phaiffertech.platform.core.messaging.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phaiffertech.platform.core.messaging.domain.MessageChannel;
import com.phaiffertech.platform.core.messaging.dto.OutboundMessageRequest;
import com.phaiffertech.platform.core.messaging.dto.ProviderSendResult;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class WhatsAppCloudApiProvider implements WhatsAppProvider {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public WhatsAppCloudApiProvider(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public ProviderSendResult sendText(MessageChannel channel, String accessToken, OutboundMessageRequest request) {
        if (!channel.isEnabled()) {
            return new ProviderSendResult(false, null, null, null, "WhatsApp channel is disabled.");
        }
        if (!hasText(channel.getPhoneNumberId()) || !hasText(accessToken)) {
            return new ProviderSendResult(false, null, null, null, "WhatsApp credentials are not configured.");
        }

        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "messaging_product", "whatsapp",
                    "recipient_type", "individual",
                    "to", request.recipientPhone(),
                    "type", "text",
                    "text", Map.of("preview_url", false, "body", request.body())
            ));
            String version = hasText(channel.getProviderApiVersion()) ? channel.getProviderApiVersion() : "v25.0";
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://graph.facebook.com/" + version + "/" + channel.getPhoneNumberId() + "/messages"))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            String providerMessageId = extractProviderMessageId(response.body());
            boolean accepted = response.statusCode() >= 200 && response.statusCode() < 300 && providerMessageId != null;
            return new ProviderSendResult(
                    accepted,
                    providerMessageId,
                    payload,
                    response.body(),
                    accepted ? null : "WhatsApp Cloud API rejected the dispatch with HTTP " + response.statusCode() + "."
            );
        } catch (IOException ex) {
            return new ProviderSendResult(false, null, null, ex.getMessage(), "WhatsApp Cloud API request failed.");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return new ProviderSendResult(false, null, null, ex.getMessage(), "WhatsApp Cloud API request was interrupted.");
        }
    }

    private String extractProviderMessageId(String responseBody) throws IOException {
        if (!hasText(responseBody)) {
            return null;
        }
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode messages = root.path("messages");
        if (messages.isArray() && !messages.isEmpty()) {
            return messages.get(0).path("id").asText(null);
        }
        return null;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
