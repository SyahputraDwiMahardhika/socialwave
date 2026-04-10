<?php

/**
 * CORS Configuration
 *
 * Mengizinkan React frontend (Vite port 5173) untuk
 * melakukan cross-origin request ke Laravel API backend.
 */
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
