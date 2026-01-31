package com.inventory.orchestrator.dto.ai;

import com.inventory.orchestrator.dto.StockView;

import java.util.ArrayList;
import java.util.List;

/**
 * Mandatory AI chat response format: summary, analysis, proposals.
 * Optional stockRows for quantity queries (less than / more than / between).
 */
public class AiChatResponse {

    private String summary;
    private String analysis;
    private List<TransferProposalView> proposals = new ArrayList<>();
    private List<StockView> stockRows = new ArrayList<>();

    public AiChatResponse() {
    }

    public AiChatResponse(String summary, String analysis, List<TransferProposalView> proposals) {
        this.summary = summary;
        this.analysis = analysis;
        this.proposals = proposals != null ? proposals : new ArrayList<>();
    }

    public AiChatResponse(String summary, String analysis, List<TransferProposalView> proposals, List<StockView> stockRows) {
        this.summary = summary;
        this.analysis = analysis;
        this.proposals = proposals != null ? proposals : new ArrayList<>();
        this.stockRows = stockRows != null ? stockRows : new ArrayList<>();
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getAnalysis() {
        return analysis;
    }

    public void setAnalysis(String analysis) {
        this.analysis = analysis;
    }

    public List<TransferProposalView> getProposals() {
        return proposals;
    }

    public void setProposals(List<TransferProposalView> proposals) {
        this.proposals = proposals != null ? proposals : new ArrayList<>();
    }

    public List<StockView> getStockRows() {
        return stockRows;
    }

    public void setStockRows(List<StockView> stockRows) {
        this.stockRows = stockRows != null ? stockRows : new ArrayList<>();
    }
}
