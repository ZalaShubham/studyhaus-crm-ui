# -*- coding: utf-8 -*-
import os

files = [
    r'e:\INTERNSHIP-JUNTOAUG2026\clone\admin\dashboard.html',
    r'e:\INTERNSHIP-JUNTOAUG2026\clone\manager\dashboard.html',
    r'e:\INTERNSHIP-JUNTOAUG2026\clone\employee\dashboard.html',
    r'e:\INTERNSHIP-JUNTOAUG2026\clone\student\dashboard.html',
    r'e:\INTERNSHIP-JUNTOAUG2026\clone\index.html',
]

replacements = [
    # Page heading & subtitle
    ('<h1>Tasks</h1>', '<h1>કાર્યો</h1>'),
    ('8 open · 3 completed today', '8 ખુલ્લા · આજે 3 પૂર્ણ'),
    # New Task button
    ('+ New Task', '+ નવું કાર્ય'),
    # Task 1
    ('Collect pending fees from Vihaan Verma', 'વિહાન વર્મા પાસેથી બાકી ફી એકત્ર કરો'),
    ('Due today · Assigned to Shreya', 'આજે મુદત · શ્રેયાને સોંપેલ'),
    ('>Urgent<', '>તાકીદી<'),
    # Task 2
    ('Send renewal reminder to 5 students', '5 વિદ્યાર્થીઓને નવીકરણ રીમાઇન્ડર મોકલો'),
    ('Due Jul 22 · Assigned to Maya', 'મુદત જુલ 22 · માયાને સોંપેલ'),
    ('>Medium<', '>મધ્યમ<'),
    # Task 3
    ('Check AC unit on Floor 1', 'ફ્લોર 1 પર AC યુનિટ તપાસો'),
    ('Due Jul 23 · Assigned to Karan', 'મુદત જુલ 23 · કરણને સોંપેલ'),
    ('>Low<', '>નીચું<'),
    # Task 4
    ('Update seat map for Floor 2', 'ફ્લોર 2 માટે સીટ મેપ અપડેટ કરો'),
    ('Completed today · Ravi', 'આજે પૂર્ણ · રવિ'),
    ('>Done<', '>પૂર્ણ<'),
    # Task 5
    ("Verify Navya Singh's Aadhaar", 'નવ્યા સિંઘનો આધાર વેરિફાઈ કરો'),
    ('Completed today · Shreya', 'આજે પૂર્ણ · શ્રેયા'),
    # Task 6
    ('Purchase new whiteboard markers', 'નવા વ્હાઇટબોર્ડ માર્કર ખરીદો'),
    ('Due Jul 25 · Assigned to Maya', 'મુદત જુલ 25 · માયાને સોંપેલ'),
]

for fpath in files:
    if not os.path.exists(fpath):
        print(f'SKIP (not found): {fpath}')
        continue
    with open(fpath, 'r', encoding='utf-8') as fh:
        content = fh.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(fpath, 'w', encoding='utf-8') as fh:
        fh.write(content)
    print(f'Updated: {fpath}')

print('\nAll task pages updated to Gujarati successfully!')
