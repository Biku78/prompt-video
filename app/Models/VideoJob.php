<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VideoJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_id',
        'status',
        'scenes_total',
        'scenes_done',
        'script',
        'scenes_data',
        'language',
        'current_step',
        'final_video_url',
        'final_audio_url',
        'duration',
        'error_message',
    ];

    protected $casts = [
        'scenes_total' => 'integer',
        'scenes_done'  => 'integer',
        'scenes_data'  => 'array',
    ];
}
