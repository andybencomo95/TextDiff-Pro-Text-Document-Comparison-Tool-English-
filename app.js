"use strict";
const $=id=>document.getElementById(id);
const tA=$("textA"),tB=$("textB"),oA=$("outA"),oB=$("outB"),oU=$("diffUnified"),dS=$("diffSide");
const eM=$("emptyMsg"),stats=$("stats");
const EX_A="The rental agreement expires on Monday, May 12th at 10:00 AM.\nThe monthly rent is 850 dollars, utilities included.\nThe tenant must give 30 days notice in advance.";
const EX_B="The rental agreement expires on Tuesday, May 13th at 11:30 AM.\nThe monthly rent is 900 dollars, utilities included.\nThe tenant must give 60 days notice in advance and in writing.";
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function words(t){t=t.trim();return t?t.split(/\s+/).length:0}
function updCounts(){const a=tA.value,b=tB.value;
$("countA").textContent=words(a)+" words · "+a.length+" chars";
$("countB").textContent=words(b)+" words · "+b.length+" chars"}
tA.addEventListener("input",updCounts);tB.addEventListener("input",updCounts);updCounts();
function normKey(t,opts){let s=t;if(!opts.caseSensitive)s=s.toLowerCase();
if(opts.igSpaces)s=s.replace(/\s+/g," ").trim();return s}
function tokenize(text,level,opts){
if(level==="char")return{orig:[...text],key:[...normKey(text,{caseSensitive:opts.caseSensitive,igSpaces:false})].map(c=>c)};
if(level==="line"){let L=text.split(/\n/);if(opts.trimEmpty)L=L.filter(l=>l.trim()!=="");
const orig=L.map(l=>l+"\n");const key=L.map(l=>normKey(l,opts));return{orig,key}}
let parts=text.split(/(\s+)/);if(opts.trimEmpty){parts=parts.filter(p=>!(p.trim()===""&&p.includes("\n\n")))}
let orig=[],key=[];
for(const p of parts){if(p==="")continue;orig.push(p);
if(/^\s+$/.test(p))key.push(" ");else key.push(normKey(p,opts))}
return{orig,key}}
function diffMyers(aK,bK){
const N=aK.length,M=bK.length,MAX=N+M;
if(MAX===0)return[];if(MAX>12000)return greedy(aK,bK);
let V=new Map();V.set(1,0);let trace=[];
for(let d=0;d<=MAX;d++){
let cur=new Map();
for(let k=-d;k<=d;k+=2){
let x;if(k===-d||(k!==d&&((V.get(k-1)??-1)<(V.get(k+1)??-1))))x=V.get(k+1)??0;
else x=(V.get(k-1)??-1)+1;
let y=x-k;
while(x<N&&y<M&&aK[x]===bK[y]){x++;y++}
cur.set(k,x);
if(x>=N&&y>=M){trace.push(cur);return backtrack(trace,aK,bK,N,M)}}
trace.push(cur);V=cur;
if(trace.length>4000)return greedy(aK,bK)}
return greedy(aK,bK)}
function backtrack(trace,aK,bK,N,M){
let x=N,y=M,ops=[];
for(let d=trace.length-1;d>0;d--){
const V=trace[d-1];const k=x-y;
let pk;if(k===-d||(k!==d&&((V.get(k-1)??-1)<(V.get(k+1)??-1))))pk=k+1;else pk=k-1;
const px=V.get(pk)??0,py=px-pk;
while(x>px&&y>py){x--;y--;ops.push({t:"e",i:x,j:y})}
if(x===px)ops.push({t:"a",j:y-1,y:y-1});
else ops.push({t:"d",i:x-1});
if(ops[ops.length-1].t==="a")y--;else x--}
while(x>0&&y>0){x--;y--;ops.push({t:"e",i:x,j:y})}
while(x>0){x--;ops.push({t:"d",i:x})}
while(y>0){y--;ops.push({t:"a",j:y})}
return ops.reverse()}
function greedy(aK,bK){
let i=0,j=0,ops=[];
while(i<aK.length&&j<bK.length){
if(aK[i]===bK[j]){ops.push({t:"e",i,j});i++;j++}
else if(aK[i+1]===bK[j]){ops.push({t:"d",i});i++}
else if(aK[i]===bK[j+1]){ops.push({t:"a",j});j++}
else{ops.push({t:"d",i});ops.push({t:"a",j});i++;j++}}
while(i<aK.length){ops.push({t:"d",i});i++}
while(j<bK.length){ops.push({t:"a",j});j++}
return ops}

