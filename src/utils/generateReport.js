// src/utils/generateReport.js

function getRiskColor(value) {
  if (value < 30) return { color: '#4CAF7D', bg: '#E8F5E9', label: '양호', dot: '#4CAF7D' };
  if (value < 60) return { color: '#E8A038', bg: '#FFF3E0', label: '주의', dot: '#E8A038' };
  return { color: '#D4504A', bg: '#FFEBEE', label: '위험', dot: '#D4504A' };
}

function getHormoneRows(hormones, gender) {
  if (gender === 'male') {
    return [
      {
        name: '테스토스테론 저하 위험도',
        sub: '남성 호르몬 (기준 ng/dL)',
        value: hormones.testosterone ?? 0,
        comment: hormones.testosteroneComment ?? '',
      },
      {
        name: '코르티솔 과다 위험도',
        sub: '스트레스 호르몬 (기준 μg/dL)',
        value: hormones.cortisol ?? 0,
        comment: hormones.cortisolComment ?? '',
      },
    ];
  }
  return [
    {
      name: '에스트로겐 저하 위험도',
      sub: '여성 호르몬 (기준 pg/mL)',
      value: hormones.estrogen ?? 0,
      comment: hormones.estrogenComment ?? '',
    },
    {
      name: '코르티솔 과다 위험도',
      sub: '스트레스 호르몬 (기준 μg/dL)',
      value: hormones.cortisol ?? 0,
      comment: hormones.cortisolComment ?? '',
    },
  ];
}

function getNutrientRows(nutrients, gender) {
  if (gender === 'male') {
    return [
      { icon: '☀️', name: '비타민 D', value: nutrients.vitaminD ?? 0, comment: nutrients.vitaminDComment ?? '' },
      { icon: '🌿', name: '아연 (Zinc)', value: nutrients.zinc ?? 0, comment: nutrients.zincComment ?? '' },
      { icon: '💪', name: '마그네슘', value: nutrients.magnesium ?? 0, comment: nutrients.magnesiumComment ?? '' },
    ];
  }
  return [
    { icon: '☀️', name: '비타민 D', value: nutrients.vitaminD ?? 0, comment: nutrients.vitaminDComment ?? '' },
    { icon: '🩸', name: '철분 (Iron)', value: nutrients.iron ?? 0, comment: nutrients.ironComment ?? '' },
    { icon: '🌿', name: '아연 (Zinc)', value: nutrients.zinc ?? 0, comment: nutrients.zincComment ?? '' },
  ];
}

function getCatTag(category) {
  const map = {
    '영양': 'tag-supp', '수면': 'tag-rest', '운동': 'tag-move',
    '마음': 'tag-rest', '생활': 'tag-diet', '휴식': 'tag-rest', '점검': 'tag-supp',
  };
  return map[category] || 'tag-supp';
}

