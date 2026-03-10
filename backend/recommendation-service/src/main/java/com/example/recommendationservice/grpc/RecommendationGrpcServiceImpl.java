package com.example.recommendationservice.grpc;

import com.example.cinemarec.grpc.recommendation.GetRecommendationsRequest;
import com.example.cinemarec.grpc.recommendation.GetRecommendationsResponse;
import com.example.cinemarec.grpc.recommendation.RecommendationItem;
import com.example.cinemarec.grpc.recommendation.RecommendationServiceGrpc;
import com.example.recommendationservice.model.Recommendation;
import com.example.recommendationservice.service.RecommendationService;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;

import java.time.format.DateTimeFormatter;
import java.util.List;

@GrpcService
public class RecommendationGrpcServiceImpl extends RecommendationServiceGrpc.RecommendationServiceImplBase {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final RecommendationService recommendationService;

    public RecommendationGrpcServiceImpl(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @Override
    public void getRecommendations(GetRecommendationsRequest request,
                                   StreamObserver<GetRecommendationsResponse> responseObserver) {
        String email = request.getEmail();
        List<Recommendation> list = recommendationService.getRecommendationsForUser(email);
        GetRecommendationsResponse.Builder responseBuilder = GetRecommendationsResponse.newBuilder();
        for (Recommendation r : list) {
            RecommendationItem.Builder item = RecommendationItem.newBuilder()
                    .setId(r.getId() != null ? r.getId() : 0L)
                    .setEmail(r.getEmail() != null ? r.getEmail() : "")
                    .setMovieId(r.getMovieId() != null ? r.getMovieId() : 0)
                    .setMovieTitle(r.getMovieTitle() != null ? r.getMovieTitle() : "")
                    .setPosterUrl(r.getPosterUrl() != null ? r.getPosterUrl() : "")
                    .setRating(r.getRating() != null ? r.getRating() : 0.0)
                    .setOverview(r.getOverview() != null ? r.getOverview() : "")
                    .setGenres(r.getGenres() != null ? r.getGenres() : "")
                    .setWatched(r.isWatched())
                    .setCategory(r.getCategory() != null ? r.getCategory() : "");
            if (r.getRecommendedAt() != null) {
                item.setRecommendedAt(r.getRecommendedAt().format(ISO));
            }
            responseBuilder.addItems(item.build());
        }
        responseObserver.onNext(responseBuilder.build());
        responseObserver.onCompleted();
    }
}
