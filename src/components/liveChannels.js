export function channelEmbedUrl(number){
 const id=String(number);
 if(!/^[1-9]\d{0,5}$/.test(id))throw new Error('Invalid channel number');
 return `https://dlive.sx/stream/stream-${id}.php`;
}
export const trialChannel=Object.freeze({number:38,title:'Sky Sports Main Event',provider:'WS_DDL',url:channelEmbedUrl(38)});
