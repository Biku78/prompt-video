<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('video_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('job_id')->unique();
            $table->string('status')->default('pending');
            $table->integer('scenes_total')->default(0);
            $table->integer('scenes_done')->default(0);
            $table->longText('script')->nullable();
            $table->longText('scenes_data')->nullable();
            $table->string('language')->default('hi');
            $table->string('current_step')->nullable();
            $table->string('final_video_url')->nullable();
            $table->string('final_audio_url')->nullable();
            $table->string('duration')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('video_jobs');
    }
};
