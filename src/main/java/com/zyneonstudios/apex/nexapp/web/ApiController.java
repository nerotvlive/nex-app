package com.zyneonstudios.apex.nexapp.web;

import com.zyneonstudios.apex.nexapp.Main;
import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiController {

    @GetMapping({"/status", "/state","/status/", "/state/", "/", ""})
    public ResponseEntity<Object> handleRequest(HttpServletRequest request) {
        if(RootController.isAllowedRequest(request.getRequestURL().toString())) {
            return ResponseEntity.accepted().body(Map.of(
                    "service", "NEX App API by Zyneon Apex, a Zyneon Studios Division",
                    "status", "online",
                    "dev", Main.getLogger().isDebugging(),
                    "system", Map.of(
                            "os", Map.of(
                                    "name", System.getProperty("os.name"),
                                    "version", System.getProperty("os.version"),
                                    "arch", System.getProperty("os.arch")
                            )
                    ),
                    "version", Map.of(
                            "number", NEXApplication.getInstance().getVersion(),
                            "name", Main.getVersionName(),
                            "type", Main.getVersionType()
                    ),
                    "scheme", "LEGACY"
            ));
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
