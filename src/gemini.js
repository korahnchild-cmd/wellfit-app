// src/gemini.js
// GoogleGenerativeAI 라이브러리 대신 직접 fetch 사용 (AQ. 형식 키 호환)

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

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
    const roleLabel = isMale ? '남성 건강 전문 AI 어드바이저' : '여성 건강 전문 AI 어드바이저';
    const menopauseLabel = isMale ? '남성 갱년기(안드로포즈)' : '여성 갱년기';

    const hormonePrompt = isMale
      ? `"hormones": {
    "testosterone": <테스토스테론 저하 위험도 0-100>,
    "cortisol": <코르티솔 위험도 0-100>,
    "testosteroneComment": "<테스토스테론 관련 짧은 조언>",
    "cortisolComment": "<코르티솔 관련 짧은 조언>"
  }`
      : `"hormones": {
    "cortisol": <코르티솔 위험도 0-100>,
    "estrogen": <에스트로겐 부족 위험도 0-100>,
    "cortisolComment": "<코르티솔 관련 짧은 조언>",
    "estrogenComment": "<에스트로겐 관련 짧은 조언>"
  }`;

    const nutrientPrompt = isMale
      ? `"nutrients": {
    "vitaminD": <비타민D 결핍 위험도 0-100>,
    "zinc": <아연 결핍 위험도 0-100>,
    "magnesium": <마그네슘 결핍 위험도 0-100>,
    "vitaminDComment": "<비타민D 관련 짧은 조언>",
    "zincComment": "<아연 관련 짧은 조언>",
    "magnesiumComment": "<마그네슘 관련 짧은 조언>"
  }`
      : `"nutrients": {
    "vitaminD": <비타민D 결핍 위험도 0-100>,
    "iron": <철분 결핍 위험도 0-100>,
    "zinc": <아연 결핍 위험도 0-100>,
    "vitaminDComment": "<비타민D 관련 짧은 조언>",
    "ironComment": "<철분 관련 짧은 조언>",
    "zincComment": "<아연 관련 짧은 조언>"
  }`;

    const promptText = `
당신은 ${roleLabel}입니다. 아래 설문 응답과 이미지를 분석하여 건강 상태를 평가해주세요.

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
  "faceAnalysis": "<얼굴 이미지에서 관찰된 피부 상태 설명, 이미지 없으면 null>",
  "nailAnalysis": "<손톱 이미지에서 관찰된 상태 설명, 이미지 없으면 null>",
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

    const parts = [{ text: promptText }];

    if (faceImage) {
      const faceBase64 = await fileToBase64(faceImage);
      parts.push({
        inline_data: {
          mime_type: faceImage.type || 'image/jpeg',
          data: faceBase64,
        },
      });
    }

    if (nailImage) {
      const nailBase64 = await fileToBase64(nailImage);
      parts.push({
        inline_data: {
          mime_type: nailImage.type || 'image/jpeg',
          data: nailBase64,
        },
      });
    }

    // fetch 호출 (503 시 자동 재시도 3회) — body는 text()로 한 번만 읽음
    let rawText;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] }),
      });

      rawText = await response.text(); // ← 핵심: body 한 번만 읽기
      console.log(`attempt ${attempt} status:`, response.status);
      console.log('raw response:', rawText.slice(0, 300));

      if (response.ok) break;

      const errData = JSON.parse(rawText);
      if (response.status === 503 && attempt < 3) {
        console.log(`503 재시도 ${attempt}/3... 5초 대기`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      throw new Error(JSON.stringify(errData));
    }

    const data = JSON.parse(rawText);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('응답 텍스트가 없습니다: ' + rawText.slice(0, 200));

    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanedText);
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