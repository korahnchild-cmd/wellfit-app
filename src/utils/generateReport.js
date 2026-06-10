// src/utils/generateReport.js

function getRiskColor(value) {
  if (value < 30) return { color: '#4CAF7D', bg: '#E8F5E9', label: '양호', dot: '#4CAF7D' };
  if (value < 60) return { color: '#E8A038', bg: '#FFF3E0', label: '주의', dot: '#E8A038' };
  return { color: '#D4504A', bg: '#FFEBEE', label: '관리 필요', dot: '#D4504A' };
}

function getHormoneRows(hormones, gender) {
  const shared = [
    { name: '코르티솔 과다 참고 지수', sub: '스트레스 호르몬 (기준 μg/dL)', value: hormones.cortisol ?? 0, comment: hormones.cortisolComment ?? '' },
    { name: '인슐린 저항성 참고 지수', sub: '혈당 조절 호르몬', value: hormones.insulin ?? 0, comment: hormones.insulinComment ?? '' },
    { name: '갑상선 호르몬 불균형 참고 지수', sub: '갑상선 (기준 TSH μIU/mL)', value: hormones.thyroid ?? 0, comment: hormones.thyroidComment ?? '' },
    { name: 'DHEA 저하 참고 지수', sub: '부신 호르몬 전구체 (기준 μg/dL)', value: hormones.dhea ?? 0, comment: hormones.dheaComment ?? '' },
  ];
  if (gender === 'male') {
    return [
      { name: '테스토스테론 저하 참고 지수', sub: '남성 호르몬 (기준 ng/dL)', value: hormones.testosterone ?? 0, comment: hormones.testosteroneComment ?? '' },
      ...shared,
      { name: '성장호르몬 저하 참고 지수', sub: '성장호르몬 (기준 ng/mL)', value: hormones.growthHormone ?? 0, comment: hormones.growthHormoneComment ?? '' },
    ];
  }
  return [
    { name: '에스트로겐 저하 참고 지수', sub: '여성 호르몬 (기준 pg/mL)', value: hormones.estrogen ?? 0, comment: hormones.estrogenComment ?? '' },
    ...shared,
    { name: '프로게스테론 부족 참고 지수', sub: '황체호르몬 (기준 ng/mL)', value: hormones.progesterone ?? 0, comment: hormones.progesteroneComment ?? '' },
  ];
}

function getNutrientRows(nutrients) {
  return [
    { icon: '☀️', name: '비타민 D', value: nutrients.vitaminD ?? 0, comment: nutrients.vitaminDComment ?? '' },
    { icon: '🔴', name: '비타민 B12', value: nutrients.vitaminB12 ?? 0, comment: nutrients.vitaminB12Comment ?? '' },
    { icon: '🩸', name: '철분 (Iron)', value: nutrients.iron ?? 0, comment: nutrients.ironComment ?? '' },
    { icon: '🌿', name: '아연 (Zinc)', value: nutrients.zinc ?? 0, comment: nutrients.zincComment ?? '' },
    { icon: '💪', name: '마그네슘', value: nutrients.magnesium ?? 0, comment: nutrients.magnesiumComment ?? '' },
    { icon: '🐟', name: '오메가-3', value: nutrients.omega3 ?? 0, comment: nutrients.omega3Comment ?? '' },
    { icon: '🥛', name: '칼슘', value: nutrients.calcium ?? 0, comment: nutrients.calciumComment ?? '' },
    { icon: '🍊', name: '비타민 C', value: nutrients.vitaminC ?? 0, comment: nutrients.vitaminCComment ?? '' },
  ];
}

function getCatTag(category) {
  const map = { '영양': 'tag-supp', '수면': 'tag-rest', '운동': 'tag-move', '마음': 'tag-rest', '생활': 'tag-diet', '휴식': 'tag-rest', '점검': 'tag-supp' };
  return map[category] || 'tag-supp';
}

function getLifestyleScores(report, actualAge) {
  const hormones = report.hormones || {};
  const nutrients = report.nutrients || {};
  const cortisol = hormones.cortisol ?? 35;
  const ageDiff = parseInt(actualAge) - (report.healthAge ?? parseInt(actualAge));
  const avgNutrient = Math.round(([nutrients.vitaminD ?? 30, nutrients.vitaminB12 ?? 30, nutrients.iron ?? 30, nutrients.zinc ?? 30, nutrients.magnesium ?? 30, nutrients.omega3 ?? 30, nutrients.calcium ?? 30].reduce((a, b) => a + b, 0)) / 7);
  const sleepScore = Math.min(90, Math.max(15, Math.round(cortisol * 0.65 + (ageDiff < 0 ? 15 : 5))));
  const dietScore = Math.min(90, Math.max(15, avgNutrient));
  const exerciseScore = Math.min(85, Math.max(15, ageDiff < 0 ? 55 + Math.abs(ageDiff) * 2 : 25 + ageDiff * 3));
  const stressScore = Math.min(90, Math.max(15, cortisol));
  return { sleep: sleepScore, diet: dietScore, exercise: exerciseScore, stress: stressScore };
}

function getTopSupplements(report, gender) {
  const nutrients = report.nutrients || {};
  const all = [
    { name: '비타민 D3', value: nutrients.vitaminD ?? 0, icon: '☀️', dose: '2,000~4,000 IU', timing: '식후 30분 (지용성)', caution: '고용량 장기복용 시 혈중 농도 체크 권장', benefit: '면역력·뼈 건강·기분 개선' },
    { name: '비타민 B12', value: nutrients.vitaminB12 ?? 0, icon: '🔴', dose: '1,000~2,000μg', timing: '아침 식후', caution: '신장 질환 시 의사 상담', benefit: '신경계 건강·에너지 생성·빈혈 예방' },
    { name: '철분 (Iron)', value: nutrients.iron ?? 0, icon: '🩸', dose: '18~27mg', timing: '공복 또는 비타민C 음료와 함께', caution: '변비 유발 가능 — 변비 시 용량 분할', benefit: '에너지·빈혈 예방·피부 혈색' },
    { name: '아연 (Zinc)', value: nutrients.zinc ?? 0, icon: '🌿', dose: '15~25mg', timing: '저녁 식사 후', caution: '구리 흡수 저해 — 장기복용 시 구리 병용', benefit: '테스토스테론 합성·면역·항산화' },
    { name: '마그네슘', value: nutrients.magnesium ?? 0, icon: '💪', dose: '200~400mg', timing: '취침 30분 전', caution: '과다복용 시 설사 가능 — 구연산 마그네슘 권장', benefit: '수면 질 개선·근육 이완·스트레스 완화' },
    { name: '오메가-3', value: nutrients.omega3 ?? 0, icon: '🐟', dose: '1,000~2,000mg (EPA+DHA)', timing: '식후', caution: '혈액 희석제 복용 시 의사 상담', benefit: '염증 감소·혈행·뇌·피부 건강' },
    { name: '칼슘', value: nutrients.calcium ?? 0, icon: '🥛', dose: '500~600mg (1회)', timing: '식후 또는 취침 전', caution: '철분과 동시 복용 피하기', benefit: '뼈·치아 건강·근육 수축·신경 전달' },
    { name: '코엔자임 Q10', value: 40, icon: '⚡', dose: '100~200mg', timing: '아침 식후', caution: '혈압약 복용 시 상호작용 주의', benefit: '세포 에너지 생성·항산화·심장 건강' },
  ];
  return all.sort((a, b) => b.value - a.value).slice(0, 3);
}

