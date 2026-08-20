// src/components/ErrorBoundary.jsx
//
// 2026.8.12 신규 — 전역 에러 바운더리.
// 이 앱은 AI 응답(구조가 매번 완전히 같다고 보장할 수 없음)과 과거 버전 리포트
// 데이터를 그대로 화면에 렌더하는 구조라, 필드 하나만 예상과 달라도 렌더 중
// 예외가 나면서 앱 전체가 흰 화면이 됐음(실제 사례: 공유 리포트 페이지가
// faceAnalysis 객체를 문자열로 가정하고 렌더 → 페이지 전체 크래시).
// 1인 운영이라 실시간 대응이 어려우므로, 최소한 사용자가 빠져나갈 길은 준다.
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || '' };
  }

  componentDidCatch(error, info) {
    // 외부 모니터링 도구는 아직 붙이지 않음 — 콘솔 기록만 남긴다.
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', background: '#FDFAF6', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 18px',
            background: 'rgba(200,149,108,0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#C8956C" strokeWidth="1.7" />
              <path d="M12 7.5V13" stroke="#C8956C" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="12" cy="16.3" r="1" fill="#C8956C" />
            </svg>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#3D2B2B', marginBottom: 10 }}>
            화면을 불러오지 못했습니다
          </h2>
          <p style={{ fontSize: 13.5, color: '#7A6060', lineHeight: 1.7, marginBottom: 22 }}>
            일시적인 문제일 수 있습니다. 홈으로 돌아가 다시 시도해 주세요.
            같은 문제가 계속되면 알려주시면 빠르게 확인하겠습니다.
          </p>

          <button
            onClick={this.handleReset}
            style={{
              width: '100%', padding: '13px', borderRadius: 16, border: 'none',
              background: 'linear-gradient(135deg, #C9956B 0%, #B8829A 100%)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            홈으로 돌아가기
          </button>

          {import.meta.env.DEV && this.state.message && (
            <p style={{ fontSize: 11, color: '#9A8080', marginTop: 16, wordBreak: 'break-all' }}>
              {this.state.message}
            </p>
          )}
        </div>
      </div>
    );
  }
}
