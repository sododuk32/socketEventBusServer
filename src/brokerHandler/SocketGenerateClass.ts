/* eslint-disable @typescript-eslint/no-explicit-any */
import { HantSocketHead } from '../types/Hant/HTHeaderType.js';



type Bodyfor = {
  tr_id: string;
  tr_key: string;
};
type ControlMsg = {
  meta: { type: 'info'; requestCode: string };
  payload: { id: string; currentValue: string };
};

export class SocketOrigin<TReq = any, TRes = any> {
  private socket!: WebSocket;
  private subscribers = new Set<MessagePort>();

  constructor(
    public readonly url: string,
    public readonly header?: HantSocketHead,
    public readonly body?: Bodyfor
  ) {}

  /** WebSocket 연결 (이미 연결되어 있으면 무시) */
  connect() {
    if (this.socket) return;
    this.socket = new WebSocket(this.url);

    // 연결 성공 시 제어 메시지 브로드캐스트
    this.socket.onopen = () => {
      const ctrl: ControlMsg = {
        meta: { type: 'info', requestCode: 'ws' },
        payload: { id: this.url, currentValue: 'connected' },
      };
      this.broadcastControl(ctrl);
    };

    // 서버로부터 받은 메시지는 실제 데이터 메시지로 브로드캐스트
    this.socket.onmessage = (ev) => {
      const data: TRes = JSON.parse(ev.data);
      this.broadcastData(data);
    };

    // 연결 종료 시 제어 메시지 브로드캐스트
    this.socket.onclose = () => {
      const ctrl: ControlMsg = {
        meta: { type: 'info', requestCode: 'ws' },
        payload: { id: this.url, currentValue: 'disconnected' },
      };
      this.broadcastControl(ctrl);
    };
  }

  subscribe(port: MessagePort) {
    this.subscribers.add(port);
  }
  unsubscribe(port: MessagePort) {
    this.subscribers.delete(port);
    // 구독자가 0명이면 소켓 연결 종료
    if (this.subscribers.size === 0) {
      this.disconnect();
    }
  }

  /** 클라이언트에서 서버로 데이터를 보낼 때 사용 */
  send(data: TReq) {
    if (!this.socket) this.connect();
    this.socket.send(JSON.stringify(data));
  }

  /** 제어 메시지만 브로드캐스트 */
  private broadcastControl(msg: ControlMsg) {
    this.subscribers.forEach((port) => {
      try {
        port.postMessage(msg);
      } catch {
        this.unsubscribe(port);
      }
    });
  }

  /** 실제 데이터 메시지만 브로드캐스트 */
  private broadcastData(msg: TRes) {
    this.subscribers.forEach((port) => {
      try {
        port.postMessage(msg);
      } catch {
        this.unsubscribe(port);
      }
    });
  }

  /** 구독자 없을 때 WebSocket 닫기 */
  private disconnect() {
    this.socket.close();
    // 인스턴스 삭제는 호출부(외부 Map)에서 처리
  }
}
