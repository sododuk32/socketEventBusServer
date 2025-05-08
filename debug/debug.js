import WebSocket from 'ws';

const ws = new WebSocket('ws://ops.koreainvestment.com:21000');

ws.on('open', () => {
  const payload = {
    header: {
      approval_key: 'eb0c7128-7491-44e9-9bfb-07738d3fc58c',
      custtype: 'P',
      tr_type: '1',
    },
    body: {
      input: {
        tr_id: 'H0STCNT0',
        tr_key: '005930',
      },
    },
  };

  const raw = JSON.stringify(payload);
  console.log('[📤 전송 문자열]', raw);
  ws.send(raw);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('[✅ 수신 응답]', msg);
  } catch {
    console.warn('[⚠️ 수신 응답은 JSON이 아님]', data.toString());
  }
});

ws.on('error', (err) => {
  console.error('[❌ 소켓 에러]', err);
});

ws.on('close', () => {
  console.log('[🔌 연결 종료됨]');
});
