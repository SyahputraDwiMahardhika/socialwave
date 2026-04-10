<?php

namespace App\Services;

/**
 * ContentModerationService
 *
 * Provides automatic post-publication content moderation.
 * Detects predefined bad words / negative keywords in user content.
 *
 * NEW FLOW (v2):
 *  - All content is published immediately with status = "approved"
 *  - If bad words are detected, is_flagged is set to true
 *  - Content remains visible; admin reviews flagged content and may reject it
 *  - "pending" status is no longer used
 */
class ContentModerationService
{
    /**
     * Predefined list of bad words / negative keywords.
     * Case-insensitive. Extend this list as needed.
     *
     * @var array<string>
     */
    protected array $badWords = [
        'bodoh',
        'anjing',
        'goblok',
        'bangsat',
        'tolol',
        'hate',
        'kill',
        'stupid',
        'idiot',
        'bastard',
        'racist',
        'terror',
        'violence',
    ];

    /**
     * Analyse text content for negative keywords.
     *
     * Returns an array with:
     *  - is_flagged (bool)  : true if bad words were detected
     *  - detected (array)   : list of bad words found (for logging/audit)
     *
     * NOTE: status is always "approved" — flagging does not block publication.
     *
     * @param  string  $content
     * @return array{is_flagged: bool, detected: array}
     */
    public function analyse(string $content): array
    {
        $lowerContent = strtolower($content);
        $detected     = [];

        foreach ($this->badWords as $word) {
            if (str_contains($lowerContent, strtolower($word))) {
                $detected[] = $word;
            }
        }

        return [
            'is_flagged' => count($detected) > 0,
            'detected'   => $detected,
        ];
    }

    /**
     * Quick boolean check: does the text contain any bad words?
     *
     * @param  string  $content
     * @return bool
     */
    public function containsBadWords(string $content): bool
    {
        return $this->analyse($content)['is_flagged'];
    }
}
