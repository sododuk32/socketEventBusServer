/* eslint-disable @typescript-eslint/no-explicit-any */
export type FetchErrorDetail = {
  message: string;
  /** HTTP 에러일 때 status code */
  status?: number;
  /** Node.js 환경의 네트워크 에러(code=ECONNREFUSED 등) */
  code?: string;
};

export type FetchResult<G> =
  | {
      data: G;
      error: null;
    }
  | { data: null; error: FetchErrorDetail };
