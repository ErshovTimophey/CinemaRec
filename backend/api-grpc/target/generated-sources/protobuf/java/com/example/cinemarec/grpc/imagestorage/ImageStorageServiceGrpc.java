package com.example.cinemarec.grpc.imagestorage;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.63.0)",
    comments = "Source: image_storage.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class ImageStorageServiceGrpc {

  private ImageStorageServiceGrpc() {}

  public static final java.lang.String SERVICE_NAME = "ImageStorageService";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<com.example.cinemarec.grpc.imagestorage.UploadImageRequest,
      com.example.cinemarec.grpc.imagestorage.UploadImageResponse> getUploadImageMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "UploadImage",
      requestType = com.example.cinemarec.grpc.imagestorage.UploadImageRequest.class,
      responseType = com.example.cinemarec.grpc.imagestorage.UploadImageResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.example.cinemarec.grpc.imagestorage.UploadImageRequest,
      com.example.cinemarec.grpc.imagestorage.UploadImageResponse> getUploadImageMethod() {
    io.grpc.MethodDescriptor<com.example.cinemarec.grpc.imagestorage.UploadImageRequest, com.example.cinemarec.grpc.imagestorage.UploadImageResponse> getUploadImageMethod;
    if ((getUploadImageMethod = ImageStorageServiceGrpc.getUploadImageMethod) == null) {
      synchronized (ImageStorageServiceGrpc.class) {
        if ((getUploadImageMethod = ImageStorageServiceGrpc.getUploadImageMethod) == null) {
          ImageStorageServiceGrpc.getUploadImageMethod = getUploadImageMethod =
              io.grpc.MethodDescriptor.<com.example.cinemarec.grpc.imagestorage.UploadImageRequest, com.example.cinemarec.grpc.imagestorage.UploadImageResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "UploadImage"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.example.cinemarec.grpc.imagestorage.UploadImageRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.example.cinemarec.grpc.imagestorage.UploadImageResponse.getDefaultInstance()))
              .setSchemaDescriptor(new ImageStorageServiceMethodDescriptorSupplier("UploadImage"))
              .build();
        }
      }
    }
    return getUploadImageMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.example.cinemarec.grpc.imagestorage.DeleteImageRequest,
      com.example.cinemarec.grpc.imagestorage.DeleteImageResponse> getDeleteImageMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "DeleteImage",
      requestType = com.example.cinemarec.grpc.imagestorage.DeleteImageRequest.class,
      responseType = com.example.cinemarec.grpc.imagestorage.DeleteImageResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.example.cinemarec.grpc.imagestorage.DeleteImageRequest,
      com.example.cinemarec.grpc.imagestorage.DeleteImageResponse> getDeleteImageMethod() {
    io.grpc.MethodDescriptor<com.example.cinemarec.grpc.imagestorage.DeleteImageRequest, com.example.cinemarec.grpc.imagestorage.DeleteImageResponse> getDeleteImageMethod;
    if ((getDeleteImageMethod = ImageStorageServiceGrpc.getDeleteImageMethod) == null) {
      synchronized (ImageStorageServiceGrpc.class) {
        if ((getDeleteImageMethod = ImageStorageServiceGrpc.getDeleteImageMethod) == null) {
          ImageStorageServiceGrpc.getDeleteImageMethod = getDeleteImageMethod =
              io.grpc.MethodDescriptor.<com.example.cinemarec.grpc.imagestorage.DeleteImageRequest, com.example.cinemarec.grpc.imagestorage.DeleteImageResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "DeleteImage"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.example.cinemarec.grpc.imagestorage.DeleteImageRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.example.cinemarec.grpc.imagestorage.DeleteImageResponse.getDefaultInstance()))
              .setSchemaDescriptor(new ImageStorageServiceMethodDescriptorSupplier("DeleteImage"))
              .build();
        }
      }
    }
    return getDeleteImageMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static ImageStorageServiceStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ImageStorageServiceStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ImageStorageServiceStub>() {
        @java.lang.Override
        public ImageStorageServiceStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ImageStorageServiceStub(channel, callOptions);
        }
      };
    return ImageStorageServiceStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static ImageStorageServiceBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ImageStorageServiceBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ImageStorageServiceBlockingStub>() {
        @java.lang.Override
        public ImageStorageServiceBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ImageStorageServiceBlockingStub(channel, callOptions);
        }
      };
    return ImageStorageServiceBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static ImageStorageServiceFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ImageStorageServiceFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ImageStorageServiceFutureStub>() {
        @java.lang.Override
        public ImageStorageServiceFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ImageStorageServiceFutureStub(channel, callOptions);
        }
      };
    return ImageStorageServiceFutureStub.newStub(factory, channel);
  }

  /**
   */
  public interface AsyncService {

    /**
     */
    default void uploadImage(com.example.cinemarec.grpc.imagestorage.UploadImageRequest request,
        io.grpc.stub.StreamObserver<com.example.cinemarec.grpc.imagestorage.UploadImageResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getUploadImageMethod(), responseObserver);
    }

    /**
     */
    default void deleteImage(com.example.cinemarec.grpc.imagestorage.DeleteImageRequest request,
        io.grpc.stub.StreamObserver<com.example.cinemarec.grpc.imagestorage.DeleteImageResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getDeleteImageMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service ImageStorageService.
   */
  public static abstract class ImageStorageServiceImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return ImageStorageServiceGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service ImageStorageService.
   */
  public static final class ImageStorageServiceStub
      extends io.grpc.stub.AbstractAsyncStub<ImageStorageServiceStub> {
    private ImageStorageServiceStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ImageStorageServiceStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ImageStorageServiceStub(channel, callOptions);
    }

    /**
     */
    public void uploadImage(com.example.cinemarec.grpc.imagestorage.UploadImageRequest request,
        io.grpc.stub.StreamObserver<com.example.cinemarec.grpc.imagestorage.UploadImageResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getUploadImageMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void deleteImage(com.example.cinemarec.grpc.imagestorage.DeleteImageRequest request,
        io.grpc.stub.StreamObserver<com.example.cinemarec.grpc.imagestorage.DeleteImageResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getDeleteImageMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service ImageStorageService.
   */
  public static final class ImageStorageServiceBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<ImageStorageServiceBlockingStub> {
    private ImageStorageServiceBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ImageStorageServiceBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ImageStorageServiceBlockingStub(channel, callOptions);
    }

    /**
     */
    public com.example.cinemarec.grpc.imagestorage.UploadImageResponse uploadImage(com.example.cinemarec.grpc.imagestorage.UploadImageRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getUploadImageMethod(), getCallOptions(), request);
    }

    /**
     */
    public com.example.cinemarec.grpc.imagestorage.DeleteImageResponse deleteImage(com.example.cinemarec.grpc.imagestorage.DeleteImageRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getDeleteImageMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service ImageStorageService.
   */
  public static final class ImageStorageServiceFutureStub
      extends io.grpc.stub.AbstractFutureStub<ImageStorageServiceFutureStub> {
    private ImageStorageServiceFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ImageStorageServiceFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ImageStorageServiceFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.example.cinemarec.grpc.imagestorage.UploadImageResponse> uploadImage(
        com.example.cinemarec.grpc.imagestorage.UploadImageRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getUploadImageMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.example.cinemarec.grpc.imagestorage.DeleteImageResponse> deleteImage(
        com.example.cinemarec.grpc.imagestorage.DeleteImageRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getDeleteImageMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_UPLOAD_IMAGE = 0;
  private static final int METHODID_DELETE_IMAGE = 1;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final AsyncService serviceImpl;
    private final int methodId;

    MethodHandlers(AsyncService serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_UPLOAD_IMAGE:
          serviceImpl.uploadImage((com.example.cinemarec.grpc.imagestorage.UploadImageRequest) request,
              (io.grpc.stub.StreamObserver<com.example.cinemarec.grpc.imagestorage.UploadImageResponse>) responseObserver);
          break;
        case METHODID_DELETE_IMAGE:
          serviceImpl.deleteImage((com.example.cinemarec.grpc.imagestorage.DeleteImageRequest) request,
              (io.grpc.stub.StreamObserver<com.example.cinemarec.grpc.imagestorage.DeleteImageResponse>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        default:
          throw new AssertionError();
      }
    }
  }

  public static final io.grpc.ServerServiceDefinition bindService(AsyncService service) {
    return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
        .addMethod(
          getUploadImageMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.example.cinemarec.grpc.imagestorage.UploadImageRequest,
              com.example.cinemarec.grpc.imagestorage.UploadImageResponse>(
                service, METHODID_UPLOAD_IMAGE)))
        .addMethod(
          getDeleteImageMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.example.cinemarec.grpc.imagestorage.DeleteImageRequest,
              com.example.cinemarec.grpc.imagestorage.DeleteImageResponse>(
                service, METHODID_DELETE_IMAGE)))
        .build();
  }

  private static abstract class ImageStorageServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    ImageStorageServiceBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return com.example.cinemarec.grpc.imagestorage.ImageStorage.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("ImageStorageService");
    }
  }

  private static final class ImageStorageServiceFileDescriptorSupplier
      extends ImageStorageServiceBaseDescriptorSupplier {
    ImageStorageServiceFileDescriptorSupplier() {}
  }

  private static final class ImageStorageServiceMethodDescriptorSupplier
      extends ImageStorageServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    ImageStorageServiceMethodDescriptorSupplier(java.lang.String methodName) {
      this.methodName = methodName;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.MethodDescriptor getMethodDescriptor() {
      return getServiceDescriptor().findMethodByName(methodName);
    }
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (ImageStorageServiceGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new ImageStorageServiceFileDescriptorSupplier())
              .addMethod(getUploadImageMethod())
              .addMethod(getDeleteImageMethod())
              .build();
        }
      }
    }
    return result;
  }
}
