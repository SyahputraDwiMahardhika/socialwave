<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| The SocialWave backend is a pure API. The web route only serves
| a simple health check confirmation for the root URL.
|
*/

Route::get('/', function () {
    return response()->json([
        'app'     => 'SocialWave API',
        'version' => '1.0.0',
        'status'  => 'running',
    ]);
});
