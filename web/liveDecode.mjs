import {gunzipSync,inflateSync} from 'node:zlib';
const limit=32*1024*1024;
const ts=b=>b.length>188&&b[0]===71&&b[188]===71;
const paeth=(a,b,c)=>{const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c;};
export function decodeLiveSegment(input){
 const b=Buffer.from(input);if(b.length>16*1024*1024)throw Error('Segment too large');if(ts(b))return b;
 if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'){let off=12;while(off+8<=b.length){const tag=b.toString('ascii',off,off+4),n=b.readUInt32LE(off+4);off+=8;if(n>b.length-off)throw Error('Invalid WebP');if(tag==='EXIF'&&ts(b.subarray(off,off+n)))return b.subarray(off,off+n);off+=n+(n&1);}}
 if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){
  let off=8,w,h,channels;const parts=[];
  while(off+12<=b.length){const n=b.readUInt32BE(off);if(n>b.length-off-12)throw Error('Invalid image');const kind=b.toString('ascii',off+4,off+8),data=b.subarray(off+8,off+8+n);off+=n+12;
   if(kind==='IHDR'){if(n!==13||data[8]!==8||data[12]!==0||![2,6].includes(data[9]))throw Error('Unsupported image');w=data.readUInt32BE(0);h=data.readUInt32BE(4);channels=data[9]===6?4:3;if(!w||!h||w*h>8*1024*1024)throw Error('Image too large');}
   if(kind==='IDAT')parts.push(data);
   if(kind==='IEND'){if(ts(b.subarray(off)))return b.subarray(off);break;}
  }
  if(!w||!parts.length)throw Error('Invalid image');const raw=inflateSync(Buffer.concat(parts),{maxOutputLength:limit}),stride=w*channels;
  if(raw.length!==(stride+1)*h)throw Error('Invalid image pixels');const rgb=Buffer.alloc(w*h*3);let prev=Buffer.alloc(stride),src=0,dst=0;
  for(let y=0;y<h;y++){const filter=raw[src++];if(filter>4)throw Error('Invalid filter');const row=Buffer.alloc(stride);for(let x=0;x<stride;x++){const a=x>=channels?row[x-channels]:0,c=x>=channels?prev[x-channels]:0,v=prev[x];row[x]=(raw[src++]+([0,a,v,(a+v)>>1,paeth(a,v,c)][filter]))&255;}for(let x=0;x<stride;x+=channels){rgb[dst++]=row[x];rgb[dst++]=row[x+1];rgb[dst++]=row[x+2];}prev=row;}
  if(rgb.toString('ascii',0,8)!=='TIKTIKPX')throw Error('Media payload missing');const n=rgb.readUInt32BE(8);if(n<1||n>rgb.length-12)throw Error('Invalid payload');const result=gunzipSync(rgb.subarray(12,12+n),{maxOutputLength:limit});if(!ts(result))throw Error('Invalid transport stream');return result;
 }
 for(const [tag,gzip]of [['TIKTIKRAW',false],['TIKTIKTSGZ',true]]){const i=b.indexOf(tag);if(i>=0){const data=b.subarray(i+tag.length),result=gzip?gunzipSync(data,{maxOutputLength:limit}):data;if(ts(result))return result;}}
 for(let i=0;i+376<b.length;i++)if(b[i]===71&&b[i+188]===71&&b[i+376]===71)return b.subarray(i);
 throw Error('Unsupported live segment');
}
