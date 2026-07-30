package com.zyneonstudios.apex.nexapp.web;

import com.zyneonstudios.apex.nexapp.Main;
import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.*;

/**
 * The {@code RootController} class is a REST controller responsible for handling HTTP requests
 * to the root path and its subpaths. It serves static content (HTML, CSS, JavaScript) from the
 * application's UI directory.
 */
@RestController
public class RootController {

    @GetMapping("/601*")
    public ResponseEntity<Object> handleExternalRequest(HttpServletRequest request) {
        if(NEXApplication.getInstance().getLocalSettings().useNewUI()) {
            return ResponseEntity.unprocessableEntity().body("<html><head></head><body><script>const urlParams = new URLSearchParams(document.location.search); let exu = ''; if(urlParams.has('url')) { exu = urlParams.get('url'); } location.href = 'http://localhost:"+ Main.getPort()+"/index.html?page=error601&url='+exu;</script></body></html>");
        }
        return ResponseEntity.unprocessableEntity().body("<html><head><style>body { button { padding: 0.33rem 1.5rem; margin: 0.25rem; font-size: 1.25rem; } user-select: none; background: black; color: white; position: absolute; padding: 0; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; font-family: system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif; flex-direction: column; text-align: center; }</style></head><body><p><strong>601: </strong>You've entered an external URL.<br>It is not save to browse the internet via the NEX App.<br><br>Do you want to open <span id='url'>the url</span> in your default browser?</p><br><div><button id='open' onclick=\"location.href='..'\">Yes</button><button id='no' onclick=\"window.location.href = 'http://localhost:"+ Main.getPort()+"/index.html';\">No</button></div><script>const urlParams = new URLSearchParams(document.location.search); if(urlParams.has('url')) { document.getElementById('url').innerText=urlParams.get('url'); document.getElementById('open').onclick = () => { window.open(urlParams.get('url'), '_blank') }; }</script></body></html>");
    }


    /**
     * Handles all GET requests to the root path ("/") and its subpaths ("/**").
     * It serves static content from the UI directory if the request is from a local address.
     *
     * @param request The incoming HTTP request.
     * @return A ResponseEntity containing the requested resource or an error response.
     */
    @GetMapping("/**")
    public ResponseEntity<Object> handleRequest(HttpServletRequest request) {
        // Extract the requested URL and path from the request.
        String url = request.getRequestURL().toString();
        String path = request.getRequestURI();

        // If the path is empty or just "/", default to "index.html".
        if (path.isEmpty() || path.equals("/")) {
            path = "/index.html";
        }

        // Check if the request is from a local address.
        if (isLocalRequest(url)) {
            try {
                // Construct the full path to the requested file in the UI directory.
                String frontendPath = NEXApplication.getInstance().getUiPath();
                if(NEXApplication.getInstance().getLocalSettings().useNewUI())  {
                    frontendPath = frontendPath + "/new";
                }

                InputStream inputStream;
                File file = new File(frontendPath + path);

                // Check if the file exists on the filesystem
                if (file.exists()) {
                    inputStream = new FileInputStream(file);
                } else {
                    // Try to load from classpath (inside JAR)
                    String resourcePath = "/static" + path;
                    if (NEXApplication.getInstance().getLocalSettings().useNewUI()) {
                        resourcePath = "/static/new" + path;
                    }
                    inputStream = getClass().getResourceAsStream(resourcePath);
                    if (inputStream == null) {
                        // Fallback to original html path if static doesn't work
                        resourcePath = "/html" + path;
                        if (NEXApplication.getInstance().getLocalSettings().useNewUI()) {
                            resourcePath = "/html/new" + path;
                        }
                        inputStream = getClass().getResourceAsStream(resourcePath);
                        if (inputStream == null) {
                            throw new FileNotFoundException("Resource not found: " + resourcePath);
                        }
                    }
                }

                // Create an InputStreamResource from the stream.
                InputStreamResource resource = new InputStreamResource(inputStream);

                // Determine the appropriate media type based on the file extension.
                MediaType mediaType = getMediaType(path);

                // Return the resource with the correct media type.
                return ResponseEntity.ok()
                        .contentType(mediaType)
                        .body(resource);
            } catch (FileNotFoundException e) {
                NEXApplication.getLogger().err("File not found: " + e.getMessage());
                return ResponseEntity.notFound().build();
            } catch (Exception e) {
                // Log any other errors that occur.
                NEXApplication.getLogger().err("Error serving file: " + e.getMessage());
                return ResponseEntity.internalServerError().build();
            }
        }

        // If the request is not from a local address, return a 401 Unauthorized response.
        return ResponseEntity.status(401).build();
    }

    /**
     * Checks if the given URL is from a local address.
     *
     * @param url The URL to check.
     * @return True if the URL is from a local address, false otherwise.
     */
    @SuppressWarnings("HttpUrlsUsage")
    public static boolean isLocalRequest(String url) {
        if(url==null||url.isBlank()) {
            return true;
        }
        url = url.toLowerCase();
        return url.startsWith("http://localhost") ||
                url.startsWith("https://localhost") ||
                url.startsWith("http://127.0.0.1") ||
                url.startsWith("https://127.0.0.1") ||
                url.startsWith("http://0:0:0:0:0:0:0:1") ||
                url.startsWith("https://0:0:0:0:0:0:0:1");
    }

    /**
     * Determines the appropriate media type based on the file extension.
     *
     * @param path The path to the file.
     * @return The corresponding MediaType.
     */
    private MediaType getMediaType(String path) {
        if (path.endsWith(".html")) {
            return MediaType.TEXT_HTML;
        } else if (path.endsWith(".css")) {
            return MediaType.valueOf("text/css");
        } else if (path.endsWith(".js")) {
            return MediaType.valueOf("application/javascript");
        } else {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}