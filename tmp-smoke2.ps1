$ErrorActionPreference = "Stop"
$base = "http://localhost:3005"

function Has($hay, $needle) { return ($hay -match [regex]::Escape($needle)) }

# 1. Home / subjects page: hero CTAs removed, subject grid intact.
$homePage = (Invoke-WebRequest -Uri "$base/" -UseBasicParsing).Content
Write-Output "HOME_browse_absent       : $(-not (Has $homePage 'Browse subjects'))"
Write-Output "HOME_startwith_absent    : $(-not (Has $homePage 'Start with'))"
Write-Output "HOME_hashsubjects_absent : $(-not (Has $homePage 'href="#subjects"'))"
Write-Output "HOME_grid_pst_link       : $(Has $homePage 'href="/pak-studies/notes"')"
Write-Output "HOME_choose_subject       : $(Has $homePage 'Choose a subject')"

# 2. Answer Checker: image/PDF dropzone + OCR removed, text-only input present.
$ac = (Invoke-WebRequest -Uri "$base/pak-studies/answer-checker" -UseBasicParsing).Content
Write-Output "AC_dropzone_absent       : $(-not (Has $ac 'Click to choose, or drag an image here'))"
Write-Output "AC_uploadimage_absent    : $(-not (Has $ac 'Upload image'))"
Write-Output "AC_ocr_absent            : $(-not (Has $ac 'Extract text (OCR)'))"
Write-Output "AC_fileinput_absent      : $(-not (Has $ac 'id="ac-image"'))"
Write-Output "AC_answer_field_present  : $(Has $ac 'id="ac-answer"')"
Write-Output "AC_your_answer_present   : $(Has $ac 'Your answer')"
Write-Output "AC_check_button_present  : $(Has $ac 'Check my answer')"

# 3. Answer Assistant: workspace transfer CTA present (PST + Urdu).
$aa = (Invoke-WebRequest -Uri "$base/pak-studies/answer-assistant" -UseBasicParsing).Content
Write-Output "AA_cta_pst_present       : $(Has $aa 'Check Answer in Answer Checker')"
$au = (Invoke-WebRequest -Uri "$base/urdu/answer-assistant" -UseBasicParsing).Content
Write-Output "AA_cta_urdu_present      : $(Has $au 'Check Answer in Answer Checker')"
