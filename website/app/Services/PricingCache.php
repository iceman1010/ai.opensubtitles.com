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
        $this->ensureFresh();
        if (!is_file($this->file)) {
            return [];
        }
        $data = json_decode((string) file_get_contents($this->file), true);
        $services = is_array($data['services'] ?? null) ? $data['services'] : [];
        $rate = (float) $this->f3->get('APP.credit_usd_rate');
        foreach ($services as $group => &$list) {
            if (!is_array($list)) {
                continue;
            }
            foreach ($list as &$svc) {
                if (is_array($svc) && isset($svc['price'])) {
                    $raw = (float) $svc['price'];
                    $svc['price'] = self::formatPrice($raw);
                    $units = $group === 'Transcription' ? 60 : 1000;
                    $svc['price_usd'] = self::formatPrice($raw * $units * $rate);
                }
            }
            unset($svc);
        }
        unset($list);
        return $services;
    }

    public function packages(): array
    {
        $this->ensureFresh();
        if (!is_file($this->file)) {
            return [];
        }
        $data = json_decode((string) file_get_contents($this->file), true);
        $packages = is_array($data['packages'] ?? null) ? $data['packages'] : [];
        return array_values(array_filter($packages, 'is_array'));
    }

    private function ensureFresh(): void
    {
        $stale = !is_file($this->file) || $this->age() >= (int) $this->f3->get('APP.pricing_cache_ttl');
        if (!$stale && is_file($this->file)) {
            $data = json_decode((string) file_get_contents($this->file), true);
            $stale = !array_key_exists('packages', $data);
        }
        if ($stale) {
            $this->refresh();
        }
    }

    private static function formatPrice(float $price): string
    {
        return rtrim(rtrim(number_format($price, 5, '.', ''), '0'), '.');
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
        $services = $decoded['data'];

        $packages = [];
        $ch = curl_init($base . '/ai/info/credits');
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $body = curl_exec($ch);
        curl_close($ch);

        $decoded = json_decode((string) $body, true);
        if (is_array($decoded['data'] ?? null)) {
            $packages = $decoded['data'];
        }

        file_put_contents(
            $this->file,
            json_encode(['fetched_at' => time(), 'services' => $services, 'packages' => $packages], JSON_PRETTY_PRINT),
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
