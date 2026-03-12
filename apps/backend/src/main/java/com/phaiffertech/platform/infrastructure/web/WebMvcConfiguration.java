package com.phaiffertech.platform.infrastructure.web;

import com.phaiffertech.platform.shared.security.PermissionAuthorizationInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer {

    private final PermissionAuthorizationInterceptor permissionAuthorizationInterceptor;
    private final List<String> allowedOrigins;

    public WebMvcConfiguration(
            PermissionAuthorizationInterceptor permissionAuthorizationInterceptor,
            @Value("${app.cors.allowed-origins}") List<String> allowedOrigins) {
        this.permissionAuthorizationInterceptor = permissionAuthorizationInterceptor;
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(permissionAuthorizationInterceptor)
                .addPathPatterns("/api/**");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
