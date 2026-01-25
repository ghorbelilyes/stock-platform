package com.inventory.orchestrator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableJpaRepositories
@EnableTransactionManagement
public class InventoryOrchestratorApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventoryOrchestratorApplication.class, args);
    }
}
