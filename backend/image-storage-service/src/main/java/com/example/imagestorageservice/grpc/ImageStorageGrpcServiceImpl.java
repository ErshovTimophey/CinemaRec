package com.example.imagestorageservice.grpc;

import com.example.cinemarec.grpc.imagestorage.*;
import com.example.imagestorageservice.service.S3Service;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;

@GrpcService
public class ImageStorageGrpcServiceImpl extends ImageStorageServiceGrpc.ImageStorageServiceImplBase {

    private final S3Service s3Service;

    public ImageStorageGrpcServiceImpl(S3Service s3Service) {
        this.s3Service = s3Service;
    }

    @Override
    public void uploadImage(UploadImageRequest request, StreamObserver<UploadImageResponse> responseObserver) {
        String fileName = request.getFileName() != null && !request.getFileName().isEmpty()
                ? request.getFileName() : "image";
        String url = s3Service.uploadImage(request.getImageData().toByteArray(), fileName);
        responseObserver.onNext(UploadImageResponse.newBuilder().setImageUrl(url).build());
        responseObserver.onCompleted();
    }

    @Override
    public void deleteImage(DeleteImageRequest request, StreamObserver<DeleteImageResponse> responseObserver) {
        s3Service.deleteImage(request.getImageUrl());
        responseObserver.onNext(DeleteImageResponse.newBuilder().build());
        responseObserver.onCompleted();
    }
}
