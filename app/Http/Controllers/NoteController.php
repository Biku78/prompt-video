<?php

namespace App\Http\Controllers;

use App\Http\Requests\NoteRequest;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class NoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notes = Note::where('user_id', auth()->id())
            ->ordered()
            ->get()
            ->map(fn(Note $n) => $n->toFrontend());

        return response()->json([
            'success'   => true,
            'notes'     => $notes,
            'analytics' => $this->buildAnalytics($notes->toArray()),
        ]);
    }

    // ── POST /api/notes ───────────────────────────────────
    public function store(NoteRequest $request): JsonResponse
    {
        $note = Note::create([
            'user_id'    => auth()->id(),
            'title'      => $request->title,
            'content'    => $request->content,
            'tag'        => $request->tag,
            'difficulty' => $request->difficulty,
            'revision'   => $request->boolean('revision'),
            'pinned'     => $request->boolean('pinned'),
            'word_count' => $request->input('wordCount', 0),
            'revisions'  => $request->input('revisions', []),
        ]);

        return response()->json([
            'success' => true,
            'note'    => $note->toFrontend(),
        ], 201);
    }

    // ── PUT /api/notes/{id} ───────────────────────────────
    public function update(NoteRequest $request, string $id): JsonResponse
    {
        $note = Note::where('user_id', auth()->id())->findOrFail($id);

        // Snapshot current version before overwriting
        $snapshot = [
            'title'      => $note->title,
            'content'    => $note->content,
            'saved_at'   => $note->updated_at?->toISOString(),
        ];
        $history = $note->revisions ?? [];
        $history[] = $snapshot;
        // Keep last 20 revision snapshots only
        if (count($history) > 20) {
            $history = array_slice($history, -20);
        }

        $note->update([
            'title'      => $request->title,
            'content'    => $request->content,
            'tag'        => $request->tag,
            'difficulty' => $request->difficulty,
            'revision'   => $request->boolean('revision'),
            'pinned'     => $request->boolean('pinned'),
            'word_count' => $request->input('wordCount', 0),
            'revisions'  => $history,
        ]);

        return response()->json([
            'success' => true,
            'note'    => $note->fresh()->toFrontend(),
        ]);
    }

    // ── DELETE /api/notes/{id} ────────────────────────────
    public function destroy(string $id): JsonResponse
    {
        $note = Note::where('user_id', auth()->id())->findOrFail($id);
        $note->delete();

        return response()->json(['success' => true]);
    }

    // ── PATCH /api/notes/{id}/pin ─────────────────────────
    public function togglePin(string $id): JsonResponse
    {
        $note = Note::where('user_id', auth()->id())->findOrFail($id);
        $note->update(['pinned' => !$note->pinned]);

        return response()->json([
            'success' => true,
            'note'    => $note->fresh()->toFrontend(),
        ]);
    }

    // ── PATCH /api/notes/{id}/revision ───────────────────
    public function toggleRevision(string $id): JsonResponse
    {
        $note = Note::where('user_id', auth()->id())->findOrFail($id);
        $note->update(['revision' => !$note->revision]);

        return response()->json([
            'success' => true,
            'note'    => $note->fresh()->toFrontend(),
        ]);
    }

    // ── GET /api/notes/analytics ──────────────────────────
    // Dedicated analytics endpoint (used by AnalyticsView).
    public function analytics(): JsonResponse
    {
        $notes = Note::where('user_id', auth()->id())
            ->get()
            ->map(fn(Note $n) => $n->toFrontend())
            ->toArray();

        return response()->json([
            'success'   => true,
            'analytics' => $this->buildAnalytics($notes),
        ]);
    }

    // ── Analytics builder ─────────────────────────────────
    // Mirrors every computation in AnalyticsView so the
    // frontend can optionally receive pre-computed data.
    private function buildAnalytics(array $notes): array
    {
        $total     = count($notes);
        $revision  = count(array_filter($notes, fn($n) => $n['revision']));
        $pinned    = count(array_filter($notes, fn($n) => $n['pinned']));
        $totalWords = array_sum(array_column($notes, 'wordCount'));
        $avgWords  = $total ? round($totalWords / $total) : 0;

        // ── Notes per day — last 7 days ───────────────────
        $last7 = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->toDateString();
            $count = count(array_filter(
                $notes,
                fn($n) =>
                isset($n['created_at']) && str_starts_with($n['created_at'], $date)
            ));
            $last7[] = [
                'day'   => Carbon::now()->subDays($i)->format('D'), // Mon, Tue…
                'date'  => $date,
                'count' => $count,
            ];
        }

        // ── Tag distribution ──────────────────────────────
        $tags = ['JavaScript', 'React', 'CSS', 'Python', 'Laravel', 'AI/ML', 'Database', 'DevOps', 'Design', 'Math', 'Other'];
        $tagCounts = [];
        foreach ($tags as $tag) {
            $count = count(array_filter($notes, fn($n) => $n['tag'] === $tag));
            if ($count > 0) {
                $tagCounts[] = ['tag' => $tag, 'count' => $count];
            }
        }
        usort($tagCounts, fn($a, $b) => $b['count'] - $a['count']);

        // ── Difficulty distribution ───────────────────────
        $difficulties = ['Beginner', 'Intermediate', 'Advanced'];
        $diffCounts = [];
        foreach ($difficulties as $d) {
            $diffCounts[] = [
                'd'     => $d,
                'count' => count(array_filter($notes, fn($n) => $n['difficulty'] === $d)),
            ];
        }

        // ── Day streak ────────────────────────────────────
        $streak = 0;
        for ($i = 0; $i < 30; $i++) {
            $date = Carbon::now()->subDays($i)->toDateString();
            $hasNote = count(array_filter(
                $notes,
                fn($n) =>
                isset($n['created_at']) && str_starts_with($n['created_at'], $date)
            )) > 0;
            if ($hasNote) {
                $streak++;
            } else {
                break;
            }
        }

        // ── Activity heatmap — last 28 days ───────────────
        $heatmap = [];
        for ($i = 27; $i >= 0; $i--) {
            $date  = Carbon::now()->subDays($i)->toDateString();
            $count = count(array_filter(
                $notes,
                fn($n) =>
                isset($n['created_at']) && str_starts_with($n['created_at'], $date)
            ));
            $heatmap[] = ['date' => $date, 'count' => $count];
        }

        return [
            'total'      => $total,
            'revision'   => $revision,
            'pinned'     => $pinned,
            'totalWords' => $totalWords,
            'avgWords'   => $avgWords,
            'streak'     => $streak,
            'last7'      => $last7,
            'tagCounts'  => $tagCounts,
            'diffCounts' => $diffCounts,
            'heatmap'    => $heatmap,
        ];
    }
}
