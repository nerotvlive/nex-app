package com.zyneonstudios.apex.nexapp.main;

import com.zyneonstudios.apex.nexapp.Main;
import com.zyneonstudios.apex.nexapp.springboot.controllers.ApiController;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.lang.foreign.*;
import java.lang.invoke.MethodHandle;
import java.net.StandardProtocolFamily;
import java.net.UnixDomainSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.function.Consumer;

public class InstanceManager {

    private static final int MAX_MESSAGE_SIZE = 1024 * 1024;
    private static final long LAUNCH_TIMEOUT = 60_000;

    private static ServerSocketChannel server;
    private static Path socket;
    private static Consumer<LaunchRequest> handler;

    public static boolean claim(int port, String[] args) {
        socket = Main.getAppDirectory().resolve("instance-" + port + ".sock");
        try {
            Files.createDirectories(socket.getParent());
            if (Files.exists(socket)) {
                if (forward(args)) return false;
                Files.deleteIfExists(socket);
            }
            try {
                server = ServerSocketChannel.open(StandardProtocolFamily.UNIX);
                server.bind(UnixDomainSocketAddress.of(socket));
            } catch (IOException e) {
                if (server != null) server.close();
                server = null;
                if (forward(args)) return false;
                throw e;
            }
            Runtime.getRuntime().addShutdownHook(new Thread(InstanceManager::release));
            Thread.ofPlatform().daemon().name("nex-instance").start(InstanceManager::listen);
        } catch (Exception e) {
            System.err.println("[Instance] Single instance lock unavailable: " + e.getMessage());
        }
        return true;
    }

    public static void setHandler(Consumer<LaunchRequest> handler) {
        InstanceManager.handler = handler;
    }

    private static boolean forward(String[] args) {
        try (SocketChannel channel = SocketChannel.open(UnixDomainSocketAddress.of(socket))) {
            allowForeground();
            Map<String, Object> message = new LinkedHashMap<>();
            message.put("cwd", Path.of("").toAbsolutePath().toString());
            message.put("args", Arrays.stream(args).filter(Objects::nonNull).toList());
            ByteBuffer buffer = ByteBuffer.wrap(ApiController.getObjectMapper().writeValueAsString(message).getBytes(StandardCharsets.UTF_8));
            while (buffer.hasRemaining()) channel.write(buffer);
            channel.shutdownOutput();
            channel.read(ByteBuffer.allocate(8));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static void listen() {
        while (server != null && server.isOpen()) {
            try (SocketChannel client = server.accept()) {
                String message = read(client);
                client.write(ByteBuffer.wrap("ok".getBytes(StandardCharsets.UTF_8)));
                LaunchRequest request = parse(message);
                if (request != null) Thread.ofPlatform().name("nex-instance-request").start(() -> dispatch(request));
            } catch (Exception e) {
                if (server != null && server.isOpen()) System.err.println("[Instance] Failed to receive launch request: " + e.getMessage());
            }
        }
    }

    private static String read(SocketChannel client) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ByteBuffer buffer = ByteBuffer.allocate(8192);
        while (client.read(buffer) >= 0) {
            buffer.flip();
            out.write(buffer.array(), 0, buffer.limit());
            buffer.clear();
            if (out.size() > MAX_MESSAGE_SIZE) throw new IOException("Launch request too large");
        }
        return out.toString(StandardCharsets.UTF_8);
    }

    private static LaunchRequest parse(String message) {
        try {
            Map<?, ?> data = ApiController.getObjectMapper().readValue(message, Map.class);
            Object cwd = data.get("cwd");
            List<String> args = new ArrayList<>();
            if (data.get("args") instanceof List<?> list) {
                for (Object arg : list) if (arg != null) args.add(arg.toString());
            }
            return LaunchRequest.parse(args.toArray(String[]::new), cwd == null ? null : Path.of(cwd.toString()));
        } catch (Exception e) {
            System.err.println("[Instance] Invalid launch request: " + e.getMessage());
            return null;
        }
    }

    private static void dispatch(LaunchRequest request) {
        long deadline = System.currentTimeMillis() + LAUNCH_TIMEOUT;
        while (handler == null || Main.getNEXApp() == null || !Main.getNEXApp().isLaunched()) {
            if (System.currentTimeMillis() > deadline) return;
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                return;
            }
        }
        try {
            handler.accept(request);
        } catch (Exception e) {
            System.err.println("[Instance] Failed to handle launch request: " + e.getMessage());
        }
    }

    private static void allowForeground() {
        if (!System.getProperty("os.name").toLowerCase(Locale.ROOT).contains("win")) return;
        try {
            SymbolLookup user32 = SymbolLookup.libraryLookup("user32", Arena.global());
            MethodHandle allow = Linker.nativeLinker().downcallHandle(user32.find("AllowSetForegroundWindow").orElseThrow(), FunctionDescriptor.of(ValueLayout.JAVA_INT, ValueLayout.JAVA_INT));
            int result = (int) allow.invokeExact(-1);
        } catch (Throwable e) {
            System.err.println("[Instance] Failed to pass foreground rights: " + e.getMessage());
        }
    }

    private static void release() {
        try {
            if (server != null) server.close();
            if (socket != null) Files.deleteIfExists(socket);
        } catch (IOException ignored) {
        }
    }
}
