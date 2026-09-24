<?php

namespace Controllers;

class Tools extends Base
{
    public function index(\Base $f3): void
    {
        \Services\Locale::apply($f3);

        $f3->set('page_title', $f3->get('tools.title'));
        $f3->set('page_description', $f3->get('tools.meta_description'));

        $f3->set('tools_error', false);
        $f3->set('tools_sections', $this->sections($f3));

        $this->render($f3, 'tools.html', '/tools');
    }

    private function sections(\Base $f3): array
    {
        $file = dirname(__DIR__) . '/tools.json';
        $raw = is_file($file) ? file_get_contents($file) : '';
        $data = json_decode($raw, true);
        if (!is_array($data) || !is_array($data['categories'] ?? null) || !is_array($data['tools'] ?? null)) {
            $f3->set('tools_error', true);
            return [];
        }

        $byCategory = [];
        foreach ($data['tools'] as $tool) {
            if (!is_array($tool) || ($tool['published'] ?? false) !== true) {
                continue;
            }
            $category = is_string($tool['category'] ?? null) ? $tool['category'] : '';
            $byCategory[$category][] = [
                'name' => $this->phrase($f3, is_string($tool['name_key'] ?? null) ? $tool['name_key'] : ''),
                'desc' => $this->phrase($f3, is_string($tool['desc_key'] ?? null) ? $tool['desc_key'] : ''),
                'badge' => is_string($tool['badge_key'] ?? null) ? $this->phrase($f3, $tool['badge_key']) : '',
                'github' => is_string($tool['github'] ?? null) ? $tool['github'] : '',
                'website' => is_string($tool['website'] ?? null) ? $tool['website'] : '',
            ];
        }

        $sections = [];
        foreach ($data['categories'] as $category) {
            if (!is_array($category)) {
                continue;
            }
            $id = is_string($category['id'] ?? null) ? $category['id'] : '';
            if ($id === '' || !isset($byCategory[$id])) {
                continue;
            }
            $sections[] = [
                'id' => $id,
                'label' => $this->phrase($f3, is_string($category['label_key'] ?? null) ? $category['label_key'] : ''),
                'tools' => $byCategory[$id],
            ];
        }
        return $sections;
    }

    private function phrase(\Base $f3, string $key): string
    {
        if ($key === '') {
            return '';
        }
        $value = $f3->get($key);
        return is_string($value) ? $value : '';
    }
}
