package com.inventory.orchestrator.ai;

/**
 * Result of deterministic stock analysis for one (store, product).
 */
public class StockAnalysisResult {

    private Long storeId;
    private Long productId;
    private int quantity;
    private double avgDailySales;
    private int leadTimeDays;
    private double minQty;
    private double maxQty;
    private StockStatus status;
    private double neededQty;  // for LOW: how much to reach minQty
    private double excessQty;  // for EXCESS: how much above maxQty

    public StockAnalysisResult() {
    }

    public Long getStoreId() {
        return storeId;
    }

    public void setStoreId(Long storeId) {
        this.storeId = storeId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public double getAvgDailySales() {
        return avgDailySales;
    }

    public void setAvgDailySales(double avgDailySales) {
        this.avgDailySales = avgDailySales;
    }

    public int getLeadTimeDays() {
        return leadTimeDays;
    }

    public void setLeadTimeDays(int leadTimeDays) {
        this.leadTimeDays = leadTimeDays;
    }

    public double getMinQty() {
        return minQty;
    }

    public void setMinQty(double minQty) {
        this.minQty = minQty;
    }

    public double getMaxQty() {
        return maxQty;
    }

    public void setMaxQty(double maxQty) {
        this.maxQty = maxQty;
    }

    public StockStatus getStatus() {
        return status;
    }

    public void setStatus(StockStatus status) {
        this.status = status;
    }

    public double getNeededQty() {
        return neededQty;
    }

    public void setNeededQty(double neededQty) {
        this.neededQty = neededQty;
    }

    public double getExcessQty() {
        return excessQty;
    }

    public void setExcessQty(double excessQty) {
        this.excessQty = excessQty;
    }
}
