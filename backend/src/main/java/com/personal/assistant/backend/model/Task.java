package com.personal.assistant.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;
import java.util.ArrayList;

@Document(collection = "tasks")
public class Task {
    @Id
    private String id;
    private String title;
    private boolean completed;
    private java.util.Date dueDate;
    private Priority priority;
    private String description;

    // Task Type
    private String taskType; // "MANUAL", "LEARNING", "LOAN"

    // Learning Goal fields
    private Integer totalVideos;
    private Integer completedVideos;

    // Loan/EMI fields
    private Double loanAmount;
    private Double loanOutstanding;
    private Double loanInterestRate;
    private Double loanEmi;

    // Meeting fields
    private java.util.Date meetingStartTime;
    private java.util.Date meetingEndTime;
    private String meetingInfo;
    private String meetingLink;

    private List<SubTask> subTasks = new ArrayList<>();

    public enum Priority {
        NONE, LOW, MEDIUM, HIGH, CRITICAL
    }

    public static class SubTask {
        private String title;
        private boolean completed;

        public SubTask() {
        }

        public SubTask(String title, boolean completed) {
            this.title = title;
            this.completed = completed;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public boolean isCompleted() {
            return completed;
        }

        public void setCompleted(boolean completed) {
            this.completed = completed;
        }
    }

    public Task() {
    }

    public Task(String title, boolean completed, java.util.Date dueDate, Priority priority, List<SubTask> subTasks) {
        this.title = title;
        this.completed = completed;
        this.dueDate = dueDate;
        this.priority = priority;
        this.subTasks = subTasks;
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public java.util.Date getDueDate() {
        return dueDate;
    }

    public void setDueDate(java.util.Date dueDate) {
        this.dueDate = dueDate;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<SubTask> getSubTasks() {
        return subTasks;
    }

    public void setSubTasks(List<SubTask> subTasks) {
        this.subTasks = subTasks;
    }

    public String getTaskType() {
        return taskType;
    }

    public void setTaskType(String taskType) {
        this.taskType = taskType;
    }

    public Integer getTotalVideos() {
        return totalVideos;
    }

    public void setTotalVideos(Integer totalVideos) {
        this.totalVideos = totalVideos;
    }

    public Integer getCompletedVideos() {
        return completedVideos;
    }

    public void setCompletedVideos(Integer completedVideos) {
        this.completedVideos = completedVideos;
    }

    public Double getLoanAmount() {
        return loanAmount;
    }

    public void setLoanAmount(Double loanAmount) {
        this.loanAmount = loanAmount;
    }

    public Double getLoanOutstanding() {
        return loanOutstanding;
    }

    public void setLoanOutstanding(Double loanOutstanding) {
        this.loanOutstanding = loanOutstanding;
    }

    public Double getLoanInterestRate() {
        return loanInterestRate;
    }

    public void setLoanInterestRate(Double loanInterestRate) {
        this.loanInterestRate = loanInterestRate;
    }

    public Double getLoanEmi() {
        return loanEmi;
    }

    public void setLoanEmi(Double loanEmi) {
        this.loanEmi = loanEmi;
    }

    public java.util.Date getMeetingStartTime() {
        return meetingStartTime;
    }

    public void setMeetingStartTime(java.util.Date meetingStartTime) {
        this.meetingStartTime = meetingStartTime;
    }

    public java.util.Date getMeetingEndTime() {
        return meetingEndTime;
    }

    public void setMeetingEndTime(java.util.Date meetingEndTime) {
        this.meetingEndTime = meetingEndTime;
    }

    public String getMeetingInfo() {
        return meetingInfo;
    }

    public void setMeetingInfo(String meetingInfo) {
        this.meetingInfo = meetingInfo;
    }

    public String getMeetingLink() {
        return meetingLink;
    }

    public void setMeetingLink(String meetingLink) {
        this.meetingLink = meetingLink;
    }
}
