<?php

// Location: app/Services/VideoGeneratorService.php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VideoGeneratorService
{
    private string $ffmpeg = 'C:\\ffmpeg\\bin\\ffmpeg.exe';

    // ✅ Updated working models (2025)
    private array $models = [
        'https://api-inference.huggingface.co/models/Wan-AI/Wan2.1-T2V-14B',
        'https://api-inference.huggingface.co/models/tencent/HunyuanVideo',
        'https://api-inference.huggingface.co/models/genmo/mochi-1-preview',
        'https://api-inference.huggingface.co/models/cerspense/zeroscope_v2_XL',
    ];

    private string $apiToken;

    public function __construct()
    {
        $this->apiToken = config('services.huggingface.token');
    }

    public function generate(string $prompt, int $sceneIndex, string $jobId): string
    {
        $outputDir  = storage_path("app/public/videos/{$jobId}");
        $outputPath = "{$outputDir}/scene_{$sceneIndex}_video.mp4";

        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $cleanPrompt = preg_replace('/\(Paste into.*?\)/i', '', $prompt);
        $cleanPrompt = trim($cleanPrompt);

        Log::info("Generating video for scene {$sceneIndex} with token: " . substr($this->apiToken, 0, 10) . '...');

        // ✅ Try each HuggingFace model — NO early return blocking this!
        foreach ($this->models as $modelUrl) {
            try {
                Log::info("Trying model: {$modelUrl}");
                $result = $this->callModel($modelUrl, $cleanPrompt, $outputPath);
                if ($result) {
                    Log::info("✅ Video generated for scene {$sceneIndex} using: {$modelUrl}");
                    return $outputPath;
                }
            } catch (\Exception $e) {
                Log::warning("Model failed ({$modelUrl}): " . $e->getMessage());
                continue;
            }
        }

        // All models failed — use placeholder
        Log::warning("All HuggingFace models failed for scene {$sceneIndex} — using placeholder");
        return $this->generatePlaceholderVideo($cleanPrompt, $sceneIndex, $outputPath);
    }

    private function callModel(string $modelUrl, string $prompt, string $outputPath): bool
    {
        $maxRetries = 5;
        $attempt    = 0;

        while ($attempt < $maxRetries) {
            Log::info("Attempt {$attempt} for model: {$modelUrl}");

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiToken}",
                'Content-Type'  => 'application/json',
            ])
            ->timeout(300)
            ->post($modelUrl, [
                'inputs'     => $prompt,
                'parameters' => [
                    'num_frames'          => 16,
                    'num_inference_steps' => 25,
                    'guidance_scale'      => 9,
                ],
            ]);

            Log::info("Response status: " . $response->status());

            // ✅ Success — save the video bytes
            if ($response->successful()) {
                $contentType = $response->header('Content-Type');
                Log::info("Content-Type: " . $contentType);

                if (str_contains($contentType, 'video') || str_contains($contentType, 'octet-stream')) {
                    file_put_contents($outputPath, $response->body());
                    if (file_exists($outputPath) && filesize($outputPath) > 1000) {
                        return true;
                    }
                }

                // Some models return JSON with base64 video
                $json = $response->json();
                if (isset($json[0]['generated_video'])) {
                    file_put_contents($outputPath, base64_decode($json[0]['generated_video']));
                    return true;
                }

                Log::warning("Unexpected response body: " . substr($response->body(), 0, 200));
                return false;
            }

            // ⏳ Model still loading — wait and retry
            if ($response->status() === 503) {
                $waitTime = $response->json()['estimated_time'] ?? 30;
                Log::info("Model loading... waiting {$waitTime}s (attempt {$attempt})");
                sleep(min((int)$waitTime + 5, 60));
                $attempt++;
                continue;
            }

            // 🚫 Rate limited — wait 30s
            if ($response->status() === 429) {
                Log::warning("Rate limited — waiting 30s");
                sleep(30);
                $attempt++;
                continue;
            }

            // ❌ Model gone (410) or other error — try next model
            Log::warning("Model returned {$response->status()} — skipping");
            return false;
        }

        return false;
    }

    private function generatePlaceholderVideo(string $prompt, int $sceneIndex, string $outputPath): string
    {
        $ff       = "\"{$this->ffmpeg}\"";
        $colors   = ['0x1a1a2e', '0x16213e', '0x0f3460', '0x533483', '0x2b2d42'];
        $color    = $colors[($sceneIndex - 1) % count($colors)];
        $duration = 10;

        $shortText = substr(preg_replace('/[^a-zA-Z0-9 .,!?]/', ' ', $prompt), 0, 60);
        $shortText = trim(addslashes($shortText));

        $cmd = "{$ff} -f lavfi "
             . "-i \"color=c={$color}:size=1280x720:duration={$duration}:rate=30\" "
             . "-vf \"drawtext=text='Scene {$sceneIndex}'"
             . ":fontcolor=white:fontsize=52:x=(w-text_w)/2:y=(h/2)-60,"
             . "drawtext=text='{$shortText}'"
             . ":fontcolor=0xaaaaaa:fontsize=18:x=60:y=(h/2)+20\" "
             . "-c:v libx264 -pix_fmt yuv420p "
             . escapeshellarg($outputPath)
             . " -y 2>&1";

        exec($cmd, $output, $returnCode);

        if ($returnCode !== 0 || !file_exists($outputPath)) {
            $cmd = "{$ff} -f lavfi "
                 . "-i \"color=c={$color}:size=1280x720:duration={$duration}:rate=30\" "
                 . "-c:v libx264 -pix_fmt yuv420p "
                 . escapeshellarg($outputPath)
                 . " -y 2>&1";
            exec($cmd, $output);
        }

        if (!file_exists($outputPath)) {
            throw new \Exception("Could not generate video for scene {$sceneIndex}");
        }

        return $outputPath;
    }
}