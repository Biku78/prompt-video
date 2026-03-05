<?php

// Location: app/Services/FFmpegService.php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class FFmpegService
{
    // ✅ CHANGE THESE to your actual ffmpeg paths on Windows
    // Run: where ffmpeg   to find the path
    private string $ffmpeg  = 'C:\\ffmpeg\\bin\\ffmpeg.exe';
    private string $ffprobe = 'C:\\ffmpeg\\bin\\ffprobe.exe';

    public function mergeAudioVideo(
        string $videoPath,
        string $audioPath,
        string $sceneTitle,
        int    $sceneIndex,
        string $jobId
    ): string {
        $outputDir  = storage_path("app/public/videos/{$jobId}");
        $outputPath = "{$outputDir}/scene_{$sceneIndex}_merged.mp4";

        $cleanTitle = preg_replace('/\(.*?\)/', '', $sceneTitle);
        $cleanTitle = addslashes(trim($cleanTitle));

        $audioDuration = $this->getAudioDuration($audioPath);
        $videoDuration = $this->getVideoDuration($videoPath);

        $ff = "\"{$this->ffmpeg}\""; // ✅ quoted full path

        if ($audioDuration > $videoDuration) {
            $cmd = "{$ff} "
                 . "-stream_loop -1 -i " . escapeshellarg($videoPath) . " "
                 . "-i " . escapeshellarg($audioPath) . " "
                 . "-shortest "
                 . "-vf \"drawtext=text='" . addslashes("Scene {$sceneIndex}: {$cleanTitle}") . "'"
                 . ":fontcolor=white:fontsize=28:x=30:y=30"
                 . ":box=1:boxcolor=black@0.5:boxborderw=10\" "
                 . "-c:v libx264 -c:a aac -pix_fmt yuv420p "
                 . escapeshellarg($outputPath)
                 . " -y 2>&1";
        } else {
            $cmd = "{$ff} "
                 . "-i " . escapeshellarg($videoPath) . " "
                 . "-i " . escapeshellarg($audioPath) . " "
                 . "-map 0:v -map 1:a "
                 . "-t " . $audioDuration . " "
                 . "-vf \"drawtext=text='" . addslashes("Scene {$sceneIndex}: {$cleanTitle}") . "'"
                 . ":fontcolor=white:fontsize=28:x=30:y=30"
                 . ":box=1:boxcolor=black@0.5:boxborderw=10\" "
                 . "-c:v libx264 -c:a aac -pix_fmt yuv420p "
                 . escapeshellarg($outputPath)
                 . " -y 2>&1";
        }

        exec($cmd, $output, $returnCode);
        Log::info("FFmpeg merge output: " . implode("\n", $output));

        if ($returnCode !== 0 || !file_exists($outputPath)) {
            // Simpler fallback merge without text overlay
            $cmd = "{$ff} "
                 . "-stream_loop -1 -i " . escapeshellarg($videoPath) . " "
                 . "-i " . escapeshellarg($audioPath) . " "
                 . "-shortest -c:v libx264 -c:a aac -pix_fmt yuv420p "
                 . escapeshellarg($outputPath)
                 . " -y 2>&1";
            exec($cmd, $output, $returnCode);
            Log::info("FFmpeg fallback merge: " . implode("\n", $output));
        }

        if (!file_exists($outputPath)) {
            throw new \Exception("FFmpeg failed to merge scene {$sceneIndex}. Output: " . implode("\n", $output));
        }

        return $outputPath;
    }

    public function stitchScenes(array $scenePaths, string $jobId): string
    {
        $outputDir    = storage_path("app/public/videos/{$jobId}");
        $outputPath   = "{$outputDir}/final.mp4";
        $fileListPath = "{$outputDir}/filelist.txt";

        $fileListContent = '';
        foreach ($scenePaths as $path) {
            if (file_exists($path)) {
                // ✅ Windows paths need forward slashes in ffmpeg filelist
                $normalizedPath = str_replace('\\', '/', $path);
                $fileListContent .= "file '{$normalizedPath}'\n";
            }
        }
        file_put_contents($fileListPath, $fileListContent);

        $ff = "\"{$this->ffmpeg}\"";

        $cmd = "{$ff} -f concat -safe 0 "
             . "-i " . escapeshellarg($fileListPath) . " "
             . "-c:v libx264 -c:a aac -pix_fmt yuv420p "
             . "-movflags +faststart "
             . escapeshellarg($outputPath)
             . " -y 2>&1";

        exec($cmd, $output, $returnCode);
        Log::info("FFmpeg stitch output: " . implode("\n", $output));

        if (!file_exists($outputPath)) {
            throw new \Exception("FFmpeg failed to stitch final video. Output: " . implode("\n", $output));
        }

        unlink($fileListPath);

        return $outputPath;
    }

    public function getVideoDuration(string $filePath): float
    {
        // ✅ Use full ffprobe path
        $ffprobe = "\"{$this->ffprobe}\"";
        $cmd     = "{$ffprobe} -v error -show_entries format=duration "
                 . "-of default=noprint_wrappers=1:nokey=1 "
                 . escapeshellarg($filePath);
        $output  = shell_exec($cmd);
        return (float) trim($output ?: '5');
    }

    public function getAudioDuration(string $filePath): float
    {
        return $this->getVideoDuration($filePath);
    }

    private function addTitleCard(string $outputDir, string $jobId): void
    {
        $titlePath = "{$outputDir}/title_card.mp4";
        $ff        = "\"{$this->ffmpeg}\"";

        $cmd = "{$ff} -f lavfi "
             . "-i \"color=c=0x0f0f1a:size=1280x720:duration=3:rate=30\" "
             . "-vf \"drawtext=text='AI Generated Video'"
             . ":fontcolor=white:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2,"
             . "drawtext=text='Powered by AI Video Studio'"
             . ":fontcolor=0xaaaaaa:fontsize=24:x=(w-text_w)/2:y=(h+60)/2\" "
             . "-c:v libx264 -pix_fmt yuv420p "
             . escapeshellarg($titlePath)
             . " -y 2>&1";

        exec($cmd);
    }
}