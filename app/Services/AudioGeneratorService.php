<?php

// Location: app/Services/AudioGeneratorService.php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AudioGeneratorService
{
    private string $apiToken;
    private string $apiUrl = 'https://api-inference.huggingface.co/models/suno/bark';

    // ✅ Full paths for Windows — PHP finds these without PATH being set
    private string $gttsCli = 'C:\\Users\\bikra\\AppData\\Roaming\\Python\\Python39\\Scripts\\gtts-cli.exe';
    private string $ffmpeg  = 'C:\\ffmpeg\\bin\\ffmpeg.exe'; // ← UPDATE after finding ffmpeg

    public function __construct()
    {
        $this->apiToken = config('services.huggingface.token');
    }

    public function generate(string $text, string $language, int $sceneIndex, string $jobId): string
    {
        $outputDir  = storage_path("app/public/videos/{$jobId}");
        $outputPath = "{$outputDir}/scene_{$sceneIndex}_audio.wav";

        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        // Try Hugging Face Bark first (only if token is set)
        if (!empty($this->apiToken) && $this->apiToken !== 'hf_YOUR_TOKEN_HERE') {
            $prompt  = $language === 'hi' ? "[HINDI] {$text}" : $text;
            $attempt = 0;

            while ($attempt < 3) {
                try {
                    $response = Http::withHeaders([
                        'Authorization' => "Bearer {$this->apiToken}",
                        'Content-Type'  => 'application/json',
                    ])->timeout(300)->post($this->apiUrl, ['inputs' => $prompt]);

                    if ($response->successful()) {
                        file_put_contents($outputPath, $response->body());
                        Log::info("Bark audio generated for scene {$sceneIndex}");
                        return $outputPath;
                    }

                    if ($response->status() === 503) {
                        $wait = json_decode($response->body(), true)['estimated_time'] ?? 20;
                        sleep(min((int)$wait + 5, 60));
                        $attempt++;
                        continue;
                    }

                    Log::warning("Bark API error {$response->status()} — using gTTS fallback");
                    break;

                } catch (\Exception $e) {
                    $attempt++;
                    if ($attempt < 3) sleep(10);
                }
            }
        }

        // ✅ Fallback: gTTS (free, works offline)
        return $this->fallbackTTS($text, $language, $outputPath);
    }

    private function fallbackTTS(string $text, string $language, string $outputPath): string
    {
        $mp3Path = str_replace('.wav', '.mp3', $outputPath);
        $lang    = $language === 'hi' ? 'hi' : 'en';

        // ✅ Full path to gtts-cli.exe — no PATH needed
        $cmd = "\"{$this->gttsCli}\" -l {$lang} -o "
             . escapeshellarg($mp3Path) . " "
             . escapeshellarg($text)
             . " 2>&1";

        exec($cmd, $output, $returnCode);
        Log::info("gTTS cmd: {$cmd}");
        Log::info("gTTS output: " . implode("\n", $output));
        Log::info("gTTS code: {$returnCode}");

        if ($returnCode === 0 && file_exists($mp3Path)) {
            // Convert mp3 → wav using ffmpeg full path
            $cmd2 = "\"{$this->ffmpeg}\" -i "
                  . escapeshellarg($mp3Path) . " "
                  . escapeshellarg($outputPath)
                  . " -y 2>&1";
            exec($cmd2, $out2);
            Log::info("FFmpeg convert: " . implode("\n", $out2));

            if (file_exists($outputPath)) {
                @unlink($mp3Path);
                return $outputPath;
            }
            return $mp3Path; // use mp3 if wav conversion failed
        }

        throw new \Exception(
            "gTTS failed (code {$returnCode}): " . implode("\n", $output)
        );
    }
}