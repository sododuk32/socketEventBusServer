/**
 * 한투 실시간 체결 메시지를 파싱해 필요한 필드만 JSON 객체로 반환
 * @param rawStr 수신된 파이프 포맷 메시지
 * @returns { tr_id, count, records: object[] }
 */
export function parseKisPipeMessage(rawStr: string) {
  const [code, tr_id, countStr, ...rest] = rawStr.split('|');

  if (code !== '0') throw new Error(`수신 실패 코드: ${code}`);

  const count = Number(countStr);
  const flat = rest.join('|').split('^');

  // 필드 순서 기준 (전체 데이터 순서에서 우리가 필요한 인덱스만 추출)
  const fieldIndexMap = {
    MKSC_SHRN_ISCD: 0,
    STCK_CNTG_HOUR: 1,
    STCK_PRPR: 2,
    PRDY_VRSS_SIGN: 3,
    PRDY_CTRT: 4,
    STCK_OPRC: 5,
    STCK_HGPR: 6,
    STCK_LWPR: 7,
  };

  const korparams: Record<string, string> = {
    MKSC_SHRN_ISCD: '종목코드',
    STCK_CNTG_HOUR: '체결시간',
    STCK_PRPR: '체결가',
    PRDY_VRSS_SIGN: '전일대비부호',
    PRDY_CTRT: '전일대비율',
    STCK_OPRC: '시가',
    STCK_HGPR: '고가',
    STCK_LWPR: '저가',
  };

  const oneLength = 22; // 전체 필드 수 (정확한 길이는 실제 수신에 따라 맞추세요)
  const records: { data: Record<string, string | null>; korparams: Record<string, string> }[] = [];

  for (let i = 0; i < count; i++) {
    const base = flat.slice(i * oneLength, (i + 1) * oneLength);
    const obj: Record<string, string | null> = {};
    const kor: Record<string, string> = {};

    for (const [key, idx] of Object.entries(fieldIndexMap)) {
      obj[key] = base[idx] ?? null;
      kor[key] = korparams[key];
    }

    records.push({ data: obj, korparams: kor });
  }

  return {
    tr_id,
    count,
    records,
  };
}
