<?php

namespace Controllers;

class Job extends Base
{
    public function create(\Base $f3): void
    {
        $f3->set('noindex', true);
        $f3->set('page_title', $f3->get('job.new_title'));
        $f3->set('page_description', '');
        $this->render($f3, 'new.html', '/new');
    }

    public function index(\Base $f3): void
    {
        $f3->set('noindex', true);
        $f3->set('page_title', $f3->get('job.list_title'));
        $f3->set('page_description', '');
        $this->render($f3, 'jobs.html', '/jobs');
    }

    public function show(\Base $f3): void
    {
        $type = $f3->get('PARAMS.type');
        if (!in_array($type, ['transcribe', 'translate'], true)) {
            $f3->error(404);
            return;
        }
        $f3->set('noindex', true);
        $f3->set('job_type', $type);
        $f3->set('job_id', $f3->get('PARAMS.id'));
        $f3->set('page_title', $f3->get('job.status_title'));
        $f3->set('page_description', '');
        $this->render($f3, 'job.html', '/jobs');
    }
}