function getHormoneStage(report, gender, actualAge) {
  const isMale = gender === 'male';
  const age = parseInt(actualAge);
  const hormones = report.hormones || {};
  if (isMale) {
    const risk = hormones.testosterone ?? 0;
    if (age < 40) return { stage: '테스토스테론 최적기', desc: '30대는 테스토스테론이 서서히 감소 시작. 예방적 관리가 핵심입니다.', risk, tips: ['근력 운동 주 3회 이상', '수면 7시간 이상 유지', '아연·마그네슘 보충', '과음·흡연 자제'] };
    if (age < 55) return { stage: '남성 갱년기 진입기', desc: '40~50대는 테스토스테론이 연 1~2% 감소. 활력 저하·집중력 감소가 나타날 수 있습니다.', risk, tips: ['고강도 인터벌 트레이닝 추가', '단백질 섭취 체중 1kg당 1.2g', '스트레스 관리 최우선', '연 1회 호르몬 수치 검사'] };
    return { stage: '남성 갱년기 심화기', desc: '55세 이상은 테스토스테론 저하 증상이 뚜렷해집니다. 전문의 상담을 권장합니다.', risk, tips: ['비뇨기과·내분비과 정기 검진', '고강도 운동 유지', '테스토스테론 보충 치료 검토', '심혈관 건강 집중 관리'] };
  } else {
    const risk = hormones.estrogen ?? 0;
    if (age < 40) return { stage: '에스트로겐 안정기', desc: '40대 이전은 에스트로겐 수치가 안정적이나, 스트레스·불규칙한 생활로 일시 저하될 수 있습니다.', risk, tips: ['규칙적인 유산소 운동', '콩·두부 등 식물성 에스트로겐 섭취', '스트레스 관리·수면 7시간', '철분·엽산 충분히 섭취'] };
    if (age < 55) return { stage: '갱년기 전환기 (perimenopause)', desc: '40~55세는 에스트로겐이 불규칙하게 변동하는 갱년기 전환기입니다. 증상 모니터링이 중요합니다.', risk, tips: ['산부인과 정기 검진 (연 1회)', '이소플라본·홍삼 보조제 고려', '체중 관리 (복부비만 주의)', '칼슘·비타민D 보충으로 골밀도 보호'] };
    return { stage: '갱년기 후기 (postmenopause)', desc: '55세 이상 폐경 후에는 골다공증·심혈관 위험이 높아집니다. 종합적 건강 관리가 필요합니다.', risk, tips: ['골밀도 검사 (DEXA) 권장', '칼슘 1,200mg + 비타민D 1,000IU 일일', '호르몬 대체 요법(HRT) 전문의 상담', '심혈관 건강 지표 정기 모니터링'] };
  }
}

function getDietDeficientFoods(report, gender) {
  const nutrients = report.nutrients || {};
  const items = [];
  if ((nutrients.vitaminD ?? 0) >= 20) items.push({ nutrient: '비타민 D', icon: '☀️', foods: ['연어 (100g → 447 IU)', '고등어 (100g → 360 IU)', '달걀노른자 (1개 → 40 IU)', '비타민D 강화 우유'], avoid: '과도한 실내 생활 · 자외선 차단제 상시 도포' });
  if ((nutrients.vitaminB12 ?? 0) >= 20) items.push({ nutrient: '비타민 B12', icon: '🔴', foods: ['소간 (100g → 70μg)', '굴 (100g → 28μg)', '연어 (100g → 3.2μg)', '달걀 (1개 → 0.9μg)'], avoid: '채식 위주 식단 — B12는 동물성 식품에만 존재' });
  if ((nutrients.iron ?? 0) >= 20) items.push({ nutrient: '철분', icon: '🩸', foods: ['소 안심 (100g → 3.3mg)', '굴 (100g → 5mg)', '시금치 (100g → 2.7mg)', '렌틸콩 (100g → 3.3mg)'], avoid: '커피·홍차 식사 직후 — 철분 흡수 70% 감소' });
  if ((nutrients.zinc ?? 0) >= 20) items.push({ nutrient: '아연', icon: '🌿', foods: ['굴 (100g → 16mg)', '소고기 (100g → 4.8mg)', '호박씨 (30g → 2.2mg)', '캐슈넛'], avoid: '과도한 음주 — 아연 배설 증가' });
  if ((nutrients.magnesium ?? 0) >= 20) items.push({ nutrient: '마그네슘', icon: '💪', foods: ['아몬드 (30g → 80mg)', '시금치 (100g → 79mg)', '다크초콜릿 85% (30g → 64mg)', '아보카도'], avoid: '정제 탄수화물 과다 · 과도한 카페인 섭취' });
  if ((nutrients.omega3 ?? 0) >= 20) items.push({ nutrient: '오메가-3', icon: '🐟', foods: ['고등어 (100g → 2.6g)', '연어 (100g → 2.3g)', '정어리 (100g → 1.5g)', '아마씨 (15g → 2.3g)'], avoid: '트랜스지방 과다 · 오메가6 불균형 식단' });
  if ((nutrients.calcium ?? 0) >= 20) items.push({ nutrient: '칼슘', icon: '🥛', foods: ['저지방 우유 (200ml → 240mg)', '요거트 (100g → 120mg)', '멸치 (30g → 270mg)', '두부 (100g → 130mg)'], avoid: '과도한 나트륨·카페인 — 칼슘 배설 증가' });
  if (items.length === 0) items.push({ nutrient: '비타민 D', icon: '☀️', foods: ['연어', '고등어', '달걀노른자', '강화 우유'], avoid: '과도한 실내 생활' });
  return items;
}

