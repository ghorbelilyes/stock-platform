package com.inventory.orchestrator.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockId implements Serializable {
    
    private Long idStore;
    private Long idProduct;
    
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
