package com.phaiffertech.platform.core.notification.service;

import com.phaiffertech.platform.core.notification.dto.MailMessage;

public interface MailDeliveryService {

    void send(MailMessage message);
}
