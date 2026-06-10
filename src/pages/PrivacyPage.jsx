// src/pages/PrivacyPage.jsx
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="relative z-10 flex flex-col min-h-screen px-6 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-cream-dark rounded-full transition-colors"
          >
            <ChevronLeft size={20} className="text-[#7A6060]" />
          </button>
          <h1 className="text-lg font-bold text-[#3D2B2B]">개인정보처리방침</h1>
        </div>

        <div className="space-y-6 text-[#3D2B2B] pb-12">
          <div>
            <p className="text-xs text-[#9A8080]">시행일: 2026년 6월 10일</p>
          </div>

          <p className="text-sm leading-relaxed text-[#5A4040]">
            웰핏+ CHECK-UP(이하 "서비스")은 이용자의 개인정보를 소중히 여기며,
            「개인정보 보호법」 및 관련 법령을 준수합니다.
          </p>

          {/* 1조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제1조 수집하는 개인정보 항목</h2>
            <div className="card-glass p-4 space-y-2">
              <div className="flex gap-2 text-sm">
                <span className="text-mauve font-semibold min-w-[80px]">필수 항목</span>
                <span className="text-[#5A4040]">이메일 주소, Google 계정 정보</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-mauve font-semibold min-w-[80px]">분석용 항목</span>
                <span className="text-[#5A4040]">얼굴 이미지, 손톱 이미지 (AI 분석 후 즉시 폐기)</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-mauve font-semibold min-w-[80px]">설문 데이터</span>
                <span className="text-[#5A4040]">건강 관련 설문 응답, AI 건강 분석 결과</span>
              </div>
            </div>
          </section>

          {/* 생체정보 별도 고지 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제2조 생체정보 처리에 관한 별도 고지</h2>
            <div className="bg-rose-gold/10 border border-rose-gold/30 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-rose-gold">⚠ 민감정보(생체정보) 별도 안내</p>
              <p className="text-sm text-[#5A4040] leading-relaxed">
                본 서비스는 AI 건강 분석을 위해 <span className="font-semibold">얼굴 이미지(생체정보)</span>를 일시적으로 처리합니다.
                해당 이미지는 Google Gemini API에 전송되어 분석에 사용되며, <span className="font-semibold">분석 완료 즉시 서버에서 삭제</span>됩니다.
                분석 결과 텍스트만 저장됩니다.
              </p>
              <p className="text-sm text-[#5A4040]">
                생체정보 처리에 동의하지 않으실 경우 서비스 이용이 제한될 수 있습니다.
              </p>
            </div>
          </section>

          {/* 3조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제3조 개인정보의 수집 및 이용 목적</h2>
            <ul className="text-sm text-[#5A4040] space-y-1 list-disc list-inside leading-relaxed">
              <li>AI 기반 건강 라이프스타일 분석 결과 제공</li>
              <li>회원 계정 관리 및 서비스 제공</li>
              <li>맞춤형 건강 코칭 콘텐츠 제공</li>
              <li>서비스 개선 및 통계 분석(식별 불가능한 형태로 처리)</li>
            </ul>
          </section>

          {/* 4조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제4조 개인정보의 보유 및 이용 기간</h2>
            <div className="card-glass p-4">
              <p className="text-sm text-[#5A4040] leading-relaxed">
                회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다.
                단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보존합니다.
              </p>
            </div>
          </section>

          {/* 5조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제5조 개인정보의 제3자 제공</h2>
            <div className="card-glass p-4">
              <p className="text-sm text-[#5A4040]">
                서비스는 이용자의 개인정보를 <span className="font-semibold">제3자에게 제공하지 않습니다.</span>
              </p>
            </div>
          </section>

          {/* 6조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제6조 개인정보 처리 위탁</h2>
            <div className="card-glass p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-[#3D2B2B]">Google Firebase</p>
                <p className="text-xs text-[#7A6060]">위탁 업무: 회원 인증 및 데이터 저장</p>
              </div>
              <div className="h-px bg-cream-deeper" />
              <div>
                <p className="text-sm font-semibold text-[#3D2B2B]">Google Gemini API</p>
                <p className="text-xs text-[#7A6060]">위탁 업무: AI 건강 분석 처리 (이미지 분석 후 즉시 삭제)</p>
              </div>
            </div>
          </section>

          {/* 7조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제7조 이용자의 권리</h2>
            <ul className="text-sm text-[#5A4040] space-y-1 list-disc list-inside leading-relaxed">
              <li>개인정보 열람 요청</li>
              <li>오류 정정 요청</li>
              <li>삭제 및 처리 정지 요청</li>
              <li>위 권리 행사는 아래 담당자에게 이메일로 요청하실 수 있습니다.</li>
            </ul>
          </section>

          {/* 8조 */}
          <section>
            <h2 className="text-sm font-bold text-rose-gold mb-2">제8조 개인정보 보호 담당자</h2>
            <div className="card-glass p-4 space-y-1">
              <div className="flex gap-2 text-sm">
                <span className="text-mauve font-semibold min-w-[60px]">담당자</span>
                <span className="text-[#5A4040]">김성훈</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-mauve font-semibold min-w-[60px]">이메일</span>
                <span className="text-[#5A4040]">korahnchild@gmail.com</span>
              </div>
            </div>
          </section>

          <div className="pt-2">
            <p className="text-xs text-[#B0A0A0] text-center">
              본 방침은 2026년 6월 10일부터 시행됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
