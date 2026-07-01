// src/gemini.js
// Gemini API를 직접 호출하지 않고, Firebase Functions 프록시를 경유한다.
// API 키는 클라이언트에 절대 노출되지 않으며 Functions 서버 환경에만 존재한다.

// 프로젝트 ID에 맞춰 Functions 엔드포인트 URL을 구성한다.
// 배포 리전은 firebase functions:config 기본값(us-central1)을 따른다.
const FUNCTIONS_BASE_URL = import.meta.env.VITE_FUNCTIONS_URL ||
  `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net`;
const ANALYZE_HEALTH_URL = `${FUNCTIONS_BASE_URL}/analyzeHealth`;

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function analyzeHealth({ surveyData, faceImage, nailImage, actualAge, gender = 'female' }) {
  try {
    const surveyText = buildSurveyText(surveyData);
    const isMale = gender === 'male';
    const genderLabel = isMale ? '한국 남성' : '한국 여성';
    const roleLabel = isMale ? '남성 건강 라이프스타일 코칭 AI' : '여성 건강 라이프스타일 코칭 AI';
    const menopauseLabel = isMale ? '남성 갱년기(안드로포즈)' : '여성 갱년기';

    const hormonePrompt = isMale
      ? `"hormones": {
    "testosterone": <테스토스테론 저하 참고 지수 0-100>,
    "cortisol": <코르티솔 과다 참고 지수 0-100>,
    "insulin": <인슐린 저항성 참고 지수 0-100>,
    "thyroid": <갑상선 호르몬 불균형 참고 지수 0-100>,
    "dhea": <DHEA 저하 참고 지수 0-100>,
    "growthHormone": <성장호르몬 저하 참고 지수 0-100>,
    "testosteroneComment": "<생활습관 개선 조언 1문장. 반드시 '~하면 도움이 될 수 있어요' '~을 챙겨보세요' 등 완곡한 표현 사용. '정상 범위' '경계 범위' '수치가 낮다' '진단' '치료' '확인됩니다' 등 의료적 판정 표현 절대 사용 금지>",
    "cortisolComment": "<생활습관 개선 조언 1문장. 반드시 '~하면 도움이 될 수 있어요' '~을 챙겨보세요' 등 완곡한 표현 사용. '정상 범위' '경계 범위' '수치가 높다' '진단' '치료' '확인됩니다' 등 의료적 판정 표현 절대 사용 금지>",
    "insulinComment": "<생활습관 개선 조언 1문장. 반드시 '~하면 도움이 될 수 있어요' '~을 챙겨보세요' 등 완곡한 표현 사용. '정상 범위' '경계 범위' '진단' '치료' '확인됩니다' 등 의료적 판정 표현 절대 사용 금지>",
    "thyroidComment": "<생활습관 개선 조언 1문장. 반드시 '~하면 도움이 될 수 있어요' '~을 챙겨보세요' 등 완곡한 표현 사용. '정상 범위' '경계 범위' '진단' '치료' '확인됩니다' 등 의료적 판정 표현 절대 사용 금지>",
    "dheaComment": "<생활습관 개선 조언 1문장. 반드시 '~하면 도움이 될 수 있어요' '~을 챙겨보세요' 등 완곡한 표현 사용. '정상 범위' '경계 범위' '진단' '치료' '확인됩니다' 등 의료적 판정 표현 절대 사용 금지>",
    "growthHormoneComment": "<생활습관 개선 조언 1문장. 반드시 '~하면 도움이 될 수 있어요' '~을 챙겨보세요' 등 완곡한 표현 사용. '정상 범위' '경계 범위' '진단' '치료' '확인됩니다' 등 의료적 판정 표현 절대 사용 금지>"
  }`
      : `"hormones": {
    "estrogen": <에스트로겐 부족 참고 지수 0-100>,
    "cortisol": <코르티솔 과다 참고 지수 0-100>,
    "insulin": <인슐린 저항성 참고 지수 0-100>,
    "thyroid": <갑상선 호르몬 불균형 참고 지수 0-100>,
    "dhea": <DHEA 저하 참고 지수 0-100>,
    "progesterone": <프로게스테론 부족 참고 지수 0-100>,
    "estrogenComment": "<생활습관 개선 조언 1문장. 반드시 '~하면 도움이 될 수 있어요' '~을 챙겨보세요' 등 완곡한 표현 사용. '정상 범위' '경계 범위' '수치가 낮다' '진단' '치료' '확인됩니다' 등 의료적 판정 표현 절대 사용 금지>",
    "cortisolComment": "<생활습관 개선 조언 1문장. 반드시 '~하면 도움이 될 수 있어요' '~을 챙겨보세요' 등 완곡한 표현 사용. '정상 범위' '경계 범위' '수치가 높다' '진단' '치료' '확인됩니다' 등 의료적 판정 표현 절대 사용 금지>",
    "insulinComment": "<생활습관 개선 조언 1문장. 반드시 '~하면 도움이 될 수 있어요' '~을 챙겨보세요' 등 완곡한 표현 사용. '정상 범위' '경계 범위' '진단' '치료' '확인됩니다' 등 의료적 판정 표현 절대 사용 금지>",
    "thyroidComment": "<생활습관 개선 조언 1문장. 반드시 '~하면 도움이 될 수 있어요' '~을 챙겨보세요' 등 완곡한 표현 사용. '정상 범위' '경계 범위' '진단' '치료' '확인됩니다' 등 의료적 판정 표현 절대 사용 금지>",
    "dheaComment": "<생활습관 개선 조언 1문장. 반드시 '~하면 도움이 될 수 있어요' '~을 챙겨보세요' 등 완곡한 표현 사용. '정상 범위' '경계 범위' '진단' '치료' '확인됩니다' 등 의료적 판정 표현 절대 사용 금지>",
    "progesteroneComment": "<생활습관 개선 조언 1문장. 반드시 '~하면 도움이 될 수 있어요' '~을 챙겨보세요' 등 완곡한 표현 사용. '정상 범위' '경계 범위' '진단' '치료' '확인됩니다' 등 의료적 판정 표현 절대 사용 금지>"
  }`;

    const nutrientPrompt = `"nutrients": {
    "vitaminD": <비타민D 결핍 참고 지수 0-100>,
    "vitaminB12": <비타민B12 결핍 참고 지수 0-100>,
    "iron": <철분 결핍 참고 지수 0-100>,
    "zinc": <아연 결핍 참고 지수 0-100>,
    "magnesium": <마그네슘 결핍 참고 지수 0-100>,
    "omega3": <오메가3 결핍 참고 지수 0-100>,
    "calcium": <칼슘 결핍 참고 지수 0-100>,
    "vitaminC": <비타민C 결핍 참고 지수 0-100>,
    "vitaminDComment": "<생활습관 개선 조언 1문장. '~을 챙겨보세요' '~하면 도움이 될 수 있어요' 등 완곡 표현 사용. '정상 범위 진입' '정상 범위' '경계 범위' '결핍입니다' '수치' '진단' '치료' 등 의료적 판정 표현 절대 사용 금지>",
    "vitaminB12Comment": "<생활습관 개선 조언 1문장. '~을 챙겨보세요' '~하면 도움이 될 수 있어요' 등 완곡 표현 사용. '정상 범위 진입' '정상 범위' '경계 범위' '결핍입니다' '수치' '진단' '치료' 등 의료적 판정 표현 절대 사용 금지>",
    "ironComment": "<생활습관 개선 조언 1문장. '~을 챙겨보세요' '~하면 도움이 될 수 있어요' 등 완곡 표현 사용. '정상 범위 진입' '정상 범위' '경계 범위' '결핍입니다' '수치' '진단' '치료' 등 의료적 판정 표현 절대 사용 금지>",
    "zincComment": "<생활습관 개선 조언 1문장. '~을 챙겨보세요' '~하면 도움이 될 수 있어요' 등 완곡 표현 사용. '정상 범위 진입' '정상 범위' '경계 범위' '결핍입니다' '수치' '진단' '치료' 등 의료적 판정 표현 절대 사용 금지>",
    "magnesiumComment": "<생활습관 개선 조언 1문장. '~을 챙겨보세요' '~하면 도움이 될 수 있어요' 등 완곡 표현 사용. '정상 범위 진입' '정상 범위' '경계 범위' '결핍입니다' '수치' '진단' '치료' 등 의료적 판정 표현 절대 사용 금지>",
    "omega3Comment": "<생활습관 개선 조언 1문장. '~을 챙겨보세요' '~하면 도움이 될 수 있어요' 등 완곡 표현 사용. '정상 범위 진입' '정상 범위' '경계 범위' '결핍입니다' '수치' '진단' '치료' 등 의료적 판정 표현 절대 사용 금지>",
    "calciumComment": "<생활습관 개선 조언 1문장. '~을 챙겨보세요' '~하면 도움이 될 수 있어요' 등 완곡 표현 사용. '정상 범위 진입' '정상 범위' '경계 범위' '결핍입니다' '수치' '진단' '치료' 등 의료적 판정 표현 절대 사용 금지>",
    "vitaminCComment": "<생활습관 개선 조언 1문장. '~을 챙겨보세요' '~하면 도움이 될 수 있어요' 등 완곡 표현 사용. '정상 범위 진입' '정상 범위' '경계 범위' '결핍입니다' '수치' '진단' '치료' 등 의료적 판정 표현 절대 사용 금지>"
  }`;

    const promptText = `
당신은 ${roleLabel}입니다. 아래 설문 응답과 이미지를 분석하여 생활습관 기반 건강 관리 참고 지수를 산출해주세요. 의료 진단이 아닌 라이프스타일 코칭 참고 자료를 제공합니다.

【 필수 준수 사항 — comment 작성 규칙 】
모든 Comment 필드는 반드시 아래 규칙을 따르세요:
✅ 허용 표현: "~을 챙겨보세요", "~하면 도움이 될 수 있어요", "~을 늘려보세요", "~루틴을 권장해요", "~에 신경 써보세요"
❌ 절대 금지 표현: "정상 범위", "정상 범위 진입", "경계 범위", "수치가 낮다/높다", "결핍입니다", "과다입니다", "진단", "치료", "확인됩니다", "측정 결과", "임상", "검사 수치"
→ Comment는 생활습관 개선 조언 1문장만 작성하며, 의료적 판정·수치 확정·진단 표현은 어떤 형태로도 사용하지 않습니다.

【 분석 대상자 정보 】
- 실제 나이: ${actualAge}세
- 성별: ${genderLabel}
- ${menopauseLabel} 관련 증상 포함 분석

【 설문 응답 (1=전혀 아님, 5=매우 그러함) 】
${surveyText}

${faceImage ? '【 얼굴 이미지 분석 포함 】' : ''}
${nailImage ? '【 손톱 이미지 분석 포함 】' : ''}

다음 JSON 형식으로만 응답해주세요 (마크다운 코드블록 없이, 순수 JSON만):
{
  "healthAge": <AI가 판단한 건강 나이 숫자>,
  "summary": "<전체 건강 상태 요약 2-3문장, 따뜻하고 희망적인 톤>",
  ${hormonePrompt},
  ${nutrientPrompt},
  "faceAnalysis": ${faceImage ? `{
    "moisture": "<피부 수분도 분석>",
    "tone": "<피부 톤 균일도 분석>",
    "darkCircle": "<눈 밑 다크서클 분석>",
    "pore": "<모공 상태 분석>",
    "wrinkle": "<주름 분포 분석>"
  }` : 'null'},
  "nailAnalysis": ${nailImage ? `{
    "color": "<손톱 색상/강도 분석>",
    "cuticle": "<큐티클 상태 분석>",
    "ridge": "<세로줄 분석>",
    "lunula": "<반달(루눌라) 크기 분석>"
  }` : 'null'},
  "plan14days": [
    { "day": 1, "category": "영양", "tip": "<구체적인 실천 가이드>", "emoji": "🥗" },
    { "day": 2, "category": "수면", "tip": "<구체적인 실천 가이드>", "emoji": "😴" },
    { "day": 3, "category": "운동", "tip": "<구체적인 실천 가이드>", "emoji": "🧘" },
    { "day": 4, "category": "영양", "tip": "<구체적인 실천 가이드>", "emoji": "💊" },
    { "day": 5, "category": "마음", "tip": "<구체적인 실천 가이드>", "emoji": "🌸" },
    { "day": 6, "category": "생활", "tip": "<구체적인 실천 가이드>", "emoji": "☀️" },
    { "day": 7, "category": "휴식", "tip": "<구체적인 실천 가이드>", "emoji": "🛁" },
    { "day": 8, "category": "영양", "tip": "<구체적인 실천 가이드>", "emoji": "🥦" },
    { "day": 9, "category": "운동", "tip": "<구체적인 실천 가이드>", "emoji": "🚶" },
    { "day": 10, "category": "수면", "tip": "<구체적인 실천 가이드>", "emoji": "🌙" },
    { "day": 11, "category": "마음", "tip": "<구체적인 실천 가이드>", "emoji": "📖" },
    { "day": 12, "category": "생활", "tip": "<구체적인 실천 가이드>", "emoji": "🌿" },
    { "day": 13, "category": "영양", "tip": "<구체적인 실천 가이드>", "emoji": "🫐" },
    { "day": 14, "category": "점검", "tip": "<2주 마무리 자기점검 가이드>", "emoji": "✨" }
  ],
  "disclaimer": "본 분석 결과는 AI 기반 라이프스타일 코칭 참고 자료이며, 의료 진단을 대체하지 않습니다."
}
`;

    // 이미지는 base64로 변환해서 Functions 프록시로 전달한다.
    // 실제 Gemini API 키 호출은 서버(Functions) 안에서만 일어난다.
    const requestBody = { promptText };

    if (faceImage) {
      requestBody.faceImageBase64 = await fileToBase64(faceImage);
      requestBody.faceImageMimeType = faceImage.type || 'image/jpeg';
    }

    if (nailImage) {
      requestBody.nailImageBase64 = await fileToBase64(nailImage);
      requestBody.nailImageMimeType = nailImage.type || 'image/jpeg';
    }

    // Functions 호출 (503 등 일시 오류 시 자동 재시도 3회)
    let result;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await fetch(ANALYZE_HEALTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      result = await response.json();
      console.log(`attempt ${attempt} status:`, response.status);

      if (response.ok && result.success) break;

      if (response.status === 503 && attempt < 3) {
        console.log(`503 재시도 ${attempt}/3... 5초 대기`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      throw new Error(result.error || `서버 오류 (status ${response.status})`);
    }

    if (!result.success) {
      throw new Error(result.error || '분석 실패');
    }

    const parsed = result.data;
    parsed.gender = gender;

    return { success: true, data: parsed };
  } catch (error) {
    console.error('Gemini API 오류:', error);
    return { success: false, error: error.message };
  }
}

function buildSurveyText(surveyData) {
  const questions = [
    { id: 'sleep1', text: '잠들기 어렵다' },
    { id: 'sleep2', text: '자다가 자주 깬다' },
    { id: 'sleep3', text: '아침에 일어나도 피곤하다' },
    { id: 'diet1', text: '최근 식욕이 변했다 (증가 또는 감소)' },
    { id: 'diet2', text: '체중이 변했다 (증가 또는 감소)' },
    { id: 'diet3', text: '소화가 불편하다 (더부룩함, 속쓰림 등)' },
    { id: 'stress1', text: '집중력이 떨어진다' },
    { id: 'stress2', text: '감정 기복이 심하다' },
    { id: 'stress3', text: '만성 피로를 느낀다' },
    { id: 'meno1', text: '상체나 얼굴에 열감을 느낀다' },
    { id: 'meno2', text: '식은땀이 난다' },
    { id: 'meno3', text: '관절이 불편하다' },
    { id: 'meno4', text: '피부가 건조해지거나 가렵다' },
    { id: 'nutri1', text: '최근 머리카락이 많이 빠진다' },
    { id: 'nutri2', text: '손톱이 잘 부러지거나 변색되었다' },
    { id: 'nutri3', text: '피부가 건조하고 윤기가 없다' },
    { id: 'nutri4', text: '이유 없이 무기력하거나 의욕이 없다' },
    { id: 'extra1', text: '운동을 주 1회 미만으로 한다' },
  ];
  return questions.map((q) => `- ${q.text}: ${surveyData[q.id] || 1}점`).join('\n');
}