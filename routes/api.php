<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\VideoGeneratorController;

Route::post('/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/generate-video',          [VideoGeneratorController::class, 'generate']);
    Route::get('/video-status/{jobId}',     [VideoGeneratorController::class, 'status']);
    Route::get('/videos',                   [VideoGeneratorController::class, 'list']);
    Route::delete('/videos/{id}',           [VideoGeneratorController::class, 'delete']);


    Route::get('notes', [NoteController::class, 'index']);
    Route::post('notes', [NoteController::class, 'store']);
    Route::put('notes/{id}',[NoteController::class, 'update']);
    Route::delete('notes/{id}', [NoteController::class, 'destroy']);

    // ── Toggle actions ────────────────────────────────────
    Route::patch('notes/{id}/pin',      [NoteController::class, 'togglePin']);
    Route::patch('notes/{id}/revision', [NoteController::class, 'toggleRevision']);

    // ── Analytics (pre-computed, optional) ───────────────
    Route::get('notes/analytics',    [NoteController::class, 'analytics']);
});
