const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const { GoogleGenAI } = require("@google/genai");
const admin = require("firebase-admin");
const axios = require("axios");

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

// Gen AI SDK (Vertex AI 백엔드) — 서비스 계정 자동 인증으로 별도 API 키 불필요
// (2026.7.4: @google-cloud/vertexai → @google/genai 마이그레이션)
//
// ⚠️ 지연 초기화(lazy init) 필수: `firebase deploy`는 배포 전 로컬에서 이 파일을
// 한 번 로드해 export된 함수 목록을 분석하는데, 이 로컬 로드 시점은 실제 GCP
// 서비스 계정 인증 환경이 아님. GoogleGenAI({vertexai:true,...})를 모듈
// 최상단(파일 로드 시점)에서 생성하면 인증 정보 탐색이 멈춰 "User code failed
// to load... Timeout after 10000" 배포 오류가 발생함(2026.7.4 실제 재현 확인).
// 따라서 클라이언트 생성을 함수 최초 호출 시점까지 미룸.
const PROJECT_ID = "wellfit-checkup";
const LOCATION = "us-central1";
let _ai = null;
function getAi() {
  if (!_ai) {
    _ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });
  }
  return _ai;
}

// ── 카카오 로그인 커스텀 토큰 생성
exports.kakaoCustomToken = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: "accessToken required" });
  }

  try {
    // 카카오 사용자 정보 조회
    const kakaoRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const kakaoUser = kakaoRes.data;
    const uid = `kakao:${kakaoUser.id}`;
    const email = kakaoUser.kakao_account?.email || null;
    const displayName = kakaoUser.kakao_account?.profile?.nickname || "카카오 사용자";
    const photoURL = kakaoUser.kakao_account?.profile?.profile_image_url || null;

    // Firebase 커스텀 토큰 생성
    const customToken = await admin.auth().createCustomToken(uid, {
      provider: "kakao",
      email,
      displayName,
      photoURL,
    });

    // Firestore 사용자 정보 업데이트
    await admin.firestore().collection("users").doc(uid).set({
      email,
      displayName,
      photoURL,
      provider: "kakao",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.json({ customToken, uid, email, displayName, photoURL });
  } catch (err) {
    console.error("카카오 토큰 오류:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── 네이버 로그인 커스텀 토큰 생성 (code → 토큰 교환 → 사용자 정보 → Firebase 토큰)
exports.naverCustomToken = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, state, clientId, clientSecret, redirectUri } = req.body;
  if (!code) {
    return res.status(400).json({ error: "code required" });
  }

  try {
    // 1. 네이버 액세스 토큰 발급
    const tokenRes = await axios.get("https://nid.naver.com/oauth2.0/token", {
      params: {
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        state,
        redirect_uri: redirectUri,
      },
    });
    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error("네이버 액세스 토큰 발급 실패");

    // 2. 네이버 사용자 정보 조회
    const naverRes = await axios.get("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const naverUser = naverRes.data.response;
    const uid = `naver:${naverUser.id}`;
    const email = naverUser.email || null;
    const displayName = naverUser.name || naverUser.nickname || "네이버 사용자";
    const photoURL = naverUser.profile_image || null;

    // 3. Firebase 커스텀 토큰 생성
    const customToken = await admin.auth().createCustomToken(uid, {
      provider: "naver",
      email,
      displayName,
      photoURL,
    });

    // 4. Firestore 사용자 정보 업데이트
    await admin.firestore().collection("users").doc(uid).set({
      email,
      displayName,
      photoURL,
      provider: "naver",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.json({ customToken, uid, email, displayName, photoURL });
  } catch (err) {
    console.error("네이버 토큰 오류:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── Gemini API 프록시 (Vertex AI 서비스 계정 자동 인증 — API 키 불필요)
// Firebase Functions는 Google Cloud 환경이라 별도 키 없이 Vertex AI Gemini 호출 가능
// 클라이언트에는 Gemini 키가 전혀 노출되지 않음
// (2026.7.4: @google/genai SDK로 마이그레이션 — ai.models.generateContent()
// 호출 방식으로 변경, contents/parts(inlineData 등) 스키마는 기존과 동일)
exports.analyzeHealth = onRequest(
  { cors: true, timeoutSeconds: 120 },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const { promptText, faceImageBase64, faceImageMimeType, nailImageBase64, nailImageMimeType } = req.body;

    if (!promptText) {
      return res.status(400).json({ success: false, error: "promptText required" });
    }

    try {
      const parts = [{ text: promptText }];

      if (faceImageBase64) {
        parts.push({
          inlineData: {
            mimeType: faceImageMimeType || "image/jpeg",
            data: faceImageBase64,
          },
        });
      }

      if (nailImageBase64) {
        parts.push({
          inlineData: {
            mimeType: nailImageMimeType || "image/jpeg",
            data: nailImageBase64,
          },
        });
      }

      // 503 에러 시 최대 3회 재시도
      let responseText;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await getAi().models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: [{ role: "user", parts }],
          });
          // @google/genai는 response.text 축약 게터를 제공 — 혹시 없을 경우
          // candidates 경로로 폴백 (구 SDK와 동일한 응답 스키마 유지)
          responseText = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) break;
          throw new Error("응답 텍스트가 없습니다");
        } catch (err) {
          console.log(`Gen AI 시도 ${attempt} 실패:`, err.message);
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          throw err;
        }
      }

      if (!responseText) {
        throw new Error("응답 텍스트가 없습니다");
      }

      const cleanedText = responseText.replace(/```json\n?|\n?```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanedText);
      } catch {
        // JSON이 아닌 텍스트 응답 시 그대로 반환
        parsed = { rawText: cleanedText };
      }

      return res.json({ success: true, data: parsed });
    } catch (err) {
      console.error("Gen AI 프록시 오류:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ── 파트너 추천인 통계 조회 (Admin SDK — 보안 규칙 우회)
// (2026.7.4) PartnerDashboard.jsx가 클라이언트에서 직접 users 컬렉션을
// where('referredBy', '==', code)로 필드 검색하던 방식은 firestore.rules의
// "users/{uid}는 본인 문서만 read 허용" 규칙과 구조적으로 충돌해 항상
// permission-denied가 났음(2026.7.4 발견, 활성 파트너 없어 실사용 영향은 없었음).
// Admin SDK는 보안 규칙을 우회하므로 서버에서 집계해 필요한 숫자만 반환.
exports.getPartnerStats = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return res.status(401).json({ success: false, error: "인증 토큰이 필요합니다" });
  }

  try {
    // 클라이언트가 보낸 추천코드를 그대로 믿지 않고, 토큰에서 검증된 uid로
    // 본인 문서의 myReferralCode를 서버에서 직접 조회한다 (스푸핑 방지).
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const userSnap = await admin.firestore().collection("users").doc(uid).get();
    const myReferralCode = userSnap.exists ? userSnap.data().myReferralCode : null;

    if (!myReferralCode) {
      return res.json({ success: true, paidCount: 0, trialCount: 0, overrideCount: 0, totalDirectCount: 0 });
    }

    const directSnap = await admin.firestore()
      .collection("users")
      .where("referredBy", "==", myReferralCode)
      .get();

    const directUsers = directSnap.docs.map((d) => d.data());
    const paid = directUsers.filter((u) => u.subscriptionStatus === "paid");
    const trial = directUsers.filter((u) => u.subscriptionStatus === "free_trial");

    let overrideCount = 0;
    await Promise.all(paid.map(async (u) => {
      const theirCode = u.myReferralCode;
      if (!theirCode) return;
      const overSnap = await admin.firestore()
        .collection("users")
        .where("referredBy", "==", theirCode)
        .where("subscriptionStatus", "==", "paid")
        .get();
      overrideCount += overSnap.size;
    }));

    return res.json({
      success: true,
      paidCount: paid.length,
      trialCount: trial.length,
      overrideCount,
      totalDirectCount: directUsers.length,
    });
  } catch (err) {
    console.error("파트너 통계 조회 오류:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});
