<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title'      => ['required', 'string', 'max:255'],
            'content'    => ['required', 'string'],
            'tag'        => ['required', 'string', 'in:JavaScript,React,CSS,Python,Laravel,AI/ML,Database,DevOps,Design,Math,Other'],
            'difficulty' => ['required', 'string', 'in:Beginner,Intermediate,Advanced'],
            'revision'   => ['boolean'],
            'pinned'     => ['boolean'],
            'wordCount'  => ['integer', 'min:0'],
            'revisions'  => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'      => 'Please enter a title.',
            'content.required'    => 'Content cannot be empty.',
            'tag.in'              => 'Invalid topic tag.',
            'difficulty.in'       => 'Difficulty must be Beginner, Intermediate, or Advanced.',
        ];
    }
}
