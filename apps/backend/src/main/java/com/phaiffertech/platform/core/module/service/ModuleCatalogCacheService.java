package com.phaiffertech.platform.core.module.service;

import com.phaiffertech.platform.core.module.dto.ModuleViewResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.function.Supplier;
import org.springframework.stereotype.Service;

@Service
public class ModuleCatalogCacheService {

    private static final Duration TTL = Duration.ofSeconds(60);

    private final ConcurrentMap<UUID, CachedModuleCatalog> cache = new ConcurrentHashMap<>();

    public List<ModuleViewResponse> getOrLoad(UUID tenantId, Supplier<List<ModuleViewResponse>> loader) {
        Instant now = Instant.now();
        CachedModuleCatalog cachedModuleCatalog = cache.get(tenantId);
        if (cachedModuleCatalog != null && cachedModuleCatalog.expiresAt().isAfter(now)) {
            return cachedModuleCatalog.modules();
        }

        List<ModuleViewResponse> loadedModules = List.copyOf(loader.get());
        cache.put(tenantId, new CachedModuleCatalog(loadedModules, now.plus(TTL)));
        return loadedModules;
    }

    public void evict(UUID tenantId) {
        if (tenantId != null) {
            cache.remove(tenantId);
        }
    }

    private record CachedModuleCatalog(List<ModuleViewResponse> modules, Instant expiresAt) {
    }
}
