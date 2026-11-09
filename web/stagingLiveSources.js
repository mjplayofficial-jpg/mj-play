// Verified pilot mappings use the existing catalogue ID as the stable identity.
const sources = new Map();

export function stagingLiveSource(channel) {
  if (channel.sports || (channel.provider && channel.provider !== 'WS_DDL')) return;
  return sources.get(Number(channel.wsNumber || channel.number));
}
