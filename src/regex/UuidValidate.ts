const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function UuidValidate(uid: unknown): uid is string {
  if (typeof uid === 'undefined') {
    return false;
  }
  return typeof uid === 'string' && uuidRegex.test(uid);
}
