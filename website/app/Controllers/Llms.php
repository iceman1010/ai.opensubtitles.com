<?php

namespace Controllers;

class Llms
{
    public static function slugs(): array
    {
        return ['index', 'transcribe', 'translate', 'faq', 'pricing', 'support', 'api-docs', 'buy', 'search'];
    }

    public function txt(\Base $f3): void
    {
        $this->send(self::file('llms.txt'));
    }

    public function full(\Base $f3): void
    {
        $parts = [];
        foreach (self::slugs() as $slug) {
            $parts[] = $this->source($f3, $slug);
        }
        $this->send(implode("\n\n---\n\n", $parts) . "\n", 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600');
    }

    public function serve(\Base $f3, string $slug): void
    {
        if (!in_array($slug, self::slugs(), true)) {
            $f3->error(404);
            return;
        }
        $this->send(
            $this->source($f3, $slug),
            $slug === 'pricing'
                ? 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600'
                : 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
        );
    }

    private function source(\Base $f3, string $slug): string
    {
        if ($slug === 'pricing') {
            return $this->pricing($f3);
        }
        if ($slug === 'api-docs') {
            $path = dirname(__DIR__, 2) . '/ui/md/API-REFERENCE.md';
            return is_file($path) ? (string) file_get_contents($path) : '';
        }
        $md = self::file($slug . '.md');
        if ($slug === 'search') {
            $md = str_replace(
                ['{API_BASE_URL}', '{API_KEY}'],
                [rtrim((string) $f3->get('APP.api_base_server'), '/'), (string) $f3->get('APP.api_key')],
                $md
            );
        }
        return $md;
    }

    private function pricing(\Base $f3): string
    {
        $cache = new \Services\PricingCache($f3);
        $services = $cache->get();
        $packages = $cache->packages();

        $out = "# Pricing\n\n> Pay-as-you-go prices for AI subtitle transcription and translation — the same prices on the website and in all apps. Prices below are in credits; 1 credit is the smallest billing unit and totals are rounded up.\n";

        $sections = [
            'Transcription' => ['unit' => 'credits / second of audio', 'usd' => '≈ USD / minute'],
            'Translation' => ['unit' => 'credits / character', 'usd' => '≈ USD / 1,000 characters'],
        ];
        foreach ($sections as $group => $meta) {
            $list = $services[$group] ?? [];
            if (!$list) {
                continue;
            }
            $out .= "\n## {$group}\n\n";
            $out .= "Price unit: {$meta['unit']}.\n\n";
            $out .= "| Model | Credits | {$meta['usd']} | Languages | Notes |\n";
            $out .= "|---|---|---|---|---|\n";
            foreach ($list as $svc) {
                $name = (string) ($svc['display_name'] ?? $svc['name'] ?? '');
                $price = (string) ($svc['price'] ?? '');
                $usd = (string) ($svc['price_usd'] ?? '');
                $langs = count((array) ($svc['languages_supported'] ?? []));
                $notes = trim((string) ($svc['description'] ?? ''));
                $out .= "| {$name} | {$price} | \${$usd} | {$langs} | {$notes} |\n";
            }
        }

        if ($packages) {
            $out .= "\n## Credit packages\n\nCredits never expire — you only pay for what you use.\n\n";
            $out .= "| Package | Credits | Bonus |\n|---|---|---|\n";
            foreach ($packages as $pkg) {
                $name = (string) ($pkg['name'] ?? '');
                $value = (string) ($pkg['value'] ?? '');
                $bonus = (int) ($pkg['discount_percent'] ?? 0) > 0 ? '+' . $pkg['discount_percent'] . '%' : '';
                $out .= "| {$name} | {$value} | {$bonus} |\n";
            }
        }

        $out .= "\nFailed jobs are never charged: every transcription and translation passes an automatic quality check, and failed translations are delivered anyway and refunded automatically.\n";

        if (!$services) {
            $out = "# Pricing\n\nPrices are being loaded — check back shortly.\n";
        }

        return $out . "\n";
    }

    private static function file(string $name): string
    {
        $path = dirname(__DIR__, 2) . '/ui/md/' . $name;
        return is_file($path) ? (string) file_get_contents($path) : '';
    }

    private function send(string $body, string $cache = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'): void
    {
        header('Content-Type: text/markdown; charset=utf-8');
        header('X-Robots-Tag: noindex');
        header('Cache-Control: ' . $cache);
        echo $body;
    }
}
