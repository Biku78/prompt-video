<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Note extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'content',
        'tag',
        'difficulty',
        'revision',
        'pinned',
        'word_count',
        'revisions',
    ];

    protected $casts = [
        'revision'  => 'boolean',
        'pinned'    => 'boolean',
        'revisions' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeOrdered($query)
    {
        return $query->orderByDesc('pinned')->orderByDesc('updated_at');
    }
    public function toFrontend(): array
    {
        return [
            'id'         => (string) $this->id,
            'title'      => $this->title,
            'content'    => $this->content,
            'tag'        => $this->tag,
            'difficulty' => $this->difficulty,
            'revision'   => $this->revision,
            'pinned'     => $this->pinned,
            'wordCount'  => $this->word_count,
            'revisions'  => $this->revisions ?? [],
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
