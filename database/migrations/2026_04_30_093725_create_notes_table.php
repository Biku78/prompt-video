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
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('title');
            $table->longText('content');

            $table->enum('tag', [
                'JavaScript',
                'React',
                'CSS',
                'Python',
                'Laravel',
                'AI/ML',
                'Database',
                'DevOps',
                'Design',
                'Math',
                'Other',
            ])->default('Other');

            $table->enum('difficulty', ['Beginner', 'Intermediate', 'Advanced'])->default('Beginner');

            $table->boolean('revision')->default(false);
            $table->boolean('pinned')->default(false);
            $table->unsignedInteger('word_count')->default(0);

            // Stores revision history snapshots as JSON
            $table->json('revisions')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
