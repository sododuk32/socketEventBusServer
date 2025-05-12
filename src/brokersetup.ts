// src/socket/brokerSetup.ts
import { WebSocketServer } from 'ws';
import { EventBrokers } from './brokerHandler/eventbroker.js';
import { ExternalConnector } from './brokerHandler/outSocket.js';
import { ClientManager } from './brokerHandler/ClientManage.js';
import { SocketEndpoints } from './endpoint/soketConnect.js';
import { UuidValidate } from './regex/UuidValidate.js';
import { parse } from 'cookie';

export function setupBroker(wss: WebSocketServer) {
  const external = new ExternalConnector(SocketEndpoints);
  const manager = new ClientManager(external);

  wss.on('connection', (ws, req) => {
    // 1) UUID 체크
    const uuid = parse(req.headers.cookie || '').uuid;
    console.log('받은 uuid' + uuid);

    if (!UuidValidate(uuid)) {
      console.log('에러');
      ws.send(JSON.stringify({ type: 'error', message: 'NOUUID' }));
      return ws.close(1008, 'Invalid UUID');
    }

    // 2) 메시지 처리: 클라이언트 → broker
    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
        console.log('받은 메시지');

        console.log(msg);
      } catch {
        return ws.send(JSON.stringify({ type: 'error', message: 'errors' }));
      }
      const { type, topic, detail, isStock } = msg;
      EventBrokers.emit(type, { uuid, topic, detail, ws });
    });

    // 3) 연결 종료 시
    ws.on('close', () => {
      manager.removeClient(uuid);
    });
  });

  // 4) broker 이벤트 연결
  // subscribe, unsubscribe는 ClientManager 생성자에서 이미 on(…)으로 연결되어 있다고 가정
  // giveUser/update 이벤트도 manager.broadcast로 연결되어 있어야 합니다
}
