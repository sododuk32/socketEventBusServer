export type HantHeaders = {
  Authorization: string;
};

export type HantHeadersHash = {
  'content-type': string;
  appkey: string;
  appsecret: string;
};

export type HantHeadersAccess = {
  grant_type: string;
  appkey: string;
  appsecret: string;
  cache?: string;
};

export type HantHeadersAccessSocket = {
  grant_type: string;
  appkey: string;
  secretkey: string;
  cache?: string;
};
/**
 *
 * 주의) @tr_id   요청문에 따라 값이 다를 수도있음. 상수가 아님.
 * @authorization   Bearer 반드시 포함해야함.
 */
export type HantHeadersMarketRank = {
  authorization: string;
  'content-type': string;
  appkey: string;
  appsecret: string;
  tr_id: string;
  custtype: string;
  cache?: string;
};
/**
 *
 * 주의) @tr_id   요청문에 따라 값이 다를 수도있음. 상수가 아님.
 * @authorization   Bearer 반드시 포함해야함.
 */
export type HantSocketHead = {
  approval_key: string;
  custtype: 'B' | 'P';
  tr_type: string;
  'content-type': string;
};
