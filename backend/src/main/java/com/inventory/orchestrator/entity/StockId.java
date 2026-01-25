package com.inventory.orchestrator.entity;

import java.io.Serializable;

public class StockId implements Serializable {
    
    private Long idStore;
    private Long idProduct;
    
    public StockId() {
    }
    
    public StockId(Long idStore, Long idProduct) {
        this.idStore = idStore;
        this.idProduct = idProduct;
    }
    
    public Long getIdStore() {
        return idStore;
    }
    
    public void setIdStore(Long idStore) {
        this.idStore = idStore;
    }
    
    public Long getIdProduct() {
        return idProduct;
    }
    
    public void setIdProduct(Long idProduct) {
        this.idProduct = idProduct;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        
        StockId stockId = (StockId) o;
        
        if (!idStore.equals(stockId.idStore)) return false;
        return idProduct.equals(stockId.idProduct);
    }
    
    @Override
    public int hashCode() {
        int result = idStore.hashCode();
        result = 31 * result + idProduct.hashCode();
        return result;
    }
}
