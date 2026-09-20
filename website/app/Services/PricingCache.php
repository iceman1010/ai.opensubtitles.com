<?php

namespace Services;

class PricingCache
{
    private string $file;

    public function __construct(private \Base $f3)
    {
        $this->file = $f3->get('APP.cache_dir') . '/pricing.json';
    }

    public function get(): array
    {
        if (!is_file($this->file) || $this->age() >= (int) $this->f3->get('APP.pricing_cache_ttl')) {
            $this->refresh();
        }
        if (!is_file($this->file)) {
            return [];
        }
        $data = json_decode((string) file_get_contents($this->file), true);
        return is_array($data['services'] ?? null) ? $data['services'] : [];
    }

    public function refresh(): void
    {
        $base = rtrim((string) $this->f3->get('APP.api_base_server'), '/');
        if ($base === '') {
            return;
        }

        $ch = curl_init($base . '/ai/info/services');
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Api-Key: ' . $this->f3->get('APP.api_key'),
                'User-Agent: ' . $this->f3->get('APP.user_agent'),
                'X-User-Agent: ' . $this->f3->get('APP.user_agent'),
            ],
        ]);
        $body = curl_exec($ch);
        curl_close($ch);

        $decoded = json_decode((string) $body, true);
        if (!is_array($decoded['data'] ?? null)) {
            return;
        }

        file_put_contents(
            $this->file,
            json_encode(['fetched_at' => time(), 'services' => $decoded['data']], JSON_PRETTY_PRINT),
            LOCK_EX
        );
    }

    private function age(): int
    {
        if (!is_file($this->file)) {
            return PHP_INT_MAX;
        }
        $data = json_decode((string) file_get_contents($this->file), true);
        return time() - (int) ($data['fetched_at'] ?? 0);
    }
}
