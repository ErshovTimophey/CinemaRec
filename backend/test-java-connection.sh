#!/bin/sh
# Test Java connection to TMDB API

echo "Testing Java connection to TMDB API from inside container..."
echo

# Create a simple Java test class
cat > /tmp/TestConnection.java << 'EOF'
import java.net.Socket;
import java.net.InetSocketAddress;

public class TestConnection {
    public static void main(String[] args) {
        String host = args.length > 0 ? args[0] : "api.themoviedb.org";
        int port = args.length > 1 ? Integer.parseInt(args[1]) : 443;
        
        try {
            System.out.println("Connecting to " + host + ":" + port + "...");
            Socket socket = new Socket();
            socket.connect(new InetSocketAddress(host, port), 5000);
            socket.close();
            System.out.println("SUCCESS: Can connect to " + host + ":" + port);
            System.exit(0);
        } catch (java.net.ConnectException e) {
            System.out.println("FAILED: Connection refused - " + e.getMessage());
            System.exit(1);
        } catch (java.net.SocketTimeoutException e) {
            System.out.println("FAILED: Connection timeout - " + e.getMessage());
            System.exit(1);
        } catch (Exception e) {
            System.out.println("FAILED: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            System.exit(1);
        }
    }
}
EOF

# Compile and run
cd /tmp
javac TestConnection.java
java TestConnection api.themoviedb.org 443
java TestConnection google.com 443
