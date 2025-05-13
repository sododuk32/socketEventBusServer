// externalConnector.ts
import WebSocket, { WebSocketServer } from 'ws';
import { EventBrokers } from './eventbroker.js';
import { EndpointsRecord } from '../types/Socket/SocketConnect.js';
import { parseKisPipeMessage, toText } from './parseHant.js';

export class ExternalConnector {
  // topic → WebSocket 인스턴스
  private sockets = new Map<string, WebSocket>();
  // topic → 현재 구독된 detail 목록
  private subscribedDetails = new Map<string, Set<string>>();

  constructor(private configs: EndpointsRecord) {}

  /** 클라이언트의 subscribe 이벤트가 발생했을 때 호출 */
  subscribe(topic: string, detail: string) {
    console.log('sub' + topic + detail);
    const cfg = this.configs[topic];
    if (!cfg) throw new Error(`Unknown topic: ${topic}`);

    // 1) detail 목록 관리
    if (!this.subscribedDetails.has(topic)) {
      this.subscribedDetails.set(topic, new Set());
    }
    const details = this.subscribedDetails.get(topic)!;
    details.add(detail);

    // 2) 토픽용 WebSocket이 없다면 새로 열기
    // 구독의 여러 처리부분은 매우 햇갈림. 로직에 많은 기능이 위임되어있음.
    console.log(this.sockets.has(topic));
    console.log(this.subscribedDetails);
    console.log(topic);

    if (!this.sockets.has(topic)) {
      const ws = new WebSocket(cfg.endpoint, { headers: cfg.header });
      console.log('한투 소캣 열기');
      if (ws.readyState === 0) {
        ws.on('open', () => {
          const payload = {
            header: cfg.header, // approval_key, custtype, tr_type, content-type
            body: {
              input: {
                tr_id: cfg.bodyTemplate.tr_id,
                tr_key: detail,
              },
            },
          };
          console.log('payload');
          console.log(payload);
          ws.send(JSON.stringify(payload));
        });
        ws.on('message', (raw) => {
          // 어떤 형태로 오든 문자열로 통일
          const str = toText(raw);

          // JSON인지 파이프 포맷인지 구분
          const trimmed = str.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            // JSON control message
            try {
              const parsed = JSON.parse(trimmed);
              console.log('JSON message:', parsed);
              // ... 추가 처리 (PINGPONG, SUBSCRIBE SUCCESS 등) ...
            } catch (jsonErr) {
              console.error('Invalid JSON frame:', jsonErr);
            }
          } else {
            // pipe 포맷 메시지
            try {
              const parsedPipe = parseKisPipeMessage(str);
              console.log(parsedPipe.records);
              EventBrokers.emit('giveUser', {
                topic,
                detail,
                payload: parsedPipe.records,
              });
            } catch (pipeErr) {
              console.error('[❌ pipe parsing failed]', pipeErr, 'raw=', str);
            }
          }
        });

        this.sockets.set(topic, ws);
      }
    } else {
      const ws = this.sockets.get(topic)!;

      if (ws.readyState === WebSocket.OPEN) {
        console.log('한투 소캣 열려있음.');

        // 3) 열린 소켓에 detail 기반 구독 요청 보내기

        const body = { ...cfg.bodyTemplate, tr_key: detail };

        ws.send(JSON.stringify({ header: cfg.header, body }));
      } else {
        ws.on('open', () => {
          const body = { ...cfg.bodyTemplate, tr_key: detail };
          ws.send(JSON.stringify({ header: cfg.header, body }));
        });
      }
    }
  }

  /** 클라이언트의 unsubscribe 이벤트가 발생했을 때 호출 */
  unsubscribe(topic: string, detail: string, uuid: string) {
    const cfg = this.configs[topic];
    const ws = this.sockets.get(topic);
    const details = this.subscribedDetails.get(topic);
    if ((uuid && !cfg) || !ws || !details) {
      return '';
    }
    console.log(this.configs[topic]);

    console.log(details);
    details.clear();
    console.log('cloear 이후');

    console.log(details);

    // 2) 3자 서버에 해제 요청 전송
    const body = { ...cfg.bodyTemplate, tr_key: detail, unsub: true };
    ws.send(JSON.stringify({ header: cfg.header, body }));

    // 3) 더 이상 남은 detail이 없으면 소켓 닫기
    if (details.size === 0) {
      ws.removeAllListeners();
      ws.close();
      this.sockets.delete(topic);
      this.subscribedDetails.delete(topic);
    }
  }

  /** 클라이언트의 clearSubScreibe 이벤트가 발생했을 때 호출 */
  clearSubScreibe(uuid: string, topic: string) {
    const ws = this.sockets.get(topic);
    const details = this.subscribedDetails.has(topic);

    if (!ws) {
      return;
    }

    ws.removeAllListeners();
    ws.close();
    this.sockets.delete(topic);
    this.subscribedDetails.delete(topic);
  }
}
