package com.inventory.orchestrator.dto;

public class StockView {
    private Long idStore;
    private Long idProduct;
    private Integer quantity;
    /** Suggested quantity for transfer based on transfer suggestions */
    private Integer suggestionQuantity;
    /** Sum of quantities from transfers (status in_transit) to this store for this product - Incoming (en route) */
    private Integer incomingQty;
    /** Sum of quantities from transfers (status in_transit) from this store for this product - Out to transit (en route) */
    private Integer outToTransit;
    /** Sum of quantities from transfers (status approved) from this store for this product - Quantity for transfer (approved but not in_transit) */
    private Integer quantityForTransfer;
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
        this.suggestionQuantity = null;
        this.store = new StoreInfo(storeId, storeSerialNumber, storeName, storeCity, storeType, storeLeadTimeDays);
        this.product = new ProductInfo(productId, productCodeBarre, productName, productDescription);
        this.incomingQty = 0;
        this.outToTransit = 0;
        this.quantityForTransfer = 0;
    }
    
    public StockView(
            Long idStore,
            Long idProduct,
            Integer quantity,
            Integer suggestionQuantity,
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
        this.suggestionQuantity = suggestionQuantity;
        this.store = new StoreInfo(storeId, storeSerialNumber, storeName, storeCity, storeType, storeLeadTimeDays);
        this.product = new ProductInfo(productId, productCodeBarre, productName, productDescription);
        this.incomingQty = 0;
        this.outToTransit = 0;
        this.quantityForTransfer = 0;
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
    
    public Integer getSuggestionQuantity() {
        return suggestionQuantity;
    }
    
    public void setSuggestionQuantity(Integer suggestionQuantity) {
        this.suggestionQuantity = suggestionQuantity;
    }

    public Integer getIncomingQty() {
        return incomingQty != null ? incomingQty : 0;
    }

    public void setIncomingQty(Integer incomingQty) {
        this.incomingQty = incomingQty;
    }

    public Integer getOutToTransit() {
        return outToTransit != null ? outToTransit : 0;
    }

    public void setOutToTransit(Integer outToTransit) {
        this.outToTransit = outToTransit;
    }

    public Integer getQuantityForTransfer() {
        return quantityForTransfer != null ? quantityForTransfer : 0;
    }

    public void setQuantityForTransfer(Integer quantityForTransfer) {
        this.quantityForTransfer = quantityForTransfer;
    }
    
    // Legacy method for backward compatibility
    @Deprecated
    public Integer getOutgoingQty() {
        return getOutToTransit() + getQuantityForTransfer();
    }

    @Deprecated
    public void setOutgoingQty(Integer outgoingQty) {
        // For backward compatibility, split between outToTransit and quantityForTransfer
        // Default to outToTransit if we can't determine
        this.outToTransit = outgoingQty != null ? outgoingQty : 0;
        this.quantityForTransfer = 0;
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