function runCompare(){const t0=performance.now();
const opts={caseSensitive:$("optCase").checked,igSpaces:$("optSpaces").checked,trimEmpty:$("optTrim").checked};
const level=$("optLevel").value,view=$("optView").value,only=$("optOnlyDiff").checked;
const A=tokenize(tA.value,level,opts),B=tokenize(tB.value,level,opts);
const ops=diffMyers(A.key,B.key);
let nE=0,nA=0,nD=0;for(const o of ops){if(o.t==="e")nE++;else if(o.t==="a")nA++;else nD++}
const tot=Math.max(A.key.length,B.key.length,1);const sim=nE/tot*100;
const ms=Math.round(performance.now()-t0);
$("simPct").textContent=sim.toFixed(1)+"%";$("simBar").style.width=sim+"%";
$("stEqual").textContent=nE;$("stAdd").textContent=nA;$("stDel").textContent=nD;$("stTime").textContent=ms+"ms";
stats.hidden=false;eM.style.display="none";
if(view==="side"){dS.hidden=false;oU.hidden=true;let hA="",hB="";
for(const o of ops){if(o.t==="e"){if(!only){hA+='<span class="eq">'+esc(A.orig[o.i])+"</span>";hB+='<span class="eq">'+esc(B.orig[o.j])+"</span>"}}
else if(o.t==="d")hA+="<del>"+esc(A.orig[o.i])+"</del>";
else hB+="<ins>"+esc(B.orig[o.j])+"</ins>"}
oA.innerHTML=hA||"<i>No differences.</i>";oB.innerHTML=hB||"<i>No differences.</i>"}
else{dS.hidden=true;oU.hidden=false;let h="";
for(const o of ops){if(o.t==="e"){if(!only)h+='<span class="eq">'+esc(A.orig[o.i])+"</span>"}
else if(o.t==="d")h+="<del>"+esc(A.orig[o.i])+"</del>";else h+="<ins>"+esc(B.orig[o.j])+"</ins>"}
oU.innerHTML=h||"<i>No differences.</i>"}
saveHist(sim,nA,nD);$("results").scrollIntoView({behavior:"smooth",block:"start"})}
function getPlain(){if(!dS.hidden)return"ONLY IN A:\n"+oA.innerText+"\n\nONLY IN B:\n"+oB.innerText;return oU.innerText}
function saveHist(sim,a,d){try{let h=JSON.parse(localStorage.getItem("tdiff_hist")||"[]");h.unshift({t:new Date().toLocaleString("en"),s:sim.toFixed(1)+"%",a,d});h=h.slice(0,10);localStorage.setItem("tdiff_hist",JSON.stringify(h));renderHist()}catch(e){}}
function renderHist(){try{let h=JSON.parse(localStorage.getItem("tdiff_hist")||"[]");$("histList").innerHTML=h.length?h.map(x=>"<div>• "+esc(x.t)+" — <b>"+esc(x.s)+"</b> (+"+x.a+"/-"+x.d+")</div>").join(""):"<i>No comparisons yet.</i>"}catch(e){}}
renderHist();
$("btnCompare").onclick=runCompare;
$("btnExample").onclick=()=>{tA.value=EX_A;tB.value=EX_B;updCounts();runCompare()};
$("heroExample").onclick=()=>{tA.value=EX_A;tB.value=EX_B;updCounts();document.getElementById("tool").scrollIntoView({behavior:"smooth"});setTimeout(runCompare,400)};
$("btnSwap").onclick=()=>{const v=tA.value;tA.value=tB.value;tB.value=v;updCounts()};
$("btnClear").onclick=()=>{tA.value="";tB.value="";updCounts();stats.hidden=true;dS.hidden=true;oU.hidden=true;eM.style.display=""};
$("btnCopy").onclick=async()=>{try{await navigator.clipboard.writeText(getPlain());alert("Copied to clipboard")}catch(e){alert("Copy failed")}};
$("btnDownload").onclick=()=>{const b=new Blob(["TEXT COMPARISON REPORT\nSimilarity: "+$("simPct").textContent+"\n\n"+getPlain()],{type:"text/plain"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="text-comparison.txt";a.click()};
$("btnShare").onclick=async()=>{const u=location.href.split("#")[0]+"#a="+encodeURIComponent(tA.value.slice(0,2000))+"&b="+encodeURIComponent(tB.value.slice(0,2000));try{await navigator.clipboard.writeText(u);alert("Share link copied")}catch(e){prompt("Copy this link:",u)}};
$("btnPrint").onclick=()=>window.print();
$("histClear").onclick=()=>{localStorage.removeItem("tdiff_hist");renderHist()};
$("optView").onchange=()=>{if(!stats.hidden)runCompare()};
$("optOnlyDiff").onchange=()=>{if(!stats.hidden)runCompare()};
$("optLevel").onchange=()=>{if(!stats.hidden)runCompare()};
(function(){try{const h=location.hash;if(h.includes("a=")){const p=new URLSearchParams(h.slice(1));if(p.get("a"))tA.value=p.get("a");if(p.get("b"))tB.value=p.get("b");updCounts();if(tA.value&&tB.value)runCompare()}}catch(e){}})();
async function readFile(f){const n=f.name.toLowerCase();
if(n.endsWith(".docx")){try{if(window.mammoth){const b=await f.arrayBuffer();const r=await window.mammoth.extractRawText({arrayBuffer:b});return r.value||"[DOCX with no text]"}return"[DOCX needs internet for library]"}catch(e){return"[DOCX error: "+e.message+"]"}}
if(n.endsWith(".pdf")){try{if(window.pdfjsLib){const b=await f.arrayBuffer();const pdf=await window.pdfjsLib.getDocument({data:b}).promise;let t="";for(let i=1;i<=Math.min(pdf.numPages,50);i++){const p=await pdf.getPage(i);const c=await p.getTextContent();t+=c.items.map(x=>x.str).join(" ")+"\n"}return t||"[No extractable text]"}return"[PDF needs internet for library]"}catch(e){return"[PDF error: "+e.message+"]"}}
return await f.text()}
function wireDrop(did,iid,ta){const d=$(did),inp=$(iid);
d.onclick=e=>{if(e.target.tagName!=="INPUT")inp.click()};
inp.onchange=async()=>{if(inp.files[0]){ta.value=await readFile(inp.files[0]);updCounts()}};
["dragover","dragenter"].forEach(ev=>d.addEventListener(ev,e=>{e.preventDefault();d.classList.add("over")}));
["dragleave","drop"].forEach(ev=>d.addEventListener(ev,e=>{e.preventDefault();d.classList.remove("over")}));
d.addEventListener("drop",async e=>{const f=e.dataTransfer.files[0];if(f){ta.value=await readFile(f);updCounts()}});
ta.addEventListener("dragover",e=>e.preventDefault());
ta.addEventListener("drop",async e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){ta.value=await readFile(f);updCounts()}})}
wireDrop("dropA","fileA",tA);wireDrop("dropB","fileB",tB);
if(window.pdfjsLib&&window.pdfjsLib.GlobalWorkerOptions){try{window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"}catch(e){}}
const th=$("themeBtn");
function setT(m){document.documentElement.dataset.theme=m;th.innerHTML=m==="dark"?'<svg class="ic"><use href="#i-sun"/></svg>':'<svg class="ic"><use href="#i-moon"/></svg>';try{localStorage.setItem("tdiff_theme",m)}catch(e){}}
try{setT(localStorage.getItem("tdiff_theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"))}catch(e){setT("light")}
th.onclick=()=>setT(document.documentElement.dataset.theme==="dark"?"light":"dark");
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")runCompare()});

