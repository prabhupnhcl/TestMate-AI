package com.hcl.testmate.model;


import java.util.List;

/**
 * Response model for multiple document uploads
 * Contains individual test case responses for each document
 */
public class MultiDocumentResponse {
    private List<DocumentTestCaseResult> documentResults;
    private int totalDocuments;
    private int totalTestCases;
    private boolean success;
    private String message;

    public MultiDocumentResponse() {}

    public MultiDocumentResponse(List<DocumentTestCaseResult> documentResults, int totalDocuments, int totalTestCases, boolean success, String message) {
        this.documentResults = documentResults;
        this.totalDocuments = totalDocuments;
        this.totalTestCases = totalTestCases;
        this.success = success;
        this.message = message;
    }

    public List<DocumentTestCaseResult> getDocumentResults() {
        return documentResults;
    }

    public void setDocumentResults(List<DocumentTestCaseResult> documentResults) {
        this.documentResults = documentResults;
    }

    public int getTotalDocuments() {
        return totalDocuments;
    }

    public void setTotalDocuments(int totalDocuments) {
        this.totalDocuments = totalDocuments;
    }

    public int getTotalTestCases() {
        return totalTestCases;
    }

    public void setTotalTestCases(int totalTestCases) {
        this.totalTestCases = totalTestCases;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private List<DocumentTestCaseResult> documentResults;
        private int totalDocuments;
        private int totalTestCases;
        private boolean success;
        private String message;

        public Builder documentResults(List<DocumentTestCaseResult> documentResults) {
            this.documentResults = documentResults;
            return this;
        }
        public Builder totalDocuments(int totalDocuments) {
            this.totalDocuments = totalDocuments;
            return this;
        }
        public Builder totalTestCases(int totalTestCases) {
            this.totalTestCases = totalTestCases;
            return this;
        }
        public Builder success(boolean success) {
            this.success = success;
            return this;
        }
        public Builder message(String message) {
            this.message = message;
            return this;
        }
        public MultiDocumentResponse build() {
            return new MultiDocumentResponse(documentResults, totalDocuments, totalTestCases, success, message);
        }
    }

    /**
     * Test case result for a single document
     */
    public static class DocumentTestCaseResult {
        private String fileName;
        private TestCaseResponse testCaseResponse;
        private boolean success;
        private String errorMessage;

        public DocumentTestCaseResult() {}

        public DocumentTestCaseResult(String fileName, TestCaseResponse testCaseResponse, boolean success, String errorMessage) {
            this.fileName = fileName;
            this.testCaseResponse = testCaseResponse;
            this.success = success;
            this.errorMessage = errorMessage;
        }

        public String getFileName() {
            return fileName;
        }

        public void setFileName(String fileName) {
            this.fileName = fileName;
        }

        public TestCaseResponse getTestCaseResponse() {
            return testCaseResponse;
        }

        public void setTestCaseResponse(TestCaseResponse testCaseResponse) {
            this.testCaseResponse = testCaseResponse;
        }

        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String fileName;
            private TestCaseResponse testCaseResponse;
            private boolean success;
            private String errorMessage;

            public Builder fileName(String fileName) {
                this.fileName = fileName;
                return this;
            }
            public Builder testCaseResponse(TestCaseResponse testCaseResponse) {
                this.testCaseResponse = testCaseResponse;
                return this;
            }
            public Builder success(boolean success) {
                this.success = success;
                return this;
            }
            public Builder errorMessage(String errorMessage) {
                this.errorMessage = errorMessage;
                return this;
            }
            public DocumentTestCaseResult build() {
                return new DocumentTestCaseResult(fileName, testCaseResponse, success, errorMessage);
            }
        }
    }
}
