package com.inventory.orchestrator.dto;

import java.util.List;

public class ParseHeadersResponse {
    private List<String> headers;
    private Integer rowCount;
    
    public ParseHeadersResponse() {
    }
    
    public ParseHeadersResponse(List<String> headers, Integer rowCount) {
        this.headers = headers;
        this.rowCount = rowCount;
    }
    
    public List<String> getHeaders() {
        return headers;
    }
    
    public void setHeaders(List<String> headers) {
        this.headers = headers;
    }
    
    public Integer getRowCount() {
        return rowCount;
    }
    
    public void setRowCount(Integer rowCount) {
        this.rowCount = rowCount;
    }
}
