package com.inventory.orchestrator.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI inventoryOrchestratorOpenApi() {
        return new OpenAPI()
            .info(new Info()
                .title("Inventory Orchestrator API")
                .description("REST API for inventory, sales, stock, stores, transfers, and files.")
                .version("1.0.0")
                .contact(new Contact()
                    .name("Inventory Orchestrator")
                    .url("https://example.com"))
                .license(new License().name("Proprietary")));
    }
}
