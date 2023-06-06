export const orderedUuid = () => {
  // TODO Order it by timestamp to allow DB ordering
  return crypto.randomUUID();
};
