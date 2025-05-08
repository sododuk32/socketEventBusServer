// externalConnector.ts
import WebSocket, { WebSocketServer } from 'ws';
import { EventBrokers } from './eventbroker.js';
import { EndpointsRecord } from '../types/Socket/SocketConnect.js';
import { parseKisPipeMessage } from './parseHant.js';

export class ExternalConnector {
  // topic → WebSocket 인스턴스
  private sockets = new Map<string, WebSocket>();
  // topic → 현재 구독된 detail 목록
  private subscribedDetails = new Map<string, Set<string>>();

  constructor(private configs: EndpointsRecord) {}

  /** 클라이언트의 subscribe 이벤트가 발생했을 때 호출 */
  subscribe(topic: string, detail: string) {
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
          const str = raw.toString();

          // JSON 메시지인 경우
          try {
            const parsed = JSON.parse(str);

            if (parsed.header?.tr_id === 'PINGPONG') return;

            if (parsed.body?.rt_cd === '0' && parsed.body?.msg1?.includes('SUBSCRIBE')) {
              console.log('✅ 구독 성공:', parsed.header.tr_key);
              return;
            }
            
        

            return; // ❗ JSON이면 여기서 종료해야 파이프 포맷으로 안 넘어감
          } catch {
            // JSON이 아닌 경우만 계속 진행
          }

          // 파이프 포맷이면 여기서 처리
          try {
            const parsed = parseKisPipeMessage(str);
            console.log('📈 체결 데이터:', parsed.records);
            EventBrokers.emit('giveUser', {
              topic: topic,
              detail: detail,
              payload: parsed.records,
            });
          } catch (err) {
            console.error('[❌ 파싱 실패]', err);
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
  unsubscribe(topic: string, detail: string) {
    const cfg = this.configs[topic];
    const ws = this.sockets.get(topic);
    const details = this.subscribedDetails.get(topic);
    if (!cfg || !ws || !details) return;

    // 1) 로컬 detail 목록에서 제거
    details.delete(detail);

    // 2) 3자 서버에 해제 요청 전송
    const body = { ...cfg.bodyTemplate, tr_key: detail, unsub: true };
    ws.send(JSON.stringify({ header: cfg.header, body }));

    // 3) 더 이상 남은 detail이 없으면 소켓 닫기
    if (details.size === 0) {
      ws.close();
      this.sockets.delete(topic);
      this.subscribedDetails.delete(topic);
    }
  }
}
