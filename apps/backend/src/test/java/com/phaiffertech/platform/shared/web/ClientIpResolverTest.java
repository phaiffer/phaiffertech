package com.phaiffertech.platform.shared.web;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class ClientIpResolverTest {

    @Test
    void shouldPreferForwardedHeaderWhenPresent() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Forwarded", "for=203.0.113.20;proto=https;by=198.51.100.10");
        request.addHeader("X-Forwarded-For", "198.51.100.50");
        request.setRemoteAddr("10.0.0.3");

        assertThat(ClientIpResolver.resolve(request)).isEqualTo("203.0.113.20");
    }

    @Test
    void shouldNormalizeQuotedIpv6ForwardedHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Forwarded", "for=\"[2001:db8:cafe::17]\";proto=https");
        request.setRemoteAddr("10.0.0.3");

        assertThat(ClientIpResolver.resolve(request)).isEqualTo("2001:db8:cafe::17");
    }

    @Test
    void shouldPreferFirstForwardedIp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.0.3");
        request.setRemoteAddr("10.0.0.3");

        assertThat(ClientIpResolver.resolve(request)).isEqualTo("203.0.113.10");
    }

    @Test
    void shouldFallbackToRealIpHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Real-Ip", "198.51.100.8");
        request.setRemoteAddr("10.0.0.4");

        assertThat(ClientIpResolver.resolve(request)).isEqualTo("198.51.100.8");
    }

    @Test
    void shouldFallbackToRemoteAddress() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");

        assertThat(ClientIpResolver.resolve(request)).isEqualTo("127.0.0.1");
    }
}
