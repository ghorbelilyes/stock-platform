package com.inventory.orchestrator.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "category_settings")
public class CategorySettings {

    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "min_qty")
    private Integer minQty;

    @Column(name = "max_qty")
    private Integer maxQty;

    @Column(name = "min_confidence")
    private Integer minConfidence;

    @Column(name = "auto_approve")
    private Boolean autoApprove;

    public CategorySettings() {
    }

    public CategorySettings(Category category) {
        this.category = category;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Integer getMinQty() {
        return minQty;
    }

    public void setMinQty(Integer minQty) {
        this.minQty = minQty;
    }

    public Integer getMaxQty() {
        return maxQty;
    }

    public void setMaxQty(Integer maxQty) {
        this.maxQty = maxQty;
    }

    public Integer getMinConfidence() {
        return minConfidence;
    }

    public void setMinConfidence(Integer minConfidence) {
        this.minConfidence = minConfidence;
    }

    public Boolean getAutoApprove() {
        return autoApprove;
    }

    public void setAutoApprove(Boolean autoApprove) {
        this.autoApprove = autoApprove;
    }
}
