import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.time.Duration;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Minimal network probe that works inside slim Docker images (no curl/wget/ping).
 *
 * Usage:
 *   java -cp /tmp NetTest google.com 443
 *   java -cp /tmp NetTest api.themoviedb.org 443
 *   java -cp /tmp NetTest 8.8.8.8 53
 */
public class NetTest {
    public static void main(String[] args) {
        if (args.length < 2) {
            System.out.println("Usage: NetTest <host> <port> [timeoutMs]");
            System.exit(2);
        }

        String host = args[0];
        int port = Integer.parseInt(args[1]);
        int timeoutMs = args.length >= 3 ? Integer.parseInt(args[2]) : 5000;

        System.out.println("=== NetTest ===");
        System.out.println("Host: " + host);
        System.out.println("Port: " + port);
        System.out.println("Timeout: " + timeoutMs + "ms");

        try {
            InetAddress[] addrs = InetAddress.getAllByName(host);
            System.out.println("DNS: " + Arrays.stream(addrs).map(InetAddress::getHostAddress).collect(Collectors.joining(", ")));
        } catch (Exception e) {
            System.out.println("DNS ERROR: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            System.exit(10);
        }

        // Plain TCP connect
        try (Socket s = new Socket()) {
            long t0 = System.nanoTime();
            s.connect(new InetSocketAddress(host, port), timeoutMs);
            long ms = Duration.ofNanos(System.nanoTime() - t0).toMillis();
            System.out.println("TCP CONNECT: OK (" + ms + "ms)");
        } catch (Exception e) {
            System.out.println("TCP CONNECT ERROR: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            System.exit(20);
        }

        // TLS handshake probe for typical HTTPS ports
        if (port == 443) {
            try {
                long t0 = System.nanoTime();
                SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
                try (SSLSocket ssl = (SSLSocket) factory.createSocket()) {
                    ssl.connect(new InetSocketAddress(host, port), timeoutMs);
                    ssl.setSoTimeout(timeoutMs);
                    ssl.startHandshake();
                }
                long ms = Duration.ofNanos(System.nanoTime() - t0).toMillis();
                System.out.println("TLS HANDSHAKE: OK (" + ms + "ms)");
            } catch (IOException e) {
                System.out.println("TLS HANDSHAKE ERROR: " + e.getClass().getSimpleName() + ": " + e.getMessage());
                System.exit(30);
            } catch (Exception e) {
                System.out.println("TLS HANDSHAKE ERROR: " + e.getClass().getSimpleName() + ": " + e.getMessage());
                System.exit(31);
            }
        }

        System.out.println("RESULT: SUCCESS");
        System.exit(0);
    }
}