function buildLifestyleSection(report, actualAge, userName, todayShort) {
  const scores = getLifestyleScores(report, actualAge);
  const areas = [
    { icon: '🌙', label: '수면', score: scores.sleep, color: '#8B5E83', status: scores.sleep >= 60 ? '개선 필요' : scores.sleep >= 30 ? '주의' : '양호', tips: scores.sleep >= 60 ? ['취침 시간 고정 (밤 11시 이전)', '자기 전 1시간 스마트폰 금지', '마그네슘 취침 전 복용', '수면 트래커 앱 활용'] : ['현재 수면 패턴 잘 유지', '주말 수면 빚 최소화', '낮잠 20분 이내로 제한'] },
    { icon: '🥗', label: '식단', score: scores.diet, color: '#4CAF7D', status: scores.diet >= 60 ? '개선 필요' : scores.diet >= 30 ? '주의' : '양호', tips: scores.diet >= 60 ? ['채소 매끼 1/2 접시 채우기', '가공식품·당류 50% 줄이기', '결핍 영양소 식품 우선 섭취', '물 하루 8잔 (2L) 목표'] : ['균형 잡힌 식사 유지', '계절 채소 다양하게 섭취', '과식 피하고 천천히 먹기'] },
    { icon: '🏃', label: '운동', score: scores.exercise, color: '#E8A038', status: scores.exercise >= 60 ? '개선 필요' : scores.exercise >= 30 ? '주의' : '양호', tips: scores.exercise >= 60 ? ['주 150분 유산소 목표 설정', '엘리베이터 대신 계단 이용', '점심시간 10분 걷기 시작', '주 2회 근력 운동 추가'] : ['현재 운동 습관 유지·강화', '고강도 인터벌 도전 검토', '운동 다양성 추가'] },
    { icon: '🧘', label: '스트레스', score: scores.stress, color: '#D4504A', status: scores.stress >= 60 ? '개선 필요' : scores.stress >= 30 ? '주의' : '양호', tips: scores.stress >= 60 ? ['하루 5분 복식 호흡 실천', '명상 앱(마보·코끼리) 활용', '디지털 디톡스 주 1회', '취미 활동 주 2시간 확보'] : ['스트레스 관리 잘 되고 있음', '긍정적 루틴 계속 유지', '사회적 관계 적극 활용'] },
  ];
  const priorityOrder = [...areas].sort((a, b) => b.score - a.score);

  return `
<div class="page">
  <div class="page-header">
    <div class="ph-logo">웰핏<span>+</span> CHECK-UP</div>
    <div class="ph-info">${userName} 님 · 만 ${actualAge}세<br>${todayShort}</div>
  </div>
  <div class="section-eyebrow">05 &nbsp; 생활습관 개선 로드맵</div>
  <h2 class="section-title">4대 생활습관 현황 분석</h2>
  <p class="section-desc">수면·식단·운동·스트레스 4개 영역을 AI가 종합 평가했습니다. 점수가 높을수록 즉각적인 개선이 필요한 영역입니다.</p>

  <div class="lifestyle-radar">
    ${areas.map(a => {
      const r = getRiskColor(a.score);
      const w = Math.max(8, a.score);
      return `
    <div class="ls-area-card" style="border-color:${a.color}20">
      <div class="ls-area-top">
        <div class="ls-icon-wrap" style="background:${a.color}15">${a.icon}</div>
        <div>
          <div class="ls-area-name">${a.label}</div>
          <div class="ls-area-status" style="color:${r.color}">${a.status}</div>
        </div>
        <div class="ls-score" style="color:${a.color}">${a.score}<span style="font-size:12px">%</span></div>
      </div>
      <div class="ls-bar-wrap">
        <div class="ls-bar" style="width:${w}%;background:linear-gradient(90deg,${a.color}99,${a.color})"></div>
      </div>
      <ul class="ls-tips">
        ${a.tips.map(t => `<li>${t}</li>`).join('')}
      </ul>
    </div>`;
    }).join('')}
  </div>

  <div class="priority-banner">
    <div class="priority-title">🎯 개선 우선순위</div>
    <div class="priority-items">
      ${priorityOrder.map((a, i) => `
      <div class="priority-item">
        <div class="priority-rank" style="background:${['#D4504A','#E8A038','#4CAF7D','#8B5E83'][i]}">${i + 1}</div>
        <div class="priority-label">${a.icon} ${a.label}</div>
        <div class="priority-score" style="color:${['#D4504A','#E8A038','#4CAF7D','#8B5E83'][i]}">${a.score}%</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="disclaimer">
    본 리포트는 의료 진단을 대체하지 않으며, 생활습관 코칭 및 건강 관리 참고 자료를 제공합니다.<br>
    웰핏+ CHECK-UP | 대한민국 특허 출원 완료 · 출원인: 김성훈 | © 2026
  </div>
</div>`;
}

function buildWeeklyPlanSection(report, actualAge, userName, todayShort) {
  const scores = getLifestyleScores(report, actualAge);
  const nutrients = report.nutrients || {};
  const topNutrient = nutrients.vitaminD > (nutrients.iron ?? 0) ? '비타민D' : '철분';
  const weeks = [
    {
      icon: '🌱', title: '1주차 — 기초 습관 만들기',
      color: '#4CAF7D',
      days: [
        { d: 1, cat: '수면', emoji: '🌙', task: `취침 시간 고정: 밤 11시 목표. 스마트폰은 침대 밖에` },
        { d: 2, cat: '식단', emoji: '🥗', task: '아침 식사 시작: 견과류 한 줌 + 바나나' },
        { d: 3, cat: '운동', emoji: '🚶', task: '점심 후 10분 걷기 — 습관의 씨앗 심기' },
        { d: 4, cat: '수분', emoji: '💧', task: '물 하루 6잔 목표. 알람 설정으로 리마인드' },
        { d: 5, cat: '마음', emoji: '🧘', task: '취침 전 복식 호흡 3분 (4-7-8 호흡법)' },
        { d: 6, cat: '식단', emoji: '🥦', task: '저녁 식사에 채소 1가지 추가하기' },
        { d: 7, cat: '점검', emoji: '✅', task: '1주차 실천 체크: 잘 된 것 3가지 메모' },
      ],
    },
    {
      icon: '💊', title: `2주차 — 영양 보충 집중`,
      color: '#7DBFA8',
      days: [
        { d: 8, cat: '영양', emoji: '☀️', task: `${topNutrient} 영양제 시작: 식후 복용` },
        { d: 9, cat: '식단', emoji: '🐟', task: '등 푸른 생선(고등어·연어) 섭취 — 오메가3·비타민D' },
        { d: 10, cat: '영양', emoji: '💪', task: '마그네슘 취침 전 복용 시작 — 수면 질 개선' },
        { d: 11, cat: '식단', emoji: '🥚', task: '달걀 하루 1~2개: 단백질 + 영양소 보충' },
        { d: 12, cat: '운동', emoji: '🏋️', task: '가벼운 근력 운동: 스쿼트·푸시업 각 10회 3세트' },
        { d: 13, cat: '수면', emoji: '🌙', task: '수면 퀄리티 체크: 기상 시 개운함 점수 매기기' },
        { d: 14, cat: '점검', emoji: '📊', task: '2주차 영양 보충 상태 확인, 몸 상태 기록' },
      ],
    },
    {
      icon: '🏃', title: '3주차 — 운동 루틴 정착',
      color: '#E8A038',
      days: [
        { d: 15, cat: '운동', emoji: '🚶', task: '유산소 30분: 빠르게 걷기 또는 자전거' },
        { d: 16, cat: '운동', emoji: '💪', task: '근력 운동: 상체 집중 (어깨·팔·등)' },
        { d: 17, cat: '식단', emoji: '🥩', task: '단백질 섭취량 체크: 체중(kg) × 1.2g 목표' },
        { d: 18, cat: '운동', emoji: '🤸', task: '스트레칭 20분: 유연성 확보 + 부상 예방' },
        { d: 19, cat: '마음', emoji: '🧘', task: '명상 5분: 마보·코끼리 앱 활용' },
        { d: 20, cat: '운동', emoji: '🏃', task: '유산소 30분 + 핵심 운동(플랭크·데드버그) 추가' },
        { d: 21, cat: '점검', emoji: '📏', task: '3주차 체중·체지방 측정, 운동 강도 조정' },
      ],
    },
    {
      icon: '🔄', title: '4주차 — 통합 점검',
      color: '#C8956C',
      days: [
        { d: 22, cat: '영양', emoji: '💊', task: '영양제 복용 루틴 점검: 빠진 날 없이 복용 확인' },
        { d: 23, cat: '수면', emoji: '🌙', task: '수면 패턴 분석: 입면 시간·기상 시간 기록' },
        { d: 24, cat: '식단', emoji: '🥗', task: '이달의 식단 돌아보기: 잘 먹은 날 vs 부족한 날' },
        { d: 25, cat: '운동', emoji: '🏋️', task: '4주 운동 성과 체크: 횟수 늘었나? 강도 높이기' },
        { d: 26, cat: '마음', emoji: '😊', task: '스트레스 지수 셀프 체크 (1~10점)' },
        { d: 27, cat: '생활', emoji: '🌿', task: '다음 달 목표 설정: 가장 개선된 항목 유지, 부족한 항목 보완' },
        { d: 28, cat: '점검', emoji: '🎉', task: '4주 완료! 웰핏+ 재검사로 건강나이 변화 확인' },
      ],
    },
  ];

  return `
<div class="page">
  <div class="page-header">
    <div class="ph-logo">웰핏<span>+</span> CHECK-UP</div>
    <div class="ph-info">${userName} 님 · 만 ${actualAge}세<br>${todayShort}</div>
  </div>
  <div class="section-eyebrow">06 &nbsp; 주차별 실천 계획</div>
  <h2 class="section-title">4주 건강 실천 플랜</h2>
  <p class="section-desc">분석 결과를 바탕으로 설계한 28일 단계별 실천 플랜입니다. 매일 하나씩 실천하면 한 달 뒤 건강나이가 달라집니다.</p>

  ${weeks.map(w => `
  <div class="week-section" style="border-color:${w.color}30">
    <div class="week-header" style="background:linear-gradient(90deg,${w.color}18,transparent)">
      <span class="week-icon">${w.icon}</span>
      <span class="week-title" style="color:${w.color}">${w.title}</span>
    </div>
    <div class="week-days">
      ${w.days.map(day => `
      <div class="week-day-row">
        <div class="week-day-num" style="background:${w.color}20;color:${w.color}">D${day.d}</div>
        <div class="week-day-content">${day.emoji} <strong>${day.cat}</strong> ${day.task}</div>
        <div class="plan-tag ${getCatTag(day.cat)}">${day.cat}</div>
      </div>`).join('')}
    </div>
  </div>`).join('')}

  <div class="disclaimer">
    본 리포트는 의료 진단을 대체하지 않으며, 생활습관 코칭 및 건강 관리 참고 자료를 제공합니다.<br>
    웰핏+ CHECK-UP | 대한민국 특허 출원 완료 · 출원인: 김성훈 | © 2026
  </div>
</div>`;
}

function buildSupplementSection(report, gender, actualAge, userName, todayShort) {
  const supps = getTopSupplements(report, gender);
  const colors = ['#C8956C', '#7DBFA8', '#8B5E83'];
  const ranks = ['1st', '2nd', '3rd'];

  return `
<div class="page">
  <div class="page-header">
    <div class="ph-logo">웰핏<span>+</span> CHECK-UP</div>
    <div class="ph-info">${userName} 님 · 만 ${actualAge}세<br>${todayShort}</div>
  </div>
  <div class="section-eyebrow">07 &nbsp; 맞춤 영양제 복용 가이드</div>
  <h2 class="section-title">분석 결과 기반 TOP 3 영양제</h2>
  <p class="section-desc">결핍 참고 지수가 높은 순서로 우선 보충이 필요한 영양제를 선정했습니다. 복용 전 전문가 상담을 권장합니다.</p>

  <div class="supp-cards">
    ${supps.map((s, i) => `
    <div class="supp-card" style="border-color:${colors[i]}40">
      <div class="supp-rank-badge" style="background:${colors[i]};color:#fff">${ranks[i]} PICK</div>
      <div class="supp-top">
        <div class="supp-icon-circle" style="background:${colors[i]}15;border-color:${colors[i]}30">${s.icon}</div>
        <div class="supp-info">
          <div class="supp-name">${s.name}</div>
          <div class="supp-benefit">${s.benefit}</div>
        </div>
        <div class="supp-risk-badge" style="background:${getRiskColor(s.value).bg};color:${getRiskColor(s.value).color}">${getRiskColor(s.value).label}</div>
      </div>
      <div class="supp-details">
        <div class="supp-detail-item">
          <span class="supp-detail-icon">💊</span>
          <span class="supp-detail-label">권장 용량</span>
          <span class="supp-detail-val">${s.dose}</span>
        </div>
        <div class="supp-detail-item">
          <span class="supp-detail-icon">⏰</span>
          <span class="supp-detail-label">복용 시간</span>
          <span class="supp-detail-val">${s.timing}</span>
        </div>
        <div class="supp-detail-item caution">
          <span class="supp-detail-icon">⚠️</span>
          <span class="supp-detail-label">주의사항</span>
          <span class="supp-detail-val">${s.caution}</span>
        </div>
      </div>
    </div>`).join('')}
  </div>

  <div class="supp-timing-chart">
    <div class="stc-title">📅 하루 복용 스케줄</div>
    <div class="stc-rows">
      <div class="stc-row"><div class="stc-time">아침 식후</div><div class="stc-items">${supps.filter(s => s.timing.includes('아침')).map(s => `<span class="stc-pill">${s.icon} ${s.name}</span>`).join('') || '<span class="stc-pill">—</span>'}</div></div>
      <div class="stc-row"><div class="stc-time">점심 식후</div><div class="stc-items">${supps.filter(s => s.timing.includes('식후') && !s.timing.includes('아침') && !s.timing.includes('저녁')).map(s => `<span class="stc-pill">${s.icon} ${s.name}</span>`).join('') || '<span class="stc-pill">—</span>'}</div></div>
      <div class="stc-row"><div class="stc-time">저녁 식후</div><div class="stc-items">${supps.filter(s => s.timing.includes('저녁') || (s.timing.includes('식후') && !s.timing.includes('아침') && !s.timing.includes('저녁') && !s.timing.includes('취침'))).map(s => `<span class="stc-pill">${s.icon} ${s.name}</span>`).join('') || '<span class="stc-pill">—</span>'}</div></div>
      <div class="stc-row"><div class="stc-time">취침 전</div><div class="stc-items">${supps.filter(s => s.timing.includes('취침')).map(s => `<span class="stc-pill">${s.icon} ${s.name}</span>`).join('') || '<span class="stc-pill">—</span>'}</div></div>
    </div>
  </div>

  <div class="disclaimer">
    본 리포트는 의료 진단을 대체하지 않으며, 생활습관 코칭 및 건강 관리 참고 자료를 제공합니다.<br>
    웰핏+ CHECK-UP | 대한민국 특허 출원 완료 · 출원인: 김성훈 | © 2026
  </div>
</div>`;
}

function buildHormoneGuideSection(report, gender, actualAge, userName, todayShort) {
  const stage = getHormoneStage(report, gender, actualAge);
  const isMale = gender === 'male';
  const hormones = report.hormones || {};
  const mainRisk = isMale ? (hormones.testosterone ?? 0) : (hormones.estrogen ?? 0);
  const cortisolRisk = hormones.cortisol ?? 0;
  const insulinRisk = hormones.insulin ?? 0;
  const thyroidRisk = hormones.thyroid ?? 0;
  const dheaRisk = hormones.dhea ?? 0;
  const rc = getRiskColor(mainRisk);
  const rcc = getRiskColor(cortisolRisk);
  const rci = getRiskColor(insulinRisk);
  const rct = getRiskColor(thyroidRisk);
  const rcd = getRiskColor(dheaRisk);

  const riskLevels = [
    { label: '낮음 (0~29%)', color: '#4CAF7D', tips: ['예방 중심의 건강 관리 유지', '정기 검진 연 1회', '현재 좋은 생활습관 지속'] },
    { label: '주의 (30~59%)', color: '#E8A038', tips: ['생활습관 집중 개선 필요', '영양제 보충 시작 권장', '3개월 내 재검사 권장'] },
    { label: '관리 필요 (60~100%)', color: '#D4504A', tips: ['전문의 상담 우선 권장', '호르몬 수치 혈액 검사', '적극적 치료 개입 검토'] },
  ];

  return `
<div class="page">
  <div class="page-header">
    <div class="ph-logo">웰핏<span>+</span> CHECK-UP</div>
    <div class="ph-info">${userName} 님 · 만 ${actualAge}세<br>${todayShort}</div>
  </div>
  <div class="section-eyebrow">08 &nbsp; 호르몬 균형 가이드</div>
  <h2 class="section-title">${isMale ? '남성 호르몬' : '여성 호르몬'} 관리 가이드</h2>
  <p class="section-desc">현재 분석 결과와 연령을 종합한 맞춤 호르몬 관리 가이드입니다.</p>

  <div class="hormone-stage-card">
    <div class="hsc-badge" style="background:${rc.color}20;color:${rc.color}">${stage.stage}</div>
    <p class="hsc-desc">${stage.desc}</p>
    <div class="hsc-meter">
      <div class="hsc-meter-label">${isMale ? '테스토스테론 저하' : '에스트로겐 저하'} 참고 지수</div>
      <div class="hsc-bar-wrap">
        <div class="hsc-bar" style="width:${mainRisk}%;background:linear-gradient(90deg,${rc.color}80,${rc.color})"></div>
        <div class="hsc-tick" style="left:30%"></div>
        <div class="hsc-tick" style="left:60%"></div>
      </div>
      <div class="hsc-bar-labels"><span>양호</span><span>주의</span><span>관리 필요</span></div>
      <div class="hsc-value" style="color:${rc.color}">${mainRisk}% — ${rc.label}</div>
    </div>
    <div class="hsc-meter" style="margin-top:16px">
      <div class="hsc-meter-label">코르티솔 과다 참고 지수</div>
      <div class="hsc-bar-wrap">
        <div class="hsc-bar" style="width:${cortisolRisk}%;background:linear-gradient(90deg,${rcc.color}80,${rcc.color})"></div>
        <div class="hsc-tick" style="left:30%"></div>
        <div class="hsc-tick" style="left:60%"></div>
      </div>
      <div class="hsc-bar-labels"><span>양호</span><span>주의</span><span>관리 필요</span></div>
      <div class="hsc-value" style="color:${rcc.color}">${cortisolRisk}% — ${rcc.label}</div>
    </div>
    <div class="hsc-meter" style="margin-top:16px">
      <div class="hsc-meter-label">인슐린 저항성 참고 지수</div>
      <div class="hsc-bar-wrap">
        <div class="hsc-bar" style="width:${insulinRisk}%;background:linear-gradient(90deg,${rci.color}80,${rci.color})"></div>
        <div class="hsc-tick" style="left:30%"></div>
        <div class="hsc-tick" style="left:60%"></div>
      </div>
      <div class="hsc-bar-labels"><span>양호</span><span>주의</span><span>관리 필요</span></div>
      <div class="hsc-value" style="color:${rci.color}">${insulinRisk}% — ${rci.label}</div>
    </div>
    <div class="hsc-meter" style="margin-top:16px">
      <div class="hsc-meter-label">갑상선 호르몬 불균형 참고 지수</div>
      <div class="hsc-bar-wrap">
        <div class="hsc-bar" style="width:${thyroidRisk}%;background:linear-gradient(90deg,${rct.color}80,${rct.color})"></div>
        <div class="hsc-tick" style="left:30%"></div>
        <div class="hsc-tick" style="left:60%"></div>
      </div>
      <div class="hsc-bar-labels"><span>양호</span><span>주의</span><span>관리 필요</span></div>
      <div class="hsc-value" style="color:${rct.color}">${thyroidRisk}% — ${rct.label}</div>
    </div>
    <div class="hsc-meter" style="margin-top:16px">
      <div class="hsc-meter-label">DHEA 저하 참고 지수</div>
      <div class="hsc-bar-wrap">
        <div class="hsc-bar" style="width:${dheaRisk}%;background:linear-gradient(90deg,${rcd.color}80,${rcd.color})"></div>
        <div class="hsc-tick" style="left:30%"></div>
        <div class="hsc-tick" style="left:60%"></div>
      </div>
      <div class="hsc-bar-labels"><span>양호</span><span>주의</span><span>관리 필요</span></div>
      <div class="hsc-value" style="color:${rcd.color}">${dheaRisk}% — ${rcd.label}</div>
    </div>
  </div>

  <div class="hormone-tips-grid">
    <div class="ht-section">
      <div class="ht-title">✅ 현재 단계 맞춤 실천법</div>
      <ul class="ht-list">
        ${stage.tips.map(t => `<li>${t}</li>`).join('')}
      </ul>
    </div>
    <div class="ht-section">
      <div class="ht-title">🍽️ 호르몬 균형 식품</div>
      <ul class="ht-list">
        ${isMale
          ? ['굴·조개류 (아연 → 테스토스테론)', '달걀·소고기 (콜레스테롤 → 스테로이드 호르몬 전구체)', '십자화과 채소 (에스트로겐 균형)', '아보카도 (건강한 지방 공급)'].map(t => `<li>${t}</li>`).join('')
          : ['두부·콩류 (이소플라본 → 에스트로겐 유사 작용)', '아마씨 (리그난 → 호르몬 균형)', '연어·정어리 (오메가3 → 염증 감소)', '브로콜리·케일 (DIM → 에스트로겐 대사)'].map(t => `<li>${t}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="risk-level-guide">
    <div class="rlg-title">📊 참고 지수 단계별 행동 가이드</div>
    <div class="rlg-levels">
      ${riskLevels.map(rl => `
      <div class="rlg-level" style="border-color:${rl.color}40">
        <div class="rlg-level-badge" style="background:${rl.color};color:#fff">${rl.label}</div>
        <ul class="rlg-tips">
          ${rl.tips.map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>`).join('')}
    </div>
  </div>

  <div class="disclaimer">
    본 리포트는 의료 진단을 대체하지 않으며, 생활습관 코칭 및 건강 관리 참고 자료를 제공합니다.<br>
    웰핏+ CHECK-UP | 대한민국 특허 출원 완료 · 출원인: 김성훈 | © 2026
  </div>
</div>`;
}

function buildDietSection(report, gender, actualAge, userName, todayShort) {
  const deficientFoods = getDietDeficientFoods(report, gender);
  const isMale = gender === 'male';

  const avoidFoods = [
    { icon: '🍭', name: '정제 당류', reason: '혈당 급등 → 인슐린 저항성 → 호르몬 불균형 악화' },
    { icon: '🍟', name: '트랜스지방', reason: '염증 촉진 → 세포막 손상 → 영양소 흡수 방해' },
    { icon: '☕', name: '과도한 카페인', reason: '코르티솔 자극 → 수면 방해 → 마그네슘·칼슘 배설 증가' },
    { icon: '🍺', name: '알코올', reason: '간 해독 부담 → 아연·마그네슘 배설 → 호르몬 교란' },
  ];

  const mealPlan = isMale ? {
    breakfast: ['달걀 2개 (스크램블 또는 삶은 것)', '통밀 토스트 1장', '아보카도 1/2개', '블랙커피 또는 그린티'],
    lunch: ['현미밥 1/2공기', '소고기 구이 100g 또는 두부 150g', '시금치·브로콜리 나물', '된장국'],
    dinner: ['구운 연어 또는 고등어 120g', '퀴노아 또는 귀리밥', '아스파라거스·파프리카 볶음', '채소 샐러드'],
    snack: ['아몬드·호두 한 줌 (30g)', '그릭 요거트 100g'],
  } : {
    breakfast: ['달걀 1개 + 두부 50g', '귀리죽 또는 통밀 토스트', '키위 1개 (비타민C → 철분 흡수)', '두유 또는 저지방 우유'],
    lunch: ['현미밥 1/2공기', '소고기 또는 굴·조개 요리', '시금치·깻잎 나물 (철분)', '된장국 (이소플라본)'],
    dinner: ['연어 또는 고등어 구이', '렌틸콩 샐러드', '브로콜리·케일 볶음 (DIM)', '미역국 (요오드·칼슘)'],
    snack: ['아마씨 뿌린 그릭 요거트', '블루베리·딸기 한 컵'],
  };

  return `
<div class="page">
  <div class="page-header">
    <div class="ph-logo">웰핏<span>+</span> CHECK-UP</div>
    <div class="ph-info">${userName} 님 · 만 ${actualAge}세<br>${todayShort}</div>
  </div>
  <div class="section-eyebrow">09 &nbsp; 식단 가이드</div>
  <h2 class="section-title">결핍 영양소 보충 식단 가이드</h2>
  <p class="section-desc">분석된 결핍 위험 영양소를 식품으로 보충하는 맞춤 가이드입니다.</p>

  <div class="diet-deficient-section">
    <div class="dds-title">🟢 적극 섭취 권장 식품</div>
    ${deficientFoods.map(item => `
    <div class="dds-card">
      <div class="dds-header">
        <span class="dds-icon">${item.icon}</span>
        <span class="dds-nutrient">${item.nutrient} 보충</span>
      </div>
      <div class="dds-foods">
        ${item.foods.map(f => `<span class="dds-food-tag">${f}</span>`).join('')}
      </div>
      <div class="dds-avoid">⚠️ 피할 것: ${item.avoid}</div>
    </div>`).join('')}
  </div>

  <div class="avoid-section">
    <div class="avoid-title">🚫 피해야 할 식품</div>
    <div class="avoid-grid">
      ${avoidFoods.map(af => `
      <div class="avoid-card">
        <div class="avoid-icon">${af.icon}</div>
        <div class="avoid-name">${af.name}</div>
        <div class="avoid-reason">${af.reason}</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="meal-plan-section">
    <div class="mps-title">🍽️ 하루 식단 예시 (${isMale ? '남성' : '여성'} 맞춤)</div>
    <div class="mps-grid">
      <div class="mps-meal">
        <div class="mps-meal-label" style="color:#E8A038">🌅 아침</div>
        <ul>${mealPlan.breakfast.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>
      <div class="mps-meal">
        <div class="mps-meal-label" style="color:#4CAF7D">☀️ 점심</div>
        <ul>${mealPlan.lunch.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>
      <div class="mps-meal">
        <div class="mps-meal-label" style="color:#8B5E83">🌙 저녁</div>
        <ul>${mealPlan.dinner.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>
      <div class="mps-meal">
        <div class="mps-meal-label" style="color:#C8956C">🍎 간식</div>
        <ul>${mealPlan.snack.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>
    </div>
  </div>

  <div class="disclaimer">
    본 리포트는 의료 진단을 대체하지 않으며, 생활습관 코칭 및 건강 관리 참고 자료를 제공합니다.<br>
    웰핏+ CHECK-UP | 대한민국 특허 출원 완료 · 출원인: 김성훈 | © 2026
  </div>
</div>`;
}

function buildChallengeSection(report, actualAge, userName, todayShort) {
  const healthAge = report.healthAge ?? parseInt(actualAge);
  const targetAge = Math.max(healthAge - 3, parseInt(actualAge) - 10);
  const ageDiff = parseInt(actualAge) - healthAge;
  const today = new Date();
  const month1 = new Date(today); month1.setMonth(month1.getMonth() + 1);
  const month2 = new Date(today); month2.setMonth(month2.getMonth() + 2);
  const month3 = new Date(today); month3.setMonth(month3.getMonth() + 3);
  const fmt = (d) => `${d.getFullYear()}년 ${d.getMonth() + 1}월`;

  const checkpoints = [
    {
      month: fmt(month1), label: '1개월 — 기초 다지기', color: '#4CAF7D', target: `건강나이 ${healthAge}세 유지`,
      goals: ['수면 규칙화 (취침·기상 시간 고정)', '영양제 루틴 정착 (빠짐없이 30일)', '물 하루 2L 습관화', '주 3회 이상 운동 달성'],
      metric: `현재 건강나이 ${healthAge}세`,
    },
    {
      month: fmt(month2), label: '2개월 — 변화 가속', color: '#E8A038', target: `건강나이 ${Math.round((healthAge + targetAge) / 2)}세 목표`,
      goals: ['영양 결핍 지표 개선 (재측정)', '운동 강도 업그레이드', '스트레스 관리 루틴 정착', '피부·손톱 변화 육안 확인'],
      metric: `목표: ${Math.round((healthAge + targetAge) / 2)}세`,
    },
    {
      month: fmt(month3), label: '3개월 — 목표 달성', color: '#C8956C', target: `건강나이 ${targetAge}세 달성`,
      goals: ['웰핏+ 재검사로 건강나이 확인', '호르몬 참고 지수 재측정', '3개월 전후 비교 분석', '다음 3개월 목표 설정'],
      metric: `목표: ${targetAge}세 (−${healthAge - targetAge}세)`,
    },
  ];

  return `
<div class="page">
  <div class="page-header">
    <div class="ph-logo">웰핏<span>+</span> CHECK-UP</div>
    <div class="ph-info">${userName} 님 · 만 ${actualAge}세<br>${todayShort}</div>
  </div>
  <div class="section-eyebrow">10 &nbsp; 3개월 건강나이 챌린지</div>
  <h2 class="section-title">건강나이 ${healthAge}세 → ${targetAge}세 도전!</h2>
  <p class="section-desc">3개월 집중 관리로 건강나이 ${healthAge - targetAge}세 감소를 목표로 합니다. 월별 체크포인트로 진행 상황을 관리하세요.</p>

  <div class="challenge-hero">
    <div class="ch-now">
      <div class="ch-label">현재 건강나이</div>
      <div class="ch-num" style="color:#A8998A">${healthAge}<span>세</span></div>
      <div class="ch-sub">${ageDiff >= 0 ? `실제 나이 대비 ${ageDiff}세 젊음` : `실제 나이 대비 ${Math.abs(ageDiff)}세 높음`}</div>
    </div>
    <div class="ch-arrow">
      <div class="ch-arrow-inner">
        <div style="font-size:24px">→</div>
        <div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:4px">3개월 후</div>
      </div>
    </div>
    <div class="ch-target">
      <div class="ch-label">목표 건강나이</div>
      <div class="ch-num" style="color:var(--rose)">${targetAge}<span>세</span></div>
      <div class="ch-sub" style="color:var(--rose)">−${healthAge - targetAge}세 감소 목표</div>
    </div>
    <div class="ch-comment">
      <div class="ch-comment-title">💡 챌린지 성공 열쇠</div>
      <ul>
        <li>매일 작은 실천 > 가끔 완벽한 실천</li>
        <li>결과보다 과정(습관)에 집중</li>
        <li>주 1회 진행 상황 기록·점검</li>
        <li>3개월 후 웰핏+ 재검사로 확인</li>
      </ul>
    </div>
  </div>

  <div class="challenge-timeline">
    ${checkpoints.map((cp, i) => `
    <div class="ctl-item">
      <div class="ctl-dot" style="background:${cp.color}"></div>
      ${i < 2 ? `<div class="ctl-line" style="background:linear-gradient(180deg,${cp.color},${checkpoints[i+1].color})"></div>` : ''}
      <div class="ctl-card" style="border-color:${cp.color}40">
        <div class="ctl-month" style="color:${cp.color}">${cp.month}</div>
        <div class="ctl-label">${cp.label}</div>
        <div class="ctl-target" style="background:${cp.color}15;color:${cp.color}">🎯 ${cp.target}</div>
        <ul class="ctl-goals">
          ${cp.goals.map(g => `<li>✓ ${g}</li>`).join('')}
        </ul>
        <div class="ctl-metric">${cp.metric}</div>
      </div>
    </div>`).join('')}
  </div>

  <div class="challenge-footer">
    <div class="cf-box">
      <div class="cf-icon">🏆</div>
      <div class="cf-text">
        <strong>${userName} 님의 3개월 목표</strong><br>
        ${fmt(month3)}까지 건강나이 <strong style="color:var(--rose)">${targetAge}세</strong> 달성<br>
        지금 이 리포트가 그 여정의 시작입니다.
      </div>
    </div>
  </div>

  <div class="disclaimer" style="margin-top:24px">
    본 리포트는 의료 진단을 대체하지 않으며, 생활습관 코칭 및 건강 관리 참고 자료를 제공합니다.<br>
    웰핏+ CHECK-UP | 대한민국 특허 출원 완료 · 출원인: 김성훈 | © 2026
  </div>
</div>`;
}

export function generateReportHTML({ report, actualAge, gender, userName, userCity, shareId, shareUrl }) {
  const isMale = gender === 'male';
  const genderLabel = isMale ? '남성' : '여성';
  const avatar = isMale ? '👨' : '🌸';
  const ageDiff = parseInt(actualAge) - report.healthAge;
  const ageDiffLabel = ageDiff > 0 ? `✓ &nbsp;−${ageDiff}세 더 젊음` : ageDiff < 0 ? `⚠ &nbsp;+${Math.abs(ageDiff)}세 높음` : '실제 나이와 동일';
  const ageDiffColor = ageDiff > 0 ? '#4CAF7D' : ageDiff < 0 ? '#D4504A' : '#888';
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const todayShort = new Date().toLocaleDateString('ko-KR').replace(/\. /g, '.').replace('.', '');

  const hormoneRows = getHormoneRows(report.hormones || {}, gender);
  const nutrientRows = getNutrientRows(report.nutrients || {});
  const maxHormoneRisk = Math.max(...hormoneRows.map(h => h.value));
  const nutrientCount = nutrientRows.filter(n => n.value >= 30).length;
  const mainHormone = hormoneRows[0];

  const hormoneCardsHTML = hormoneRows.map(h => {
    const r = getRiskColor(h.value);
    return `
    <div class="risk-card">
      <div class="risk-card-header">
        <div><div class="risk-name">${h.name}</div><div class="risk-sub">${h.sub}</div></div>
        <div class="risk-pct" style="color:${r.color}">${h.value}%</div>
      </div>
      <div class="risk-bar-wrap"><div class="risk-bar" style="width:${h.value}%;background:${r.color}"></div></div>
      <div class="risk-status" style="color:${r.color}"><div class="status-dot" style="background:${r.color}"></div>${r.label} · ${h.comment || ''}</div>
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

  const hasFaceAnalysis = report.faceAnalysis && typeof report.faceAnalysis === 'object';
  const hasNailAnalysis = report.nailAnalysis && typeof report.nailAnalysis === 'object';
  const faceFields = hasFaceAnalysis ? [
    { icon: '💧', label: '수분도', value: report.faceAnalysis.moisture },
    { icon: '✨', label: '피부 톤 균일도', value: report.faceAnalysis.tone },
    { icon: '👁️', label: '다크서클', value: report.faceAnalysis.darkCircle },
    { icon: '🔬', label: '모공 상태', value: report.faceAnalysis.pore },
    { icon: '📊', label: '주름 분포', value: report.faceAnalysis.wrinkle },
  ] : [];
  const nailFields = hasNailAnalysis ? [
    { icon: '🎨', label: '색상/강도', value: report.nailAnalysis.color },
    { icon: '🌿', label: '큐티클 상태', value: report.nailAnalysis.cuticle },
    { icon: '〰️', label: '세로줄', value: report.nailAnalysis.ridge },
    { icon: '🌙', label: '반달(루눌라)', value: report.nailAnalysis.lunula },
  ] : [];
  const faceCardsHTML = faceFields.filter(f => f.value).map(f => `
      <div class="ia-card">
        <div class="ia-card-icon">${f.icon}</div>
        <div class="ia-card-label">${f.label}</div>
        <div class="ia-card-content">${f.value}</div>
      </div>`).join('');
  const nailCardsHTML = nailFields.filter(f => f.value).map(f => `
      <div class="ia-card">
        <div class="ia-card-icon">${f.icon}</div>
        <div class="ia-card-label">${f.label}</div>
        <div class="ia-card-content">${f.value}</div>
      </div>`).join('');
  const imageAnalysisHTML = (hasFaceAnalysis || hasNailAnalysis) ? `
  <div class="page">
    <div class="page-header">
      <div class="ph-logo">웰핏<span>+</span> CHECK-UP</div>
      <div class="ph-info">${userName} 님 · 만 ${actualAge}세<br>${todayShort}</div>
    </div>
    <div class="section-eyebrow">02 &nbsp; 이미지 분석 결과</div>
    <h2 class="section-title">AI 이미지 분석 결과</h2>
    <p class="section-desc">얼굴 피부 상태와 손톱 상태를 AI가 분석한 결과입니다.</p>
    ${hasFaceAnalysis ? `
    <div class="img-analysis-section">
      <div class="ia-section-header"><span>🤳</span><span>얼굴 피부 분석</span></div>
      <div class="ia-cards">${faceCardsHTML}</div>
    </div>` : ''}
    ${hasNailAnalysis ? `
    <div class="img-analysis-section">
      <div class="ia-section-header"><span>💅</span><span>손톱 상태 분석</span></div>
      <div class="ia-cards">${nailCardsHTML}</div>
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
.nutrition-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
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

/* ===== SECTION 05 — 생활습관 로드맵 ===== */
.lifestyle-radar{display:flex;flex-direction:column;gap:16px;margin-bottom:28px}
.ls-area-card{background:#fff;border:2px solid var(--border);border-radius:16px;padding:20px 24px}
.ls-area-top{display:flex;align-items:center;gap:14px;margin-bottom:14px}
.ls-icon-wrap{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.ls-area-name{font-size:15px;font-weight:700;color:var(--text-1);margin-bottom:2px}
.ls-area-status{font-size:12px;font-weight:600}
.ls-score{font-size:32px;font-weight:700;margin-left:auto;line-height:1}
.ls-bar-wrap{height:6px;background:var(--warm-gray);border-radius:3px;overflow:hidden;margin-bottom:12px}
.ls-bar{height:100%;border-radius:3px;transition:width .3s}
.ls-tips{list-style:none;display:flex;flex-direction:column;gap:4px}
.ls-tips li{font-size:12px;color:var(--text-2);padding-left:14px;position:relative;line-height:1.5}
.ls-tips li::before{content:'›';position:absolute;left:0;color:var(--rose);font-weight:700}
.priority-banner{background:linear-gradient(135deg,#1A1210,#2D1F18);border-radius:16px;padding:24px 28px}
.priority-title{font-size:13px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,.7);margin-bottom:16px}
.priority-items{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.priority-item{display:flex;flex-direction:column;align-items:center;gap:8px}
.priority-rank{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff}
.priority-label{font-size:12px;color:rgba(255,255,255,.7);font-weight:600}
.priority-score{font-size:18px;font-weight:700}

/* ===== SECTION 06 — 주차별 실천 계획 ===== */
.week-section{border:2px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:20px}
.week-header{display:flex;align-items:center;gap:12px;padding:14px 20px}
.week-icon{font-size:18px}
.week-title{font-size:14px;font-weight:700}
.week-days{display:flex;flex-direction:column;gap:0}
.week-day-row{display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:12px;padding:11px 20px;border-top:1px solid var(--border);background:#fff}
.week-day-row:hover{background:var(--cream)}
.week-day-num{width:32px;height:24px;border-radius:6px;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center}
.week-day-content{font-size:13px;color:var(--text-2);line-height:1.5}
.week-day-content strong{color:var(--text-1);font-weight:600}

/* ===== SECTION 07 — 영양제 가이드 ===== */
.supp-cards{display:flex;flex-direction:column;gap:20px;margin-bottom:28px}
.supp-card{background:#fff;border:2px solid var(--border);border-radius:18px;padding:24px;position:relative;overflow:hidden}
.supp-rank-badge{position:absolute;top:16px;right:16px;font-size:10px;font-weight:700;letter-spacing:1px;padding:4px 10px;border-radius:12px}
.supp-top{display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-right:80px}
.supp-icon-circle{width:52px;height:52px;border-radius:14px;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.supp-name{font-size:17px;font-weight:700;color:var(--text-1);margin-bottom:4px}
.supp-benefit{font-size:12px;color:var(--text-2);line-height:1.5}
.supp-risk-badge{font-size:11px;font-weight:700;padding:4px 10px;border-radius:8px;margin-left:auto;white-space:nowrap}
.supp-details{display:flex;flex-direction:column;gap:8px;background:var(--warm-gray);border-radius:12px;padding:14px 18px}
.supp-detail-item{display:flex;align-items:baseline;gap:8px;font-size:13px}
.supp-detail-icon{font-size:14px;flex-shrink:0}
.supp-detail-label{font-size:11px;font-weight:600;color:var(--text-3);width:64px;flex-shrink:0}
.supp-detail-val{color:var(--text-2);line-height:1.5}
.supp-detail-item.caution .supp-detail-val{color:#E8A038}
.supp-timing-chart{background:linear-gradient(135deg,#1A1210,#2D1F18);border-radius:16px;padding:24px 28px}
.stc-title{font-size:13px;font-weight:700;color:rgba(255,255,255,.7);margin-bottom:16px}
.stc-rows{display:flex;flex-direction:column;gap:12px}
.stc-row{display:flex;align-items:center;gap:16px}
.stc-time{font-size:11px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:.5px;width:72px;flex-shrink:0}
.stc-items{display:flex;flex-wrap:wrap;gap:8px}
.stc-pill{font-size:12px;font-weight:600;background:rgba(255,255,255,.1);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.15);padding:4px 12px;border-radius:20px}

/* ===== SECTION 08 — 호르몬 가이드 ===== */
.hormone-stage-card{background:#fff;border:2px solid var(--border);border-radius:18px;padding:28px 32px;margin-bottom:24px}
.hsc-badge{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.5px;padding:6px 14px;border-radius:20px;margin-bottom:14px}
.hsc-desc{font-size:14px;color:var(--text-2);line-height:1.8;margin-bottom:20px}
.hsc-meter{margin-bottom:8px}
.hsc-meter-label{font-size:12px;font-weight:600;color:var(--text-2);margin-bottom:8px}
.hsc-bar-wrap{height:10px;background:var(--warm-gray);border-radius:5px;overflow:visible;position:relative;margin-bottom:4px}
.hsc-bar{height:100%;border-radius:5px;transition:width .3s}
.hsc-tick{position:absolute;top:-3px;width:2px;height:16px;background:var(--border);border-radius:1px}
.hsc-bar-labels{display:flex;justify-content:space-between;font-size:10px;color:var(--text-3);padding:0 2px;margin-bottom:4px}
.hsc-value{font-size:13px;font-weight:700}
.hormone-tips-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.ht-section{background:#fff;border:1px solid var(--border);border-radius:14px;padding:20px}
.ht-title{font-size:12px;font-weight:700;color:var(--text-1);margin-bottom:12px}
.ht-list{list-style:none;display:flex;flex-direction:column;gap:6px}
.ht-list li{font-size:12px;color:var(--text-2);padding-left:14px;position:relative;line-height:1.5}
.ht-list li::before{content:'✓';position:absolute;left:0;color:var(--safe);font-weight:700;font-size:10px}
.risk-level-guide{background:var(--warm-gray);border-radius:16px;padding:24px}
.rlg-title{font-size:13px;font-weight:700;color:var(--text-1);margin-bottom:16px}
.rlg-levels{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.rlg-level{background:#fff;border:2px solid var(--border);border-radius:12px;padding:16px}
.rlg-level-badge{font-size:10px;font-weight:700;padding:4px 10px;border-radius:8px;color:#fff;margin-bottom:10px;display:inline-block}
.rlg-tips{list-style:none;display:flex;flex-direction:column;gap:5px}
.rlg-tips li{font-size:11px;color:var(--text-2);padding-left:12px;position:relative;line-height:1.4}
.rlg-tips li::before{content:'·';position:absolute;left:0;color:var(--text-3);font-weight:700}

/* ===== SECTION 09 — 식단 가이드 ===== */
.diet-deficient-section{margin-bottom:28px}
.dds-title{font-size:13px;font-weight:700;color:var(--text-1);margin-bottom:14px;display:flex;align-items:center;gap:8px}
.dds-card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:12px}
.dds-header{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.dds-icon{font-size:18px}
.dds-nutrient{font-size:13px;font-weight:700;color:var(--text-1)}
.dds-foods{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.dds-food-tag{font-size:12px;background:var(--mint-light);color:#2D7A5F;border:1px solid #B8DDD3;padding:4px 10px;border-radius:8px;font-weight:500}
.dds-avoid{font-size:11px;color:#E8A038;background:#FFF3E0;border-radius:6px;padding:6px 10px}
.avoid-section{margin-bottom:28px}
.avoid-title{font-size:13px;font-weight:700;color:var(--text-1);margin-bottom:14px}
.avoid-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.avoid-card{background:#fff;border:1px solid #F0D8D6;border-left:3px solid var(--danger);border-radius:0 12px 12px 0;padding:14px 16px}
.avoid-icon{font-size:20px;margin-bottom:6px}
.avoid-name{font-size:13px;font-weight:700;color:var(--text-1);margin-bottom:4px}
.avoid-reason{font-size:11px;color:var(--text-2);line-height:1.5}
.meal-plan-section{background:var(--warm-gray);border-radius:16px;padding:24px}
.mps-title{font-size:13px;font-weight:700;color:var(--text-1);margin-bottom:16px}
.mps-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.mps-meal{background:#fff;border-radius:12px;padding:16px 18px}
.mps-meal-label{font-size:12px;font-weight:700;margin-bottom:10px}
.mps-meal ul{list-style:none;display:flex;flex-direction:column;gap:5px}
.mps-meal li{font-size:12px;color:var(--text-2);padding-left:12px;position:relative;line-height:1.4}
.mps-meal li::before{content:'·';position:absolute;left:0;color:var(--rose);font-weight:700}

/* ===== SECTION 10 — 3개월 챌린지 ===== */
.challenge-hero{background:linear-gradient(135deg,#1A1210 0%,#2D1F18 100%);border-radius:20px;padding:36px 40px;display:flex;align-items:center;gap:24px;margin-bottom:32px;flex-wrap:wrap}
.ch-now,.ch-target{flex:1;min-width:120px}
.ch-label{font-size:10px;letter-spacing:2px;color:rgba(255,255,255,.4);text-transform:uppercase;margin-bottom:6px}
.ch-num{font-size:64px;font-weight:700;line-height:1}
.ch-num span{font-size:20px;font-weight:400;color:rgba(255,255,255,.5)}
.ch-sub{font-size:12px;color:rgba(255,255,255,.4);margin-top:4px}
.ch-arrow{flex-shrink:0;display:flex;align-items:center}
.ch-arrow-inner{text-align:center;color:var(--rose);font-size:20px;font-weight:700}
.ch-comment{flex:2;min-width:180px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:18px 22px}
.ch-comment-title{font-size:12px;font-weight:700;color:var(--rose);margin-bottom:10px}
.ch-comment ul{list-style:none;display:flex;flex-direction:column;gap:6px}
.ch-comment li{font-size:12px;color:rgba(255,255,255,.6);padding-left:14px;position:relative;line-height:1.5}
.ch-comment li::before{content:'✓';position:absolute;left:0;color:var(--safe);font-size:10px;font-weight:700}
.challenge-timeline{display:flex;flex-direction:column;gap:0;position:relative;padding-left:32px}
.ctl-item{position:relative;padding-bottom:8px}
.ctl-dot{width:14px;height:14px;border-radius:50%;position:absolute;left:-32px;top:16px;z-index:2;border:2px solid var(--cream)}
.ctl-line{width:2px;position:absolute;left:-26px;top:30px;bottom:0;z-index:1}
.ctl-card{background:#fff;border:2px solid var(--border);border-radius:16px;padding:20px 24px;margin-bottom:16px}
.ctl-month{font-size:11px;font-weight:700;letter-spacing:1px;margin-bottom:4px}
.ctl-label{font-size:15px;font-weight:700;color:var(--text-1);margin-bottom:12px}
.ctl-target{display:inline-block;font-size:12px;font-weight:700;padding:5px 12px;border-radius:8px;margin-bottom:12px}
.ctl-goals{list-style:none;display:flex;flex-direction:column;gap:5px;margin-bottom:12px}
.ctl-goals li{font-size:12px;color:var(--text-2);line-height:1.5}
.ctl-metric{font-size:11px;color:var(--text-3);font-weight:600;letter-spacing:.5px}
.challenge-footer{margin-top:8px}
.cf-box{background:linear-gradient(135deg,var(--rose-ultra),var(--mauve-light));border:2px solid var(--rose-light);border-radius:16px;padding:24px 28px;display:flex;align-items:center;gap:20px}
.cf-icon{font-size:36px}
.cf-text{font-size:14px;color:var(--text-2);line-height:1.8}
.cf-text strong{color:var(--text-1)}

/* ===== IMAGE ANALYSIS CARDS ===== */
.img-analysis-section{margin-bottom:24px}
.ia-section-header{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--rose);letter-spacing:.5px;background:var(--rose-ultra);border:1px solid #E8D5C0;border-left:4px solid var(--rose);border-radius:0 10px 10px 0;padding:12px 16px;margin-bottom:14px}
.ia-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ia-card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:16px 18px}
.ia-card-icon{font-size:20px;margin-bottom:8px}
.ia-card-label{font-size:11px;font-weight:700;color:var(--rose);letter-spacing:.5px;margin-bottom:6px;text-transform:uppercase}
.ia-card-content{font-size:13px;color:var(--text-2);line-height:1.7}

@media(max-width:600px){
  .cover-body{padding:32px 24px}
  .cover-header{padding:24px 24px 0}
  .cover-metric{padding:20px 24px}
  .page{padding:32px 20px}
  .age-hero{padding:28px 24px;gap:20px}
  .age-num{font-size:52px}
  .risk-grid{grid-template-columns:1fr}
  .nutrition-strip{grid-template-columns:repeat(2,1fr)}
  .plan-row{grid-template-columns:28px 1fr}
  .plan-tag{display:none}
  .priority-items{grid-template-columns:repeat(2,1fr)}
  .hormone-tips-grid{grid-template-columns:1fr}
  .rlg-levels{grid-template-columns:1fr}
  .mps-grid{grid-template-columns:1fr}
  .avoid-grid{grid-template-columns:1fr}
  .challenge-hero{padding:24px 20px;gap:16px}
  .ch-num{font-size:44px}
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
      <em>참고 지수 분석</em><br>
      <span style="font-weight:300;color:rgba(255,255,255,.5);">건강 리포트</span>
    </h1>
    <p class="cover-sub">셀카 한 장 + 18문항 설문 → AI 즉시 분석</p>
    <div class="cover-user-card">
      <div class="cover-avatar">${avatar}</div>
      <div>
        <div class="cover-user-name">${userName} 님</div>
        <div class="cover-user-meta">만 ${actualAge}세 · ${genderLabel} · ${userCity} 거주<br>분석 완료: ${today}</div>
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
      <div class="cm-label">호르몬 참고 지수</div>
      <div class="cm-value cm-rose">${maxHormoneRisk}<span style="font-size:18px;font-weight:400;">%</span></div>
      <div class="cm-sub">${mainHormone.name} 관리 필요</div>
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
  <h2 class="section-title">${ageDiff > 0 ? `실제 나이보다 ${ageDiff}살 더 젊습니다` : ageDiff < 0 ? `건강 나이가 ${Math.abs(ageDiff)}세 높게 나타났습니다` : '실제 나이와 동일합니다'}</h2>
  <p class="section-desc">얼굴 468개 랜드마크, 손톱 상태, 설문 18문항을 AI가 종합 분석한 결과입니다. 건강 나이는 의료 진단이 아닌 생활습관 기반 참고 지표입니다.</p>
  <div class="age-hero">
    <div class="age-hero-glow"></div>
    <div class="age-real"><div class="age-label">실제 나이</div><div class="age-num">${actualAge}</div></div>
    <div class="age-arrow"><i class="fas fa-arrow-right"></i><div class="age-arrow-label">AI 분석</div></div>
    <div class="age-health">
      <div class="age-label">AI 건강 나이</div>
      <div class="age-num">${report.healthAge}</div>
      <div class="age-diff" style="background:${ageDiffColor};color:#fff">${ageDiffLabel}</div>
    </div>
    <div class="age-comment"><p>${report.summary || ''}</p></div>
  </div>

  <div class="section-eyebrow">02 &nbsp; 호르몬 참고 지수</div>
  <h2 class="section-title">호르몬 불균형 참고 지수 분석</h2>
  <p class="section-desc">혈액 채취 없이 얼굴·손톱 이미지와 설문을 AI로 융합 분석한 참고 지표입니다. (특허 출원 기술)</p>
  <div class="risk-grid">${hormoneCardsHTML}</div>

  <div class="section-eyebrow">03 &nbsp; 영양 결핍 참고 지수</div>
  <h2 class="section-title">주요 영양소 결핍 참고 지수</h2>
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
    <div class="plan-header"><div class="plan-header-icon">🌱</div><div class="plan-header-title">Week 1 — 기초 습관 (1~7일)</div></div>
    <div class="plan-rows">${planRowsHTML(planWeek1)}</div>
  </div>
  <div class="plan-section">
    <div class="plan-header"><div class="plan-header-icon">🌿</div><div class="plan-header-title">Week 2 — 심화 관리 (8~14일)</div></div>
    <div class="plan-rows">${planRowsHTML(planWeek2)}</div>
  </div>
  <div class="disclaimer">
    본 리포트는 의료 진단을 대체하지 않으며, 생활습관 코칭 및 건강 관리 참고 자료를 제공합니다.<br>
    웰핏+ CHECK-UP | 대한민국 특허 출원 완료 · 출원인: 김성훈 | © 2026
  </div>
</div>

${buildLifestyleSection(report, actualAge, userName, todayShort)}
${buildWeeklyPlanSection(report, actualAge, userName, todayShort)}
${buildSupplementSection(report, gender, actualAge, userName, todayShort)}
${buildHormoneGuideSection(report, gender, actualAge, userName, todayShort)}
${buildDietSection(report, gender, actualAge, userName, todayShort)}
${buildChallengeSection(report, actualAge, userName, todayShort)}

</body>
</html>`;
}
