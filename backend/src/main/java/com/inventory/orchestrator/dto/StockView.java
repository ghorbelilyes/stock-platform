package com.inventory.orchestrator.dto;

public class StockView {
    private Long idStore;
    private Long idProduct;
    private Integer quantity;
    private StoreInfo store;
    private ProductInfo product;

    public StockView(
            Long idStore,
            Long idProduct,
            Integer quantity,
            Long storeId,
            String storeSerialNumber,
            String storeName,
            String storeCity,
            String storeType,
            Integer storeLeadTimeDays,
            Long productId,
            String productCodeBarre,
            String productName,
            String productDescription
    ) {
        this.idStore = idStore;
        this.idProduct = idProduct;
        this.quantity = quantity;
        this.store = new StoreInfo(storeId, storeSerialNumber, storeName, storeCity, storeType, storeLeadTimeDays);
        this.product = new ProductInfo(productId, productCodeBarre, productName, productDescription);
    }

    public Long getIdStore() {
        return idStore;
    }

    public Long getIdProduct() {
        return idProduct;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public StoreInfo getStore() {
        return store;
    }

    public ProductInfo getProduct() {
        return product;
    }

    public static class StoreInfo {
        private Long id;
        private String serialNumber;
        private String name;
        private String city;
        private String type;
        private Integer leadTimeDays;

        public StoreInfo(Long id, String serialNumber, String name, String city, String type, Integer leadTimeDays) {
            this.id = id;
            this.serialNumber = serialNumber;
            this.name = name;
            this.city = city;
            this.type = type;
            this.leadTimeDays = leadTimeDays;
        }

        public Long getId() {
            return id;
        }

        public String getSerialNumber() {
            return serialNumber;
        }

        public String getName() {
            return name;
        }

        public String getCity() {
            return city;
        }

        public String getType() {
            return type;
        }

        public Integer getLeadTimeDays() {
            return leadTimeDays;
        }
    }

    public static class ProductInfo {
        private Long id;
        private String codeBarre;
        private String name;
        private String description;

        public ProductInfo(Long id, String codeBarre, String name, String description) {
            this.id = id;
            this.codeBarre = codeBarre;
            this.name = name;
            this.description = description;
        }

        public Long getId() {
            return id;
        }

        public String getCodeBarre() {
            return codeBarre;
        }

        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }
    }
}
