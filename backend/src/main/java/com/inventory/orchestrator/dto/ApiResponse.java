package com.inventory.orchestrator.dto;

import java.util.List;

public class ApiResponse<T> {
    private Boolean success;
    private T data;
    private String message;
    private ErrorDetails error;
    
    public ApiResponse() {
    }
    
    public ApiResponse(Boolean success, T data, String message, ErrorDetails error) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.error = error;
    }
    
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, message, null);
    }
    
    public static <T> ApiResponse<T> error(String code, String message, List<String> details) {
        ErrorDetails errorDetails = new ErrorDetails(code, message, details);
        return new ApiResponse<>(false, null, null, errorDetails);
    }
    
    public Boolean getSuccess() {
        return success;
    }
    
    public void setSuccess(Boolean success) {
        this.success = success;
    }
    
    public T getData() {
        return data;
    }
    
    public void setData(T data) {
        this.data = data;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public ErrorDetails getError() {
        return error;
    }
    
    public void setError(ErrorDetails error) {
        this.error = error;
    }
    
    public static class ErrorDetails {
        private String code;
        private String message;
        private List<String> details;
        
        public ErrorDetails() {
        }
        
        public ErrorDetails(String code, String message, List<String> details) {
            this.code = code;
            this.message = message;
            this.details = details;
        }
        
        public String getCode() {
            return code;
        }
        
        public void setCode(String code) {
            this.code = code;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
        
        public List<String> getDetails() {
            return details;
        }
        
        public void setDetails(List<String> details) {
            this.details = details;
        }
    }
}
