import { EndpointsRecord } from '../types/Socket/SocketConnect.js';
// 여기 제대로만들고확인해야함.

export const SocketEndpoints: EndpointsRecord = {
  realtime: {
    endpoint: 'ws://ops.koreainvestment.com:21000/tryitout/H0STCNT0',
    header: {
      custtype: 'P',
      tr_type: '1',
      // 'content-type': 'utf-8',
      approval_key: 'eb0c7128-7491-44e9-9bfb-07738d3fc58c',
    },
    bodyTemplate: {
      tr_id: 'H0STCNT0',
      tr_key: '',
    },
  },
};
