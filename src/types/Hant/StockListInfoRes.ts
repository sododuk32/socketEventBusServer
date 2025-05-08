/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
const stockKeys: string[] = [
  'hts_kor_isnm',
  'mksc_shrn_iscd',
  'data_rank',
  'stck_prpr',
  'prdy_vrss_sign',
  'prdy_vrss',
  'prdy_ctrt',
  'acml_vol',
  'prdy_vol',
  'lstn_stcn',
  'avrg_vol',
  'n_befr_clpr_vrss_prpr_rate',
  'vol_inrt',
  'vol_tnrt',
  'nday_vol_tnrt',
  'avrg_tr_pbmn',
  'tr_pbmn_tnrt',
  'nday_tr_pbmn_tnrt',
  'acml_tr_pbmn',
] as const;

// Record를 써서 사용되는 필드를 string으로 매핑
export type StockListInfoRes = Record<(typeof stockKeys)[number], string>;

/**
 * 한투 서버 응답값 공통 리턴 객체 타입
 */
export type StockListInfoResOutput<Category extends keyof mainMenuDataExtra> = {
  /** 원래는 Record<(typeof stockKeys)[number], string>[]; */
  data: MainMenuAlltype<Category>[];
  rt_cd: string;
  msg_cd: string;
  msg1: string;
};

// ---------------------------------------------------------------

/**
 * 한투 서버 응답값 공통 리턴 객체 타입
 */
export interface StockResOutput<T extends KeyofMainMenu> {
  data: MainMenuAlltype<T>[];
  rt_cd: string;
  msg_cd: string;
  msg1: string;
}

export type KeyofMainMenu = keyof mainMenuDataExtra;
export type MainMenuAlltype<T extends KeyofMainMenu> = mainMenuData & mainMenuDataExtra[T];

// db같이 조인해서 쓰면됨.

// 리스트 응답에서 모든 종류에서 공통적으로 가져와야할 파라미터.
export type mainMenuData = {
  /**주식 단축 종목코드 */
  stck_shrn_iscd?: string;
  /** 유가증권 단축 종목코드 */
  mksc_shrn_iscd: string;
  /** 해당 지표 순위 */
  data_rank: string;
  /** 한국어 회사명 */
  hts_kor_isnm: string;
  /** 현재가 */
  stck_prpr: string;
  /** 전일 대비 (부호) */
  prdy_vrss_sign: string;
  /** 전일 대비 (절대값) */
  prdy_vrss: string;
  /** 전일 대비 ( 퍼센트) */
  prdy_ctrt: string;
  /** 누적 거래량 */
  acml_vol: string;

  favorite?: boolean;
};

/**
 * 메인 리스트에서 추가적으로 적용할 타입을 모아둔 인터페이스.
 */
export interface mainMenuDataExtra {
  거래량: {
    /** 거래량 증가율*/
    vol_inrt: string;
    /** 거래량 회전율*/
    vol_tnrt: string;

    /** 누적 거래 대금 */
    acml_tr_pbmn: string;
    /** 평균 거래량 */
    avrg_vol: string;
  };
  시가총액: {
    /**시가총액 */ stck_avls: string;
  };

  급상승: {
    /**절대 등락 수치*/ prd_rsfl: string;
    /**등락 비율 % */ prd_rsfl_rate: string;
  };
  급하락: { /**절대 등락 수치*/ prd_rsfl: string; /**등락 비율 % */ prd_rsfl_rate: string };

  대량체결건수: { /**대량매수*/ shnu_cntg_csnu: string; /**대량매도*/ seln_cntg_csnu: string };
}
