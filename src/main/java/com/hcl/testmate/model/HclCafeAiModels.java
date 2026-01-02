package com.hcl.testmate.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Models for HCL Cafe AI API requests and responses
 */
public class HclCafeAiModels {
    
    public static class ChatRequest {
        private String model;
        private List<Message> messages;
        private Integer maxTokens;
        private Double temperature;

        public ChatRequest() {}
        public ChatRequest(String model, List<Message> messages, Integer maxTokens, Double temperature) {
            this.model = model;
            this.messages = messages;
            this.maxTokens = maxTokens;
            this.temperature = temperature;
        }
        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
        public List<Message> getMessages() { return messages; }
        public void setMessages(List<Message> messages) { this.messages = messages; }
        public Integer getMaxTokens() { return maxTokens; }
        public void setMaxTokens(Integer maxTokens) { this.maxTokens = maxTokens; }
        public Double getTemperature() { return temperature; }
        public void setTemperature(Double temperature) { this.temperature = temperature; }
        public static Builder builder() { return new Builder(); }
        public static class Builder {
            private String model;
            private List<Message> messages;
            private Integer maxTokens;
            private Double temperature;
            public Builder model(String model) { this.model = model; return this; }
            public Builder messages(List<Message> messages) { this.messages = messages; return this; }
            public Builder maxTokens(Integer maxTokens) { this.maxTokens = maxTokens; return this; }
            public Builder temperature(Double temperature) { this.temperature = temperature; return this; }
            public ChatRequest build() { return new ChatRequest(model, messages, maxTokens, temperature); }
        }
    }
    
    public static class Message {
        private String role;
        private String content;

        public Message() {}
        public Message(String role, String content) {
            this.role = role;
            this.content = content;
        }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public static Builder builder() { return new Builder(); }
        public static class Builder {
            private String role;
            private String content;
            public Builder role(String role) { this.role = role; return this; }
            public Builder content(String content) { this.content = content; return this; }
            public Message build() { return new Message(role, content); }
        }
    }
    
    public static class ChatResponse {
        private String id;
        private String object;
        private Long created;
        private String model;
        private List<Choice> choices;
        private Usage usage;

        public ChatResponse() {}
        public ChatResponse(String id, String object, Long created, String model, List<Choice> choices, Usage usage) {
            this.id = id;
            this.object = object;
            this.created = created;
            this.model = model;
            this.choices = choices;
            this.usage = usage;
        }
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getObject() { return object; }
        public void setObject(String object) { this.object = object; }
        public Long getCreated() { return created; }
        public void setCreated(Long created) { this.created = created; }
        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
        public List<Choice> getChoices() { return choices; }
        public void setChoices(List<Choice> choices) { this.choices = choices; }
        public Usage getUsage() { return usage; }
        public void setUsage(Usage usage) { this.usage = usage; }
    }
    
    public static class Choice {
        private Integer index;
        private Message message;
        @JsonProperty("finish_reason")
        private String finishReason;

        public Choice() {}
        public Choice(Integer index, Message message, String finishReason) {
            this.index = index;
            this.message = message;
            this.finishReason = finishReason;
        }
        public Integer getIndex() { return index; }
        public void setIndex(Integer index) { this.index = index; }
        public Message getMessage() { return message; }
        public void setMessage(Message message) { this.message = message; }
        public String getFinishReason() { return finishReason; }
        public void setFinishReason(String finishReason) { this.finishReason = finishReason; }
    }
    
    public static class Usage {
        @JsonProperty("prompt_tokens")
        private Integer promptTokens;
        @JsonProperty("completion_tokens")
        private Integer completionTokens;
        @JsonProperty("total_tokens")
        private Integer totalTokens;

        public Usage() {}
        public Usage(Integer promptTokens, Integer completionTokens, Integer totalTokens) {
            this.promptTokens = promptTokens;
            this.completionTokens = completionTokens;
            this.totalTokens = totalTokens;
        }
        public Integer getPromptTokens() { return promptTokens; }
        public void setPromptTokens(Integer promptTokens) { this.promptTokens = promptTokens; }
        public Integer getCompletionTokens() { return completionTokens; }
        public void setCompletionTokens(Integer completionTokens) { this.completionTokens = completionTokens; }
        public Integer getTotalTokens() { return totalTokens; }
        public void setTotalTokens(Integer totalTokens) { this.totalTokens = totalTokens; }
    }
}
