/* eslint-disable @typescript-eslint/no-explicit-any */
import WebSocket from 'ws';

export interface SocketClient {
  /** 클라이언트 식별값. uuid로 구분 */
  id: string;
  /** 세션객체 */
  ws: WebSocket;

  /** 구독중인 정보  Record<topic, 구독정보 리스트.> */
  subscriptions: Record<string, string[]>;
}
export type SocketMessageBodyEvent = {
  topic: string;
  detail: string;
  uuid: string;
  ws: WebSocket;
  isStock?: boolean;
};

export type SocketClientMessage =
  | { type: 'subscribe'; topic: string }
  | { type: 'unsubscribe'; topic: string }
  | { type: 'update'; topic: string; payload: unknown }
  | { type: 'error'; message: string };

// approval_key	웹소켓 접속키 (웹소켓) 접속키 발급 API(/oauth2/Approval)를 사용하여 발급받은 웹소켓 접속키
// custtype	고객타입		B : 법인
// tr_type	거래타입		1 : 등록
// content-type	컨텐츠타입	String utf-8
export type HantSoketHeader = {
  approval_key: string;
  custtype: 'P' | 'B';
  tr_type: '1' | '2';
  'content-type'?: string;
};
export type HantSoketBody = {
  tr_id: string;
  tr_key: string;
  [k: string]: any;
};

export interface SocketEndpointConfig {
  endpoint: string;
  header: HantSoketHeader;
  bodyTemplate: HantSoketBody;
}
export type EndpointsRecord = Record<string, SocketEndpointConfig>;

export type clientSocketMessageBody = {
  type: string;
  topic: string;
  detail: string;
  uuid?: string;
  ws: WebSocket;
};
