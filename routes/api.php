<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\VideoGeneratorController;

Route::post('/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/generate-video',          [VideoGeneratorController::class, 'generate']);
    Route::get('/video-status/{jobId}',     [VideoGeneratorController::class, 'status']);
    Route::get('/videos',                   [VideoGeneratorController::class, 'list']);
    Route::delete('/videos/{id}',           [VideoGeneratorController::class, 'delete']);
});
