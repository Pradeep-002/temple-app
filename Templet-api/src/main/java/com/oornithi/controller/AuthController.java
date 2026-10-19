package com.oornithi.controller;

import com.oornithi.dto.ApiResponse;
import com.oornithi.dto.AuthDTO;
import com.oornithi.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDTO.LoginResponse>> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
        AuthDTO.LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register-sangam")
    public ResponseEntity<ApiResponse<AuthDTO.LoginResponse>> registerSangam(@Valid @RequestBody AuthDTO.SangamRegisterRequest request) {
        AuthDTO.LoginResponse response = authService.registerSangam(request);
        return ResponseEntity.ok(ApiResponse.success("Sangam registered successfully with 1-month free trial", response));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            org.springframework.security.core.Authentication authentication,
            @Valid @RequestBody AuthDTO.ChangePasswordRequest request) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized: Authentication required to change password");
        }
        java.util.UUID userId = java.util.UUID.fromString(authentication.getName());
        authService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}
