// Tiny stack VM, ISA v1. Plain JS in a .ts file: `node /bot/main.ts`.
// For each /input/<id>/ (program.bin + input.bin) writes
// /output/<id>/stdout.bin and /output/<id>/exit.txt. No deps, no network.
const fs=require("node:fs"),path=require("node:path");
const IN=process.env.MAKEFUN_INPUT_DIR||"/input",OUT=process.env.MAKEFUN_OUTPUT_DIR||"/output";
// immediate length, and [pops,pushes] on the data stack, per opcode
const IL={1:1,2:4,48:2,49:2,50:2,51:2};
const NP={0:[0,0],1:[0,1],2:[0,1],3:[1,0],4:[1,2],5:[2,2],6:[2,3],7:[3,3],16:[2,1],17:[2,1],18:[2,1],19:[2,1],20:[2,1],21:[2,1],22:[2,1],23:[1,1],24:[2,1],25:[2,1],26:[2,1],27:[1,1],28:[2,1],29:[2,1],30:[2,1],32:[2,1],33:[2,1],34:[2,1],48:[0,0],49:[1,0],50:[1,0],51:[0,0],52:[0,0],64:[1,1],65:[2,0],80:[1,0],81:[1,0],82:[0,1],83:[1,0]};
function run(p, inp) {
  const s=[], c=[], m=new Int32Array(256), o=[];
  let ol=0, pc=0, steps=0, ip=0;
  const T=(k)=>{const e=new Error("t"+k); e.k=k; throw e;};
  const w=(b)=>{ if(ol+b.length>65536) T(11); o.push(b); ol+=b.length; };
  const s16=(i)=>{let v=p[i]|(p[i+1]<<8); return v>=32768?v-65536:v;};
  try {
    for(;;) {
      if(steps>=1000000) T(10);
      if(pc<0||pc>=p.length) T(9);
      const op=p[pc], nd=NP[op];
      if(nd===undefined) T(5);
      const il=IL[op]||0;
      if(pc+1+il>p.length) T(9);
      if(s.length<nd[0]) T(2);
      if(s.length-nd[0]+nd[1]>256) T(3);
      steps++;
      const nx=pc+1+il;
      let a,b;
      switch(op) {
        case 0: return {o:Buffer.concat(o), k:0};
        case 1: s.push(p[pc+1]<128?p[pc+1]:p[pc+1]-256); pc=nx; break;
        case 2: s.push((p[pc+1]|(p[pc+2]<<8)|(p[pc+3]<<16)|(p[pc+4]<<24))|0); pc=nx; break;
        case 3: s.pop(); pc=nx; break;
        case 4: s.push(s[s.length-1]); pc=nx; break;
        case 5: b=s.pop(); a=s.pop(); s.push(b,a); pc=nx; break;
        case 6: s.push(s[s.length-2]); pc=nx; break;
        case 7: a=s[s.length-3]; s[s.length-3]=s[s.length-2]; s[s.length-2]=s[s.length-1]; s[s.length-1]=a; pc=nx; break;
        case 16: b=s.pop(); a=s.pop(); s.push((a+b)|0); pc=nx; break;
        case 17: b=s.pop(); a=s.pop(); s.push((a-b)|0); pc=nx; break;
        case 18: b=s.pop(); a=s.pop(); s.push(Math.imul(a,b)); pc=nx; break;
        case 19: b=s.pop(); a=s.pop(); if(!b) T(4); s.push(a===-2147483648&&b===-1?-2147483648:(Math.trunc(a/b)|0)); pc=nx; break;
        case 20: b=s.pop(); a=s.pop(); if(!b) T(4); s.push(b===-1?0:(a%b)|0); pc=nx; break;
        case 21: b=s.pop(); a=s.pop(); if(!b) T(4); s.push(Math.floor((a>>>0)/(b>>>0))|0); pc=nx; break;
        case 22: b=s.pop(); a=s.pop(); if(!b) T(4); s.push(((a>>>0)%(b>>>0))|0); pc=nx; break;
        case 23: s.push((-s.pop())|0); pc=nx; break;
        case 24: b=s.pop(); a=s.pop(); s.push(a&b); pc=nx; break;
        case 25: b=s.pop(); a=s.pop(); s.push(a|b); pc=nx; break;
        case 26: b=s.pop(); a=s.pop(); s.push(a^b); pc=nx; break;
        case 27: s.push(~s.pop()); pc=nx; break;
        case 28: b=s.pop(); a=s.pop(); s.push(a<<(b&31)); pc=nx; break;
        case 29: b=s.pop(); a=s.pop(); s.push(a>>(b&31)); pc=nx; break;
        case 30: b=s.pop(); a=s.pop(); s.push((a>>>(b&31))|0); pc=nx; break;
        case 32: b=s.pop(); a=s.pop(); s.push(a===b?1:0); pc=nx; break;
        case 33: b=s.pop(); a=s.pop(); s.push(a<b?1:0); pc=nx; break;
        case 34: b=s.pop(); a=s.pop(); s.push((a>>>0)<(b>>>0)?1:0); pc=nx; break;
        case 48: pc=nx+s16(pc+1); break;
        case 49: pc=s.pop()===0?nx+s16(pc+1):nx; break;
        case 50: pc=s.pop()!==0?nx+s16(pc+1):nx; break;
        case 51: if(c.length>=64) T(7); c.push(nx); pc=p[pc+1]|(p[pc+2]<<8); break;
        case 52: if(!c.length) T(8); pc=c.pop(); break;
        case 64: a=s.pop(); if(a<0||a>255) T(6); s.push(m[a]); pc=nx; break;
        case 65: a=s.pop(); b=s.pop(); if(a<0||a>255) T(6); m[a]=b; pc=nx; break;
        case 80: w(Buffer.from(String(s.pop()),"ascii")); pc=nx; break;
        case 81: w(Buffer.from([s.pop()&255])); pc=nx; break;
        case 82: s.push(ip<inp.length?inp[ip++]:-1); pc=nx; break;
        case 83: return {o:Buffer.concat(o), k:s.pop()&255};
      }
    }
  } catch(e) { if(typeof e.k==="number") return {o:Buffer.concat(o), k:e.k}; throw e; }
}
const ids=fs.readdirSync(IN,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name).sort();
for(const id of ids) {
  const d=path.join(IN,id);
  let p=Buffer.alloc(0), inp=Buffer.alloc(0);
  try { p=fs.readFileSync(path.join(d,"program.bin")); } catch {}
  try { inp=fs.readFileSync(path.join(d,"input.bin")); } catch {}
  const r=run(p,inp), od=path.join(OUT,id);
  fs.mkdirSync(od,{recursive:true});
  fs.writeFileSync(path.join(od,"stdout.bin"),r.o);
  fs.writeFileSync(path.join(od,"exit.txt"),String(r.k)+"\n");
}
