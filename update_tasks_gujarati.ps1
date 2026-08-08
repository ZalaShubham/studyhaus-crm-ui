# Update task page text to Gujarati in all dashboard files

$files = @(
  'e:\INTERNSHIP-JUNTOAUG2026\clone\admin\dashboard.html',
  'e:\INTERNSHIP-JUNTOAUG2026\clone\manager\dashboard.html',
  'e:\INTERNSHIP-JUNTOAUG2026\clone\employee\dashboard.html',
  'e:\INTERNSHIP-JUNTOAUG2026\clone\student\dashboard.html',
  'e:\INTERNSHIP-JUNTOAUG2026\clone\index.html'
)

foreach ($file in $files) {
  if (-not (Test-Path $file)) {
    Write-Host "SKIP (not found): $file"
    continue
  }

  $c = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

  # Page title and subtitle
  $c = $c -replace '<h1>Tasks</h1>', '<h1>કાર્યો</h1>'
  $c = $c -replace '8 open · 3 completed today', '8 ખુલ્લા · આજે 3 પૂર્ણ'

  # New Task button
  $c = $c -replace '\+ New Task', '+ નવું કાર્ય'

  # Task 1
  $c = $c -replace 'Collect pending fees from Vihaan Verma', 'વિહાન વર્મા પાસેથી બાકી ફી એકત્ર કરો'
  $c = $c -replace 'Due today · Assigned to Shreya', 'આજે મુદત · શ્રેયાને સોંપેલ'
  $c = $c -replace '>Urgent<', '>તાકીદી<'

  # Task 2
  $c = $c -replace 'Send renewal reminder to 5 students', '5 વિદ્યાર્થીઓને નવીકરણ રીમાઇન્ડર મોકલો'
  $c = $c -replace 'Due Jul 22 · Assigned to Maya', 'મુદત જુલ 22 · માયાને સોંપેલ'
  $c = $c -replace '>Medium<', '>મધ્યમ<'

  # Task 3
  $c = $c -replace 'Check AC unit on Floor 1', 'ફ્લોર 1 પર AC યુનિટ તપાસો'
  $c = $c -replace 'Due Jul 23 · Assigned to Karan', 'મુદત જુલ 23 · કરણને સોંપેલ'
  $c = $c -replace '>Low<', '>નીચું<'

  # Task 4
  $c = $c -replace 'Update seat map for Floor 2', 'ફ્લોર 2 માટે સીટ મેપ અપડેટ કરો'
  $c = $c -replace 'Completed today · Ravi', 'આજે પૂર્ણ · રવિ'
  $c = $c -replace '>Done<', '>પૂર્ણ<'

  # Task 5
  $c = $c -replace "Verify Navya Singh's Aadhaar", 'નવ્યા સિંઘનો આધાર વેરિફાઈ કરો'
  $c = $c -replace 'Completed today · Shreya', 'આજે પૂર્ણ · શ્રેયા'

  # Task 6
  $c = $c -replace 'Purchase new whiteboard markers', 'નવા વ્હાઇટબોર્ડ માર્કર ખરીદો'
  $c = $c -replace 'Due Jul 25 · Assigned to Maya', 'મુદત જુલ 25 · માયાને સોંપેલ'

  [System.IO.File]::WriteAllText($file, $c, [System.Text.Encoding]::UTF8)
  Write-Host "Updated: $file"
}

Write-Host ""
Write-Host "All task pages updated to Gujarati successfully!"
