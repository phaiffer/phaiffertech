package com.phaiffertech.platform.architecture;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ModuleArchitectureTest {

    private static final Path SOURCE_ROOT = Path.of("src/main/java/com/phaiffertech/platform");
    private static final Pattern VERTICAL_IMPORT_PATTERN = Pattern.compile(
            "^import\\s+com\\.phaiffertech\\.platform\\.modules\\.(crm|iot|pet)\\..*;$"
    );
    private static final Pattern IMPORTED_VERTICAL_PATTERN = Pattern.compile(
            "^import\\s+com\\.phaiffertech\\.platform\\.modules\\.(crm|iot|pet)\\..*;$"
    );

    @Test
    void coreAndSharedShouldNotImportVerticalModules() throws IOException {
        List<String> violations = new ArrayList<>();
        violations.addAll(findForbiddenImports(SOURCE_ROOT.resolve("core")));
        violations.addAll(findForbiddenImports(SOURCE_ROOT.resolve("shared")));

        assertTrue(violations.isEmpty(), () -> "Core/shared cannot import vertical modules:\n" + String.join("\n", violations));
    }

    @Test
    void verticalModulesShouldNotImportOtherVerticalModules() throws IOException {
        List<String> violations = new ArrayList<>();

        try (Stream<Path> files = Files.walk(SOURCE_ROOT.resolve("modules"))) {
            files.filter(path -> path.toString().endsWith(".java"))
                    .forEach(path -> collectCrossVerticalViolations(path, violations));
        }

        assertTrue(violations.isEmpty(), () -> "Cross-vertical imports are forbidden:\n" + String.join("\n", violations));
    }

    @Test
    void platformDashboardShouldDependOnContractsInsteadOfVerticalRepositories() throws IOException {
        Path file = SOURCE_ROOT.resolve("core/module/service/PlatformDashboardService.java");
        String source = Files.readString(file);

        assertTrue(source.contains("ModuleSummaryCapability"), "Platform dashboard must aggregate through capabilities.");
        assertFalse(source.contains("import com.phaiffertech.platform.modules."), "Platform dashboard cannot import vertical modules directly.");
        assertFalse(
                Pattern.compile("import\\s+com\\.phaiffertech\\.platform\\.modules\\.(crm|iot|pet)\\..*repository\\..*;")
                        .matcher(source)
                        .find(),
                "Platform dashboard cannot depend on vertical repositories directly."
        );
    }

    private List<String> findForbiddenImports(Path sourceDirectory) throws IOException {
        List<String> violations = new ArrayList<>();

        try (Stream<Path> files = Files.walk(sourceDirectory)) {
            files.filter(path -> path.toString().endsWith(".java"))
                    .forEach(path -> readImportLines(path).stream()
                            .filter(line -> VERTICAL_IMPORT_PATTERN.matcher(line).matches())
                            .forEach(line -> violations.add(relative(path) + " -> " + line.trim())));
        }

        return violations;
    }

    private void collectCrossVerticalViolations(Path path, List<String> violations) {
        String currentVertical = currentVertical(path);
        if (currentVertical == null) {
            return;
        }

        for (String line : readImportLines(path)) {
            Matcher matcher = IMPORTED_VERTICAL_PATTERN.matcher(line);
            if (!matcher.matches()) {
                continue;
            }

            String importedVertical = matcher.group(1).toUpperCase(Locale.ROOT);
            if (!currentVertical.equals(importedVertical)) {
                violations.add(relative(path) + " -> " + line.trim());
            }
        }
    }

    private List<String> readImportLines(Path path) {
        try (Stream<String> lines = Files.lines(path)) {
            return lines.filter(line -> line.startsWith("import ")).toList();
        } catch (IOException exception) {
            throw new RuntimeException("Failed to inspect " + path, exception);
        }
    }

    private String currentVertical(Path path) {
        String normalized = path.toString().replace('\\', '/');
        if (normalized.contains("/modules/crm/")) {
            return "CRM";
        }
        if (normalized.contains("/modules/iot/")) {
            return "IOT";
        }
        if (normalized.contains("/modules/pet/")) {
            return "PET";
        }
        return null;
    }

    private String relative(Path path) {
        return SOURCE_ROOT.relativize(path).toString().replace('\\', '/');
    }
}
