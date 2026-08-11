// src/hooks/useRequireLogin.js
//
// REQUIRE_LOGIN_FOR_ANALYSIS 플래그가 켜져 있을 때만 작동하는 라우트 가드.
// 지금(플래그 꺼짐)은 아무 동작도 하지 않아 기존 게스트 분석 흐름에 영향 없음.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { REQUIRE_LOGIN_FOR_ANALYSIS } from '../config/featureFlags';

export function useRequireLogin() {
  const navigate = useNavigate();
  const { user } = useApp();

  useEffect(() => {
    if (!REQUIRE_LOGIN_FOR_ANALYSIS) return;
    if (!user || user.isGuest) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);
}
