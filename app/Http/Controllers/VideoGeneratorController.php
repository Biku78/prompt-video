<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateVideoJob;
use App\Models\VideoJob;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VideoGeneratorController extends Controller
{
    /**
     * Parse the script into scenes
     */
private function parseScript(string $script): array
{
    $scenes = [];
    
    // Split by "Scene" keyword - handles various formats
    $parts = preg_split('/Scene\s+\d+\s*[:\-]/i', $script, -1, PREG_SPLIT_NO_EMPTY);

    foreach ($parts as $index => $part) {
        $part = trim($part);
        if (empty($part)) continue;

        // Extract title (first line until parenthesis or newline)
        preg_match('/^([^\n\(]+)/', $part, $titleMatch);
        $title = isset($titleMatch[1]) ? trim($titleMatch[1]) : "Scene " . ($index + 1);
        
        // Extract timestamps
        $timestamps = '';
        if (preg_match('/\((\d+:\d+\s*[\-–]\s*\d+:\d+)\)/', $part, $match)) {
            $timestamps = $match[1];
        }

        // ✅ FIXED: Extract Hindi Voiceover with proper Unicode handling
        $voiceover = '';
        
        // Try with Unicode quotes (using \x{} syntax which PHP supports)
        if (preg_match('/Hindi\s+Voiceover\s*:\s*["\x{201C}\x{201D}](.+?)["\x{201C}\x{201D}]/su', $part, $match)) {
            $voiceover = trim($match[1]);
        } 
        // Fallback: extract everything after "Hindi Voiceover:" until "Visual Prompt"
        elseif (preg_match('/Hindi\s+Voiceover\s*:\s*(.+?)(?=Visual\s+Prompt|Scene\s+\d+|$)/siu', $part, $match)) {
            $voiceover = trim($match[1]);
            // Remove all types of quotes from start and end
            $voiceover = preg_replace('/^["\x{201C}\x{201D}]+|["\x{201C}\x{201D}]+$/u', '', $voiceover);
            $voiceover = trim($voiceover);
        }

        // Extract Visual Prompt
        $visualPrompt = '';
        if (preg_match('/Visual\s+Prompt.*?:\s*(.+?)(?=Scene\s+\d+|$)/siu', $part, $match)) {
            $visualPrompt = trim($match[1]);
            // Remove "(Paste into Luma/Kling):" type instructions
            $visualPrompt = preg_replace('/\([^)]*Luma[^)]*\)\s*:?\s*/i', '', $visualPrompt);
            $visualPrompt = trim($visualPrompt);
        }

        if (!empty($voiceover) || !empty($visualPrompt)) {
            $scenes[] = [
                'index'        => $index + 1,
                'title'        => $title,
                'timestamps'   => $timestamps,
                'voiceover'    => $voiceover,
                'visualPrompt' => $visualPrompt,
            ];
        }
    }

    return $scenes;
}

    /**
     * Start video generation
     */
    public function generate(Request $request)
    {
        $request->validate([
            'script' => 'required|string|min:50',
            'language' => 'nullable|string|in:hi,en',
        ]);

        $script   = $request->input('script');
        $language = $request->input('language', 'hi');
        $scenes   = $this->parseScript($script);

        if (empty($scenes)) {
            return response()->json([
                'success' => false,
                'message' => 'Could not parse any scenes from your script. Please use the Scene 1:, Scene 2: format.',
            ], 422);
        }

        // Create job record
        $jobId = Str::uuid()->toString();
        $videoJob = VideoJob::create([
            'job_id'      => $jobId,
            'status'      => 'pending',
            'scenes_total' => count($scenes),
            'scenes_done'  => 0,
            'script'      => $script,
            'scenes_data' => json_encode($scenes),
            'language'    => $language,
        ]);

        // Dispatch background job
        GenerateVideoJob::dispatch($videoJob)->onQueue('video-generation');

        return response()->json([
            'success'      => true,
            'job_id'       => $jobId,
            'scenes_found' => count($scenes),
            'scenes'       => array_map(fn($s) => [
                'index' => $s['index'],
                'title' => $s['title'],
                'timestamps' => $s['timestamps'],
            ], $scenes),
            'message'      => 'Video generation started! ' . count($scenes) . ' scenes detected.',
            'estimated_time' => (count($scenes) * 5) . ' minutes',
        ]);
    }

    /**
     * Check job status
     */
    public function status(string $jobId)
    {
        $job = VideoJob::where('job_id', $jobId)->first();

        if (!$job) {
            return response()->json(['success' => false, 'message' => 'Job not found'], 404);
        }

        $response = [
            'success'      => true,
            'job_id'       => $job->job_id,
            'status'       => $job->status,
            'scenes_total' => $job->scenes_total,
            'scenes_done'  => $job->scenes_done,
            'progress'     => $job->scenes_total > 0
                ? round(($job->scenes_done / $job->scenes_total) * 100)
                : 0,
            'current_step' => $job->current_step,
            'created_at'   => $job->created_at,
            'updated_at'   => $job->updated_at,
        ];

        if ($job->status === 'completed') {
            $response['video_url']  = $job->final_video_url;
            $response['audio_url']  = $job->final_audio_url;
            $response['duration']   = $job->duration;
        }

        if ($job->status === 'failed') {
            $response['error'] = $job->error_message;
        }

        return response()->json($response);
    }

    /**
     * List all videos
     */
    public function list()
    {
        $videos = VideoJob::where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get(['job_id', 'status', 'scenes_total', 'final_video_url', 'duration', 'created_at']);

        return response()->json(['success' => true, 'videos' => $videos]);
    }

    /**
     * Delete a video job
     */
    public function delete(string $id)
    {
        $job = VideoJob::where('job_id', $id)->first();
        if ($job) {
            // Delete files
            if ($job->final_video_url && file_exists(public_path($job->final_video_url))) {
                unlink(public_path($job->final_video_url));
            }
            $job->delete();
        }
        return response()->json(['success' => true]);
    }
}