export function generateReportHTML({ report, actualAge, gender, userName, userCity, shareId, shareUrl }) {
  const isMale = gender === 'male';
  const genderLabel = isMale ? '남성' : '여성';
  const avatar = isMale ? '👨' : '🌸';
  const ageDiff = parseInt(actualAge) - report.healthAge;
  const ageDiffLabel = ageDiff > 0
    ? `✓ &nbsp;−${ageDiff}세 더 젊음`
    : ageDiff < 0
    ? `⚠ &nbsp;+${Math.abs(ageDiff)}세 높음`
    : '실제 나이와 동일';
  const ageDiffColor = ageDiff > 0 ? '#4CAF7D' : ageDiff < 0 ? '#D4504A' : '#888';
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const todayShort = new Date().toLocaleDateString('ko-KR').replace(/\. /g, '.').replace('.', '');

  const hormoneRows = getHormoneRows(report.hormones || {}, gender);
  const nutrientRows = getNutrientRows(report.nutrients || {}, gender);
  const maxHormoneRisk = Math.max(...hormoneRows.map(h => h.value));
  const nutrientCount = nutrientRows.filter(n => n.value >= 30).length;
  const mainHormone = hormoneRows[0];

  const hormoneCardsHTML = hormoneRows.map(h => {
    const r = getRiskColor(h.value);
    return `
    <div class="risk-card">
      <div class="risk-card-header">
        <div>
          <div class="risk-name">${h.name}</div>
          <div class="risk-sub">${h.sub}</div>
        </div>
        <div class="risk-pct" style="color:${r.color}">${h.value}%</div>
      </div>
      <div class="risk-bar-wrap">
        <div class="risk-bar" style="width:${h.value}%;background:${r.color}"></div>
      </div>
      <div class="risk-status" style="color:${r.color}">
        <div class="status-dot" style="background:${r.color}"></div>
        ${r.label} · ${h.comment || ''}
      </div>
    </div>`;
  }).join('');

  const nutrientCardsHTML = nutrientRows.map(n => {
    const r = getRiskColor(n.value);
    return `
    <div class="nut-card">
      <div class="nut-icon">${n.icon}</div>
      <div class="nut-name">${n.name}</div>
      <div class="nut-risk" style="color:${r.color}">${n.value}%</div>
      <div class="nut-label" style="color:${r.color}">${r.label}</div>
      <div style="font-size:11px;color:#A8998A;margin-top:6px;line-height:1.5;">${n.comment || ''}</div>
    </div>`;
  }).join('');

  const planWeek1 = (report.plan14days || []).slice(0, 7);
  const planWeek2 = (report.plan14days || []).slice(7, 14);

  const planRowsHTML = (items) => items.map(item => `
    <div class="plan-row">
      <div class="plan-day">D${item.day}</div>
      <div class="plan-content">${item.emoji || ''} <strong>${item.category}</strong> — ${item.tip}</div>
      <div class="plan-tag ${getCatTag(item.category)}">${item.category}</div>
    </div>`).join('');

  const imageAnalysisHTML = (report.faceAnalysis || report.nailAnalysis) ? `
  <div class="page">
    <div class="page-header">
      <div class="ph-logo">웰핏<span>+</span> CHECK-UP</div>
      <div class="ph-info">${userName} 님 · 만 ${actualAge}세<br>${todayShort}</div>
    </div>
    <div class="section-eyebrow">02 &nbsp; 이미지 분석 결과</div>
    <h2 class="section-title">AI 이미지 분석 결과</h2>
    <p class="section-desc">얼굴 피부 상태와 손톱 상태를 AI가 분석한 결과입니다.</p>
    ${report.faceAnalysis ? `
    <div class="ai-block" style="margin-bottom:16px;">
      <div class="ai-block-header"><span>🤳 얼굴 피부 분석</span></div>
      <p>${report.faceAnalysis}</p>
    </div>` : ''}
    ${report.nailAnalysis ? `
    <div class="ai-block">
      <div class="ai-block-header"><span>💅 손톱 상태 분석</span></div>
      <p>${report.nailAnalysis}</p>
    </div>` : ''}
  </div>` : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>웰핏+ CHECK-UP 건강 리포트 | ${userName}님</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css">
<style>
:root {
  --rose:#C8956C;--rose-light:#F5E6D8;--rose-ultra:#FDF6EF;
  --mauve:#8B5E83;--mauve-light:#F0E8EF;
  --mint:#7DBFA8;--mint-light:#E8F5F1;
  --cream:#FDFAF6;--warm-gray:#F5F0EB;
  --text-1:#2A2118;--text-2:#6B5C4E;--text-3:#A8998A;
  --border:#EDE4D8;--danger:#D4504A;--warn:#E8A038;--safe:#4CAF7D;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Pretendard','Apple SD Gothic Neo',sans-serif;background:var(--cream);color:var(--text-1);-webkit-font-smoothing:antialiased;padding-bottom:80px}
.cover{min-height:100vh;background:linear-gradient(145deg,#1A1210 0%,#2D1F18 50%,#1A1210 100%);display:flex;flex-direction:column;position:relative;overflow:hidden}
.cover-glow-1{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(200,149,108,.15) 0%,transparent 70%);top:-100px;right:-100px}
.cover-glow-2{position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(139,94,131,.12) 0%,transparent 70%);bottom:100px;left:-80px}
.cover-header{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:32px 48px 0}
.cover-logo{font-size:15px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,.9)}
.cover-logo span{color:var(--rose)}
.cover-badge{font-size:10px;font-weight:600;letter-spacing:1.5px;color:rgba(255,255,255,.4);border:1px solid rgba(255,255,255,.15);padding:5px 12px;border-radius:20px}
.cover-body{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;justify-content:center;padding:48px}
.cover-tag{font-size:11px;font-weight:700;letter-spacing:2.5px;color:var(--rose);text-transform:uppercase;margin-bottom:20px;display:flex;align-items:center;gap:10px}
.cover-tag::before{content:'';width:32px;height:1px;background:var(--rose)}
.cover-title{font-size:clamp(32px,5vw,56px);font-weight:300;line-height:1.15;color:rgba(255,255,255,.95);letter-spacing:-1px;margin-bottom:12px}
.cover-title strong{font-weight:700;color:#fff}
.cover-title em{color:var(--rose);font-style:normal}
.cover-sub{font-size:16px;color:rgba(255,255,255,.45);font-weight:300;letter-spacing:.5px;margin-bottom:52px}
.cover-user-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:24px 28px;display:flex;align-items:center;gap:20px;max-width:420px;backdrop-filter:blur(10px)}
.cover-avatar{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--rose),var(--mauve));display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.cover-user-name{font-size:20px;font-weight:700;color:#fff;margin-bottom:4px}
.cover-user-meta{font-size:13px;color:rgba(255,255,255,.5);line-height:1.6}
.cover-metrics{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid rgba(255,255,255,.07)}
.cover-metric{padding:28px 36px;border-right:1px solid rgba(255,255,255,.07)}
.cover-metric:last-child{border-right:none}
.cm-label{font-size:10px;letter-spacing:1.5px;color:rgba(255,255,255,.3);text-transform:uppercase;margin-bottom:8px}
.cm-value{font-size:32px;font-weight:700;line-height:1;margin-bottom:4px}
.cm-sub{font-size:12px;color:rgba(255,255,255,.4)}
.cm-rose{color:var(--rose)}.cm-mauve{color:#C4A8BE}.cm-mint{color:var(--mint)}
.page{max-width:840px;margin:0 auto;padding:52px 48px}
.section-eyebrow{font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--rose);display:flex;align-items:center;gap:10px;margin-bottom:10px}
.section-eyebrow::after{content:'';flex:1;height:1px;background:var(--border)}
.section-title{font-size:24px;font-weight:700;color:var(--text-1);margin-bottom:6px}
.section-desc{font-size:14px;color:var(--text-2);line-height:1.7;margin-bottom:32px}
.page-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:20px;margin-bottom:36px;border-bottom:1px solid var(--border)}
.ph-logo{font-size:13px;font-weight:700;color:var(--text-3)}
.ph-logo span{color:var(--rose)}
.ph-info{font-size:11px;color:var(--text-3);text-align:right;line-height:1.6}
.age-hero{background:linear-gradient(135deg,#1A1210 0%,#2D1F18 100%);border-radius:20px;padding:40px 44px;display:flex;align-items:center;gap:32px;margin-bottom:28px;position:relative;overflow:hidden;flex-wrap:wrap}
.age-hero-glow{position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(200,149,108,.2) 0%,transparent 70%);right:-60px;top:-60px}
.age-real,.age-health{position:relative;z-index:1}
.age-label{font-size:11px;letter-spacing:2px;color:rgba(255,255,255,.4);text-transform:uppercase;margin-bottom:6px}
.age-num{font-size:72px;font-weight:300;color:rgba(255,255,255,.5);line-height:1}
.age-health .age-num{color:#fff;font-weight:700}
.age-health .age-label{color:rgba(255,255,255,.6)}
.age-diff{font-size:13px;font-weight:700;letter-spacing:1px;padding:6px 14px;border-radius:20px;margin-top:10px;display:inline-block}
.age-arrow{font-size:28px;color:var(--rose);position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:6px}
.age-arrow-label{font-size:11px;letter-spacing:1px;color:var(--rose)}
.age-comment{position:relative;z-index:1;flex:1;min-width:200px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:20px 24px}
.age-comment p{font-size:14px;color:rgba(255,255,255,.7);line-height:1.8}
.age-comment strong{color:var(--rose)}
.risk-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px}
.risk-card{background:#fff;border:1px solid var(--border);border-radius:16px;padding:22px 24px}
.risk-card-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.risk-name{font-size:13px;font-weight:600;color:var(--text-1);margin-bottom:3px}
.risk-sub{font-size:11px;color:var(--text-3)}
.risk-pct{font-size:28px;font-weight:700;line-height:1;text-align:right}
.risk-bar-wrap{height:8px;background:var(--warm-gray);border-radius:4px;overflow:hidden;margin-bottom:10px}
.risk-bar{height:100%;border-radius:4px}
.risk-status{font-size:11px;font-weight:600;letter-spacing:.5px;display:flex;align-items:center;gap:5px}
.status-dot{width:6px;height:6px;border-radius:50%}
.nutrition-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px}
.nut-card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:18px 20px;text-align:center}
.nut-icon{font-size:24px;margin-bottom:10px}
.nut-name{font-size:12px;font-weight:600;color:var(--text-1);margin-bottom:4px}
.nut-risk{font-size:22px;font-weight:700;margin-bottom:4px}
.nut-label{font-size:11px}
.ai-block{background:var(--rose-ultra);border:1px solid #E8D5C0;border-left:4px solid var(--rose);border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:28px}
.ai-block-header{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.ai-block-header span{font-size:12px;font-weight:700;color:var(--rose);letter-spacing:.5px}
.ai-block p{font-size:14px;color:var(--text-2);line-height:1.8}
.plan-section{margin-bottom:28px}
.plan-header{display:flex;align-items:center;gap:10px;background:var(--warm-gray);border-radius:10px;padding:12px 16px;margin-bottom:12px}
.plan-header-icon{font-size:16px}
.plan-header-title{font-size:14px;font-weight:700;color:var(--text-1)}
.plan-rows{display:flex;flex-direction:column;gap:8px}
.plan-row{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:12px;background:#fff;border:1px solid var(--border);border-radius:10px;padding:12px 16px}
.plan-day{width:24px;height:24px;border-radius:6px;background:var(--rose-light);color:var(--rose);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center}
.plan-content{font-size:13px;color:var(--text-2);line-height:1.5}
.plan-content strong{color:var(--text-1);font-weight:600}
.plan-tag{font-size:10px;font-weight:600;padding:3px 8px;border-radius:6px;white-space:nowrap}
.tag-diet{background:#E8F5E9;color:#2E7D32}
.tag-supp{background:#E3F2FD;color:#1565C0}
.tag-move{background:#FFF3E0;color:#E65100}
.tag-rest{background:var(--mauve-light);color:var(--mauve)}
.disclaimer{background:var(--warm-gray);border-radius:10px;padding:14px 18px;margin-top:32px;font-size:11px;color:var(--text-3);line-height:1.7;text-align:center}
@media(max-width:600px){
  .cover-body{padding:32px 24px}
  .cover-header{padding:24px 24px 0}
  .cover-metric{padding:20px 24px}
  .page{padding:32px 20px}
  .age-hero{padding:28px 24px;gap:20px}
  .age-num{font-size:52px}
  .risk-grid{grid-template-columns:1fr}
  .nutrition-strip{grid-template-columns:1fr 1fr}
  .plan-row{grid-template-columns:28px 1fr}
  .plan-tag{display:none}
}
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-glow-1"></div>
  <div class="cover-glow-2"></div>
  <div class="cover-header">
    <div class="cover-logo">웰핏<span>+</span> CHECK-UP</div>
    <div class="cover-badge">AI HEALTH REPORT</div>
  </div>
  <div class="cover-body">
    <div class="cover-tag">Personal Health Analysis</div>
    <h1 class="cover-title">
      <strong>호르몬 · 영양</strong><br>
      <em>위험도 분석</em><br>
      <span style="font-weight:300;color:rgba(255,255,255,.5);">건강 리포트</span>
    </h1>
    <p class="cover-sub">셀카 한 장 + 18문항 설문 → AI 즉시 분석</p>
    <div class="cover-user-card">
      <div class="cover-avatar">${avatar}</div>
      <div>
        <div class="cover-user-name">${userName} 님</div>
        <div class="cover-user-meta">
          만 ${actualAge}세 · ${genderLabel} · ${userCity} 거주<br>
          분석 완료: ${today}
        </div>
      </div>
    </div>
  </div>
  <div class="cover-metrics">
    <div class="cover-metric">
      <div class="cm-label">AI 건강 나이</div>
      <div class="cm-value cm-mint">${report.healthAge}<span style="font-size:18px;font-weight:400;">세</span></div>
      <div class="cm-sub">실제 나이 대비 ${ageDiff >= 0 ? '−' + ageDiff : '+' + Math.abs(ageDiff)}세</div>
    </div>
    <div class="cover-metric">
      <div class="cm-label">호르몬 위험도</div>
      <div class="cm-value cm-rose">${maxHormoneRisk}<span style="font-size:18px;font-weight:400;">%</span></div>
      <div class="cm-sub">${mainHormone.name} 위험</div>
    </div>
    <div class="cover-metric">
      <div class="cm-label">영양 관심 항목</div>
      <div class="cm-value cm-mauve">${nutrientCount}<span style="font-size:18px;font-weight:400;">개</span></div>
      <div class="cm-sub">${nutrientRows.filter(n => n.value >= 30).map(n => n.name).join(' · ') || '양호'}</div>
    </div>
  </div>
</div>

<!-- PAGE 1: 건강 나이 + 호르몬 -->
<div class="page">
  <div class="page-header">
    <div class="ph-logo">웰핏<span>+</span> CHECK-UP</div>
    <div class="ph-info">${userName} 님 · 만 ${actualAge}세<br>${todayShort}</div>
  </div>
  <div class="section-eyebrow">01 &nbsp; AI 건강 나이 분석</div>
  <h2 class="section-title">
    ${ageDiff > 0 ? `실제 나이보다 ${ageDiff}살 더 젊습니다` : ageDiff < 0 ? `건강 나이가 ${Math.abs(ageDiff)}세 높게 나타났습니다` : '실제 나이와 동일합니다'}
  </h2>
  <p class="section-desc">얼굴 468개 랜드마크, 손톱 상태, 설문 18문항을 AI가 종합 분석한 결과입니다. 건강 나이는 의료 진단이 아닌 생활습관 기반 참고 지표입니다.</p>
  <div class="age-hero">
    <div class="age-hero-glow"></div>
    <div class="age-real">
      <div class="age-label">실제 나이</div>
      <div class="age-num">${actualAge}</div>
    </div>
    <div class="age-arrow">
      <i class="fas fa-arrow-right"></i>
      <div class="age-arrow-label">AI 분석</div>
    </div>
    <div class="age-health">
      <div class="age-label">AI 건강 나이</div>
      <div class="age-num">${report.healthAge}</div>
      <div class="age-diff" style="background:${ageDiffColor};color:#fff">${ageDiffLabel}</div>
    </div>
    <div class="age-comment">
      <p>${report.summary || ''}</p>
    </div>
  </div>

  <div class="section-eyebrow">02 &nbsp; 호르몬 위험도</div>
  <h2 class="section-title">호르몬 불균형 위험도 분석</h2>
  <p class="section-desc">혈액 채취 없이 얼굴·손톱 이미지와 설문을 AI로 융합 분석한 참고 지표입니다. (특허 출원 기술)</p>
  <div class="risk-grid">${hormoneCardsHTML}</div>

  <div class="section-eyebrow">03 &nbsp; 영양 결핍 위험도</div>
  <h2 class="section-title">주요 영양소 결핍 위험도</h2>
  <div class="nutrition-strip">${nutrientCardsHTML}</div>

  <div class="disclaimer">
    본 리포트는 의료 진단을 대체하지 않으며, 생활습관 코칭 및 건강 관리 참고 자료를 제공합니다.<br>
    웰핏+ CHECK-UP | 대한민국 특허 출원 완료 · 출원인: 김성훈 | © 2026
  </div>
</div>

${imageAnalysisHTML}

<!-- PAGE 2: 14일 플랜 -->
<div class="page">
  <div class="page-header">
    <div class="ph-logo">웰핏<span>+</span> CHECK-UP</div>
    <div class="ph-info">${userName} 님 · 만 ${actualAge}세<br>${todayShort}</div>
  </div>
  <div class="section-eyebrow">04 &nbsp; 14일 맞춤 플랜</div>
  <h2 class="section-title">나만을 위한 14일 건강 가이드</h2>
  <p class="section-desc">분석 결과를 바탕으로 AI가 생성한 맞춤형 14일 실천 플랜입니다.</p>

  <div class="plan-section">
    <div class="plan-header">
      <div class="plan-header-icon">🌱</div>
      <div class="plan-header-title">Week 1 — 기초 습관 (1~7일)</div>
    </div>
    <div class="plan-rows">${planRowsHTML(planWeek1)}</div>
  </div>

  <div class="plan-section">
    <div class="plan-header">
      <div class="plan-header-icon">🌿</div>
      <div class="plan-header-title">Week 2 — 심화 관리 (8~14일)</div>
    </div>
    <div class="plan-rows">${planRowsHTML(planWeek2)}</div>
  </div>

  <div class="disclaimer">
    본 리포트는 의료 진단을 대체하지 않으며, 생활습관 코칭 및 건강 관리 참고 자료를 제공합니다.<br>
    웰핏+ CHECK-UP | 대한민국 특허 출원 완료 · 출원인: 김성훈 | © 2026
  </div>
</div>

</body>
</html>`;
}
