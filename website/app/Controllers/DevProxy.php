<?php

namespace Controllers;

class DevProxy
{
    public function forward(\Base $f3): void
    {
        $upstream = rtrim((string) $f3->get('APP.dev_proxy_upstream'), '/');
        if ($upstream === '') {
            $f3->error(404);
            return;
        }

        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/');
        $path = $uri['path'] ?? '/';
        $query = isset($uri['query']) ? '?' . $uri['query'] : '';
        $target = $upstream . $path . $query;

        $forwardHeaders = [];
        $isMultipart = false;
        foreach (['Api-Key', 'Authorization', 'Content-Type', 'Accept', 'User-Agent', 'X-User-Agent'] as $name) {
            $value = $_SERVER['HTTP_' . strtoupper(str_replace('-', '_', $name))] ?? null;
            if ($value !== null) {
                if ($name === 'Content-Type' && stripos($value, 'multipart/form-data') !== false) {
                    $isMultipart = true;
                    continue;
                }
                $forwardHeaders[] = $name . ': ' . $value;
            }
        }

        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $body = null;

        if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
            if ($isMultipart) {
                $boundary = '----aiosproxy' . bin2hex(random_bytes(8));
                $body = '';
                foreach ($_POST as $name => $value) {
                    $body .= "--" . $boundary . "\r\n"
                        . 'Content-Disposition: form-data; name="' . $name . "\"\r\n\r\n"
                        . $value . "\r\n";
                }
                foreach ($_FILES as $name => $file) {
                    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                        continue;
                    }
                    $filename = str_replace('"', '\\"', (string) $file['name']);
                    $body .= "--" . $boundary . "\r\n"
                        . 'Content-Disposition: form-data; name="' . $name . '"; filename="' . $filename . "\"\r\n"
                        . 'Content-Type: ' . ($file['type'] ?: 'application/octet-stream') . "\r\n\r\n"
                        . (string) file_get_contents((string) $file['tmp_name']) . "\r\n";
                }
                $body .= "--" . $boundary . "--\r\n";
                $forwardHeaders[] = 'Content-Type: multipart/form-data; boundary=' . $boundary;
            } else {
                $body = file_get_contents('php://input');
            }
        }

        $ch = curl_init($target);
        $headers = [];
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => false,
            CURLOPT_HEADERFUNCTION => function ($ch, $line) use (&$headers) {
                $trimmed = trim($line);
                if ($trimmed !== '' && !preg_match('#^(HTTP/|Transfer-Encoding:|Content-Length:)#i', $trimmed)) {
                    $headers[] = $trimmed;
                }
                return strlen($line);
            },
            CURLOPT_TIMEOUT => 300,
            CURLOPT_HTTPHEADER => $forwardHeaders,
        ]);
        if ($body !== null && $body !== '') {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $responseBody = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);

        if ($contentType) {
            header('Content-Type: ' . $contentType);
        }
        http_response_code($status ?: 502);
        echo $responseBody !== false ? $responseBody : '';
    }
}
