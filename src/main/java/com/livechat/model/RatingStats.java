package com.livechat.model;

import java.util.List;
import java.util.Map;

public class RatingStats {
    private double averageRating;
    private Map<Integer, Integer> ratingCounts; // Key: 1-5, Value: số lượng
    private List<RatingComment> comments;

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public Map<Integer, Integer> getRatingCounts() {
        return ratingCounts;
    }

    public void setRatingCounts(Map<Integer, Integer> ratingCounts) {
        this.ratingCounts = ratingCounts;
    }

    public List<RatingComment> getComments() {
        return comments;
    }

    public void setComments(List<RatingComment> comments) {
        this.comments = comments;
    }
}