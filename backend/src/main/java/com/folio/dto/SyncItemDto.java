package com.folio.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import java.util.UUID;

public class SyncItemDto {
    @NotBlank
    private String id;

    @NotBlank
    private String action;

    private String entityType;
    private UUID entityId;
    private Map<String, Object> payload;
    private String status;
    private String timestamp;

    public SyncItemDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getActionId() { return id; }
    public void setActionId(String actionId) { this.id = actionId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getActionType() { return action; }
    public void setActionType(String actionType) { this.action = actionType; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public UUID getEntityId() { return entityId; }
    public void setEntityId(UUID entityId) { this.entityId = entityId; }

    public Map<String, Object> getPayload() { return payload; }
    public void setPayload(Map<String, Object> payload) { this.payload = payload; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
