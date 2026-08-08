# -*- coding: utf-8 -*-
import re, os

files = [
    r'e:\INTERNSHIP-JUNTOAUG2026\clone\admin\dashboard.html',
    r'e:\INTERNSHIP-JUNTOAUG2026\clone\manager\dashboard.html',
    r'e:\INTERNSHIP-JUNTOAUG2026\clone\employee\dashboard.html',
    r'e:\INTERNSHIP-JUNTOAUG2026\clone\student\dashboard.html',
    r'e:\INTERNSHIP-JUNTOAUG2026\clone\index.html',
]

NEW_TASK_SECTION = '''        <!-- Tasks Page -->
        <div class="page" id="page-tasks">
          <div class="page-header">
            <div><h1 data-i18n="tasks.title">Tasks</h1><p class="page-subtitle" data-i18n="tasks.subtitle">8 open &middot; 3 completed today</p></div>
            <button class="btn btn-primary" data-i18n="tasks.newTask">+ New Task</button>
          </div>
          <div class="card">
            <div class="task-list">
              <div class="task-item"><input type="checkbox" /><div class="task-info"><div class="task-title" data-i18n="tasks.task1.title">Collect pending fees from Vihaan Verma</div><div class="task-meta" data-i18n="tasks.task1.meta">Due today &middot; Assigned to Shreya</div></div><span class="badge badge-overdue" data-i18n="tasks.priority.urgent">Urgent</span></div>
              <div class="task-item"><input type="checkbox" /><div class="task-info"><div class="task-title" data-i18n="tasks.task2.title">Send renewal reminder to 5 students</div><div class="task-meta" data-i18n="tasks.task2.meta">Due Jul 22 &middot; Assigned to Maya</div></div><span class="badge badge-pending" data-i18n="tasks.priority.medium">Medium</span></div>
              <div class="task-item"><input type="checkbox" /><div class="task-info"><div class="task-title" data-i18n="tasks.task3.title">Check AC unit on Floor 1</div><div class="task-meta" data-i18n="tasks.task3.meta">Due Jul 23 &middot; Assigned to Karan</div></div><span class="badge badge-pending" data-i18n="tasks.priority.low">Low</span></div>
              <div class="task-item"><input type="checkbox" checked /><div class="task-info done"><div class="task-title" data-i18n="tasks.task4.title">Update seat map for Floor 2</div><div class="task-meta" data-i18n="tasks.task4.meta">Completed today &middot; Ravi</div></div><span class="badge badge-paid" data-i18n="tasks.priority.done">Done</span></div>
              <div class="task-item"><input type="checkbox" checked /><div class="task-info done"><div class="task-title" data-i18n="tasks.task5.title">Verify Navya Singh&#39;s Aadhaar</div><div class="task-meta" data-i18n="tasks.task5.meta">Completed today &middot; Shreya</div></div><span class="badge badge-paid" data-i18n="tasks.priority.done">Done</span></div>
              <div class="task-item"><input type="checkbox" /><div class="task-info"><div class="task-title" data-i18n="tasks.task6.title">Purchase new whiteboard markers</div><div class="task-meta" data-i18n="tasks.task6.meta">Due Jul 25 &middot; Assigned to Maya</div></div><span class="badge badge-pending" data-i18n="tasks.priority.low">Low</span></div>
            </div>
          </div>
        </div>'''

pattern = r'<!-- Tasks Page -->.*?<div class="page" id="page-tasks">.*?</div>\s*</div>\s*</div>'

for fpath in files:
    if not os.path.exists(fpath):
        print(f'SKIP: {fpath}')
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = re.sub(pattern, NEW_TASK_SECTION, content, flags=re.DOTALL)
    if new_content == content:
        print(f'NO MATCH: {fpath}')
    else:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated: {fpath}')

print('Done!')
