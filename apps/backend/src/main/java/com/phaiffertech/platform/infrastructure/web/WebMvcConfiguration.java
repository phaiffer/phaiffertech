package com.phaiffertech.platform.infrastructure.web;

import com.phaiffertech.platform.shared.security.PermissionAuthorizationInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer {

    private final PermissionAuthorizationInterceptor permissionAuthorizationInterceptor;

    public WebMvcConfiguration(PermissionAuthorizationInterceptor permissionAuthorizationInterceptor) {
        this.permissionAuthorizationInterceptor = permissionAuthorizationInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(permissionAuthorizationInterceptor)
                .addPathPatterns("/api/**");
    }
}
