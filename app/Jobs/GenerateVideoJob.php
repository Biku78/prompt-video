<?php

namespace App\Jobs;

use App\Models\VideoJob;
use App\Services\AudioGeneratorService;
use App\Services\FFmpegService;
use App\Services\VideoGeneratorService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateVideoJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue,Queueable,SerializesModels;

    public $timeout = 3600;
    public $tries   = 1;
    /**
     * Create a new job instance.
     */
    public function __construct(public VideoJob $videoJob)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(
        AudioGeneratorService $audioService,
        VideoGeneratorService $videoService,
        FFmpegService $ffmpegService
    ): void {

        $job    = $this->videoJob;
        $scenes = json_decode($job->scenes_data, true);

        $this->updateStatus($job, 'processing', 'Starting generation...');

        $sceneFiles = [];

        foreach ($scenes as $index => $scene) {
            try {
                // Step 1: Generate Audio for this scene
                $this->updateStatus(
                    $job,
                    'processing',
                    "Scene {$scene['index']}: Generating Hindi audio...",
                    $index
                );

                $audioPath = $audioService->generate(
                    text: $scene['voiceover'],
                    language: $job->language,
                    sceneIndex: $scene['index'],
                    jobId: $job->job_id
                );

                // Step 2: Generate Video clip for this scene
                $this->updateStatus(
                    $job,
                    'processing',
                    "Scene {$scene['index']}: Generating video clip...",
                    $index
                );

                $videoClipPath = $videoService->generate(
                    prompt: $scene['visualPrompt'],
                    sceneIndex: $scene['index'],
                    jobId: $job->job_id
                );

                // Step 3: Merge audio + video for this scene
                $this->updateStatus(
                    $job,
                    'processing',
                    "Scene {$scene['index']}: Merging audio and video...",
                    $index
                );

                $mergedPath = $ffmpegService->mergeAudioVideo(
                    videoPath: $videoClipPath,
                    audioPath: $audioPath,
                    sceneTitle: $scene['title'],
                    sceneIndex: $scene['index'],
                    jobId: $job->job_id
                );

                $sceneFiles[] = $mergedPath;

                $job->increment('scenes_done');
            } catch (\Exception $e) {
                Log::error("Scene {$scene['index']} failed: " . $e->getMessage());
                // Continue with next scene even if one fails
                $sceneFiles[] = null;
                $job->increment('scenes_done');
            }
        }

        // Step 4: Stitch all scenes together
        $this->updateStatus($job, 'processing', 'Stitching all scenes into final video...');

        $validFiles = array_filter($sceneFiles);

        if (empty($validFiles)) {
            $this->updateStatus($job, 'failed', 'All scenes failed to generate.');
            return;
        }

        $finalVideoPath = $ffmpegService->stitchScenes(
            scenePaths: array_values($validFiles),
            jobId: $job->job_id
        );

        // Done!
        $job->update([
            'status'          => 'completed',
            'current_step'    => 'Completed!',
            'final_video_url' => '/storage/videos/' . $job->job_id . '/final.mp4',
            'duration'        => $ffmpegService->getVideoDuration($finalVideoPath),
        ]);
    }

    private function updateStatus(VideoJob $job, string $status, string $step, int $scenesDone = null): void
    {
        $update = ['status' => $status, 'current_step' => $step];
        if ($scenesDone !== null) {
            $update['scenes_done'] = $scenesDone;
        }
        $job->update($update);
    }

    public function failed(\Throwable $exception): void
    {
        $this->videoJob->update([
            'status'        => 'failed',
            'error_message' => $exception->getMessage(),
            'current_step'  => 'Failed: ' . $exception->getMessage(),
        ]);
    }
}
