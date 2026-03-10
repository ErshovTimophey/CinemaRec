package com.example.recommendationservice.service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class InternetArchiveService {

    private final RestTemplate restTemplate;

    @Data
    @AllArgsConstructor
    public static class ArchiveMovieOption {
        private String identifier;
        private String title;
        private String streamUrl;
    }

    /**
     * Simple search on Internet Archive for public movies matching the query.
     */
    public List<ArchiveMovieOption> searchMovies(String query, int rows) {
        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl("https://archive.org/advancedsearch.php")
                    .queryParam("q", "mediatype:(movies) AND title:(" + query + ")")
                    .queryParam("output", "json")
                    .queryParam("rows", rows)
                    .queryParam("page", 1)
                    .queryParam("fl[]", "identifier,title")
                    .toUriString();

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, HttpEntity.EMPTY, Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("Internet Archive search non-success status for query={}", query);
                return List.of();
            }

            Object responseObj = response.getBody().get("response");
            if (!(responseObj instanceof Map<?, ?> responseMap)) {
                return List.of();
            }

            Object docsObj = responseMap.get("docs");
            if (!(docsObj instanceof List<?> docs)) {
                return List.of();
            }

            List<ArchiveMovieOption> result = new ArrayList<>();
            for (Object docObj : docs) {
                if (!(docObj instanceof Map<?, ?> doc)) continue;
                Object identifierObj = doc.get("identifier");
                Object titleObj = doc.get("title");
                if (!(identifierObj instanceof String identifier)) continue;
                String title = titleObj instanceof String ? (String) titleObj : identifier;
                String streamUrl = "https://archive.org/embed/" + identifier;
                result.add(new ArchiveMovieOption(identifier, title, streamUrl));
            }
            return result;
        } catch (Exception e) {
            log.error("Error searching Internet Archive for query={}", query, e);
            return List.of();
        }
    }
}

