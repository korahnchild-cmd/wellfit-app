# rollback.ps1 — 30초 롤백.
# 사용법:  .\rollback.ps1            (배포본만 되감기, 가장 빠름)
#          .\rollback.ps1 -Full      (master도 v1 태그로 되돌림)
param([switch]$Full)

$ErrorActionPreference = 'Stop'
Write-Host "=== 웰핏+ 롤백 ===" -ForegroundColor Cyan

# 1) 가장 빠른 길: gh-pages 브랜치를 직전 배포 커밋으로 되감기 (재빌드 없음, 약 30초)
Write-Host "`n[1] gh-pages 되감기" -ForegroundColor Yellow
git fetch origin gh-pages
git log --oneline origin/gh-pages -5
$sha = Read-Host "되돌릴 gh-pages 커밋 SHA (건너뛰려면 Enter)"
if ($sha) {
  git push origin "$($sha):gh-pages" --force
  Write-Host "  gh-pages 되감기 완료. 1~2분 뒤 라이브 반영" -ForegroundColor Green
}

# 2) 소스도 되돌릴 경우
if ($Full) {
  Write-Host "`n[2] master 되돌리기" -ForegroundColor Yellow
  git fetch origin --tags
  git switch master
  git reset --hard v1-before-redesign
  git push origin master --force-with-lease
  Write-Host "  master를 v1-before-redesign 으로 되돌림 (Actions가 재배포)" -ForegroundColor Green
}

Write-Host "`n[3] 남은 수동 조치" -ForegroundColor Yellow
Write-Host "  · Firestore 콘솔 > config/app  의 theme 를 'v1' 로"
Write-Host "  · Firestore 콘솔 > config/pricing 을 v1 값으로 복구"
Write-Host "  · firestore.rules 를 되돌렸다면: firebase deploy --only firestore:rules"
