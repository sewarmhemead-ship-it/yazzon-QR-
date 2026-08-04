import * as THREE from "three";
import "./style.css";

const photos = [
  { src:"/images/brunch-1.avif", title:"The first pour", kind:"table" },
  { src:"/images/brunch-2.avif", title:"A table begins", kind:"table" },
  { src:"/images/brunch-3.avif", title:"Made to share", kind:"table" },
  { src:"/images/official/official-01.webp", title:"The YAZZOON feast", kind:"table" },
  { src:"/images/official/official-03.webp", title:"Levant on a plate", kind:"table" },
  { src:"/images/official/official-05.webp", title:"Colour, spice, texture", kind:"table" },
  { src:"/images/official/official-08.webp", title:"Details of the table", kind:"table" },
  { src:"/images/brunch-2b.avif", title:"Joy tastes better", kind:"people" },
  { src:"/images/brunch-2c.jpg", title:"Served with a smile", kind:"people" },
  { src:"/images/official/official-04.webp", title:"Meet at YAZZOON", kind:"people" },
  { src:"/images/official/official-06.webp", title:"A quiet afternoon", kind:"people" },
  { src:"/images/official/official-10.webp", title:"The hands behind it", kind:"people" },
  { src:"/images/official/official-02.webp", title:"Inside YAZZOON", kind:"space" },
  { src:"/images/official/official-07.webp", title:"Small details, warm room", kind:"space" },
  { src:"/images/official/official-09.webp", title:"An evening setting", kind:"space" },
  { src:"/images/official/official-11.webp", title:"A special gathering", kind:"events" },
  { src:"/images/official/official-12.webp", title:"Salzburg comes together", kind:"events" },
  { src:"/images/official/official-13.webp", title:"The city at our table", kind:"events" },
];

const collections={
  table:{label:"The table · Collection I",accent:"#c28e45",profile:[.08,.42,.08,.3]},
  people:{label:"The people · Collection II",accent:"#8d3e48",profile:[.72,.08,.08,.08]},
  space:{label:"The room · Collection III",accent:"#42666b",profile:[.06,.06,.06,.06]},
  events:{label:"The city · Collection IV",accent:"#6b7149",profile:[.08,.34,.46,.08]},
};

const loaderEl=document.querySelector("#loader");
const loaderFill=document.querySelector("#loaderFill");
const loaderPct=document.querySelector("#loaderPct");
const loadingStarted=performance.now();
let loaderDismissed=false;
const loadingManager=new THREE.LoadingManager();
loadingManager.onProgress=(_url,loaded,total)=>{
  const pct=Math.round(loaded/Math.max(total,1)*100);
  loaderFill.style.width=`${pct}%`; loaderPct.textContent=String(pct);
};
function dismissLoader(force=false){
  if(loaderDismissed)return;
  loaderDismissed=true;
  const wait=force?0:Math.max(0,700-(performance.now()-loadingStarted));
  setTimeout(()=>{
    loaderFill.style.width="100%"; loaderPct.textContent="100";
    loaderEl.classList.add("is-hidden"); document.body.classList.add("gallery-ready");
    const warm=()=>manageTextures(active,true);
    if("requestIdleCallback" in window)requestIdleCallback(warm,{timeout:900}); else setTimeout(warm,120);
  },wait+120);
}
loadingManager.onLoad=()=>dismissLoader(false);
setTimeout(()=>dismissLoader(true),2000);

const canvas = document.querySelector("#scene");
const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:"high-performance", precision:"highp" });
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
camera.position.set(0,.1,8.8);
const group = new THREE.Group();
scene.add(group);

const loader = new THREE.TextureLoader(loadingManager);
const cardProfiles = [
  [0.08,0.42,0.08,0.3],
  [0.5,0.08,0.34,0.08],
  [0.08,0.08,0.48,0.48],
  [0.72,0.08,0.08,0.08],
  [0.08,0.34,0.46,0.08],
];

function cardGeometry(width,height,radii,padding=0){
  const w=width+padding*2,h=height+padding*2;
  const [tl,tr,br,bl]=radii.map(r=>r+padding*.55);
  const x=-w/2,y=-h/2;
  const shape=new THREE.Shape();
  shape.moveTo(x+bl,y);
  shape.lineTo(x+w-br,y); shape.quadraticCurveTo(x+w,y,x+w,y+br);
  shape.lineTo(x+w,y+h-tr); shape.quadraticCurveTo(x+w,y+h,x+w-tr,y+h);
  shape.lineTo(x+tl,y+h); shape.quadraticCurveTo(x,y+h,x,y+h-tl);
  shape.lineTo(x,y+bl); shape.quadraticCurveTo(x,y,x+bl,y);
  const geometry=new THREE.ShapeGeometry(shape,8);
  const uv=geometry.attributes.uv;
  for(let i=0;i<uv.count;i++) uv.setXY(i,(uv.getX(i)-x)/w,(uv.getY(i)-y)/h);
  uv.needsUpdate=true;
  return geometry;
}

const meshes = photos.map((photo,index) => {
  const profile=collections[photo.kind].profile;
  const geometry=cardGeometry(3.65,2.42,profile);
  const frameGeometry=cardGeometry(3.65,2.42,profile,.075);
  const material = new THREE.MeshBasicMaterial({ color:0x17130e, transparent:true, opacity:1, side:THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry,material);
  mesh.userData.index=index;
  const frame = new THREE.Mesh(frameGeometry,new THREE.MeshBasicMaterial({ color:0x080705, transparent:true, opacity:.96, side:THREE.DoubleSide }));
  frame.position.z=-.035;
  const reflection = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({ color:0x17130e, transparent:true, opacity:.12, side:THREE.DoubleSide, depthWrite:false }));
  reflection.scale.y=-.44;
  const unit = new THREE.Group();
  unit.add(frame,mesh,reflection);
  group.add(unit);
  return { unit, mesh, frame, reflection, texture:null, loading:false,aspectScale:1 };
});

function circularDistance(a,b){ const raw=Math.abs(a-b); return Math.min(raw,photos.length-raw); }
function ensureTexture(index){
  const wrapped=wrap(index),record=meshes[wrapped];
  if(record.texture||record.loading)return;
  record.loading=true;
  loader.load(photos[wrapped].src,texture=>{
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
    const sourceAspect=texture.image.width/Math.max(texture.image.height,1);
    record.aspectScale=THREE.MathUtils.clamp(sourceAspect/(3.65/2.42),.68,1.22);
    record.mesh.scale.x=record.aspectScale; record.frame.scale.x=record.aspectScale;
    record.reflection.scale.x=record.aspectScale;
    record.texture=texture; record.loading=false;
    record.mesh.material.map=texture; record.mesh.material.color.set(0xffffff); record.mesh.material.needsUpdate=true;
    record.reflection.material.map=texture; record.reflection.material.color.set(0xffffff); record.reflection.material.needsUpdate=true;
  },undefined,()=>{record.loading=false});
}

function manageTextures(index,warmAll=loaderDismissed){
  const radius=warmAll?3:1;
  for(let offset=-radius;offset<=radius;offset++)ensureTexture(index+offset);
  meshes.forEach((record,i)=>{
    if(record.texture&&circularDistance(i,index)>6){
      record.texture.dispose(); record.texture=null;
      record.mesh.material.map=null; record.mesh.material.color.set(0x17130e); record.mesh.material.needsUpdate=true;
      record.reflection.material.map=null; record.reflection.material.color.set(0x17130e); record.reflection.material.needsUpdate=true;
    }
  });
}

let position=0, target=0, velocity=0, active=0, dragging=false, moved=false, startX=0, lastX=0;
const dots=document.querySelector(".dots");
photos.forEach((photo,index)=>{ const b=document.createElement("button"); b.type="button"; b.ariaLabel=`View photograph ${index+1}`; b.onclick=()=>{target=index;velocity=0}; dots.append(b); });
const interactionHint=document.querySelector(".interaction-hint");
const mobileProgressCurrent=document.querySelector("#mobileProgressCurrent");
const mobileProgressTotal=document.querySelector("#mobileProgressTotal");
const mobileProgressFill=document.querySelector("#mobileProgressFill");
mobileProgressTotal.textContent=String(photos.length).padStart(2,"0");
let userHasNavigated=false;
let lastHapticIndex=0;

function acknowledgeSwipe(){
  if(userHasNavigated)return;
  userHasNavigated=true;
  interactionHint.classList.add("is-hidden");
}

function hapticTick(index){
  if(!userHasNavigated||lastHapticIndex===index||innerWidth>=640||!navigator.vibrate)return;
  lastHapticIndex=index;
  navigator.vibrate(7);
}

function wrap(value){ return ((value%photos.length)+photos.length)%photos.length; }
function updateCopy(index){
  active=index;
  manageTextures(index);
  const ambientImage=document.querySelector("#ambientImage");
  ambientImage.style.opacity="0";
  ambientImage.src=photos[index].src;
  requestAnimationFrame(()=>{ ambientImage.style.opacity=""; });
  const collection=collections[photos[index].kind];
  document.documentElement.style.setProperty("--scene-accent",collection.accent);
  document.querySelector("#collectionLabel").textContent=collection.label;
  document.querySelector("#counter").textContent=`${String(index+1).padStart(2,"0")} / ${String(photos.length).padStart(2,"0")}`;
  document.querySelector("#chapter").textContent=`Chapter ${String(index+1).padStart(2,"0")}`;
  document.querySelector("#caption").textContent=photos[index].title;
  mobileProgressCurrent.textContent=String(index+1).padStart(2,"0");
  mobileProgressFill.style.transform=`scaleX(${(index+1)/photos.length})`;
  [...dots.children].forEach((dot,i)=>dot.setAttribute("aria-current",String(i===index)));
}

function down(e){ dragging=true;moved=false;startX=lastX=e.clientX;velocity=0;canvas.setPointerCapture(e.pointerId); }
function move(e){ if(!dragging)return; const dx=e.clientX-lastX; if(Math.abs(e.clientX-startX)>6){moved=true;acknowledgeSwipe()} position-=dx/(innerWidth<640?170:280); velocity=-dx/(innerWidth<640?170:280); lastX=e.clientX; }
const raycaster=new THREE.Raycaster();
const pointerNdc=new THREE.Vector2();
function up(e){
  if(!dragging)return;
  dragging=false;
  if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  if(moved)acknowledgeSwipe();
  target=Math.round(position+velocity*5);
  if(!moved){
    pointerNdc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);
    raycaster.setFromCamera(pointerNdc,camera);
    if(raycaster.intersectObject(meshes[active].mesh,false).length)openPhoto();
  }
}
canvas.addEventListener("pointerdown",down); canvas.addEventListener("pointermove",move); canvas.addEventListener("pointerup",up); canvas.addEventListener("pointercancel",up);
canvas.addEventListener("wheel",e=>{ if(Math.abs(e.deltaY)+Math.abs(e.deltaX)<5)return; target=Math.round(position)+(e.deltaY+e.deltaX>0?1:-1); },{passive:true});
window.addEventListener("keydown",e=>{ if(e.key==="ArrowRight")target=Math.round(position)+1; if(e.key==="ArrowLeft")target=Math.round(position)-1; if(e.key==="Enter")openPhoto(); if(e.key==="Escape")closePhoto(); });

const lightbox=document.querySelector("#lightbox");
function openPhoto(){ const photo=photos[active]; document.querySelector("#lightboxImage").src=photo.src; document.querySelector("#lightboxImage").alt=photo.title; document.querySelector("#lightboxNumber").textContent=`Photograph ${String(active+1).padStart(2,"0")}`; document.querySelector("#lightboxTitle").textContent=photo.title; lightbox.hidden=false; document.querySelector("#closeLightbox").focus(); }
function closePhoto(){ if(lightbox.hidden)return;lightbox.hidden=true;document.querySelector("#shareMoment").focus(); }
document.querySelector("#closeLightbox").onclick=closePhoto; lightbox.addEventListener("click",e=>{if(e.target===lightbox)closePhoto()});

const shareMoment=document.querySelector("#shareMoment");
const cameraInput=document.querySelector("#cameraInput");
const momentDialog=document.querySelector("#momentDialog");
const momentForm=document.querySelector("#momentForm");
const momentPreview=document.querySelector("#momentPreview");
const momentStatus=document.querySelector("#momentStatus");
let momentFile=null,momentUrl="";

shareMoment.onclick=()=>cameraInput.click();
document.querySelector("#retakeMoment").onclick=()=>cameraInput.click();
document.querySelector("#closeMoment").onclick=()=>momentDialog.close();
cameraInput.onchange=()=>{
  const file=cameraInput.files?.[0]; if(!file)return;
  if(!file.type.startsWith("image/")){momentStatus.textContent="Please choose a photograph.";return;}
  momentFile=file;
  const submit=momentForm.querySelector('[type="submit"]');
  submit.disabled=false; submit.innerHTML='Send for review <span>↗</span>';
  if(momentUrl)URL.revokeObjectURL(momentUrl);
  momentUrl=URL.createObjectURL(file); momentPreview.src=momentUrl;
  momentStatus.textContent="";
  if(!momentDialog.open)momentDialog.showModal();
};
momentDialog.addEventListener("close",()=>{shareMoment.focus()});

async function prepareMoment(file){
  const bitmap=await createImageBitmap(file,{imageOrientation:"from-image"});
  const max=2400,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const width=Math.round(bitmap.width*scale),height=Math.round(bitmap.height*scale);
  const output=document.createElement("canvas"); output.width=width;output.height=height;
  output.getContext("2d",{alpha:false}).drawImage(bitmap,0,0,width,height); bitmap.close();
  return new Promise((resolve,reject)=>output.toBlob(blob=>blob?resolve(blob):reject(new Error("Could not prepare photograph.")),"image/jpeg",.9));
}

momentForm.onsubmit=async event=>{
  event.preventDefault(); if(!momentFile)return;
  const submit=momentForm.querySelector('[type="submit"]'); submit.disabled=true;
  momentStatus.textContent="Preparing your photograph …";
  const supabaseUrl=import.meta.env.VITE_SUPABASE_URL;
  const anonKey=import.meta.env.VITE_SUPABASE_ANON_KEY;
  if(!supabaseUrl||!anonKey){momentStatus.textContent="Photo submissions are not connected yet. Add the Supabase project keys to enable sending.";submit.disabled=false;return;}
  try{
    const blob=await prepareMoment(momentFile);
    const id=crypto.randomUUID(); const path=`pending/${new Date().toISOString().slice(0,10)}/${id}.jpg`;
    const headers={apikey:anonKey,Authorization:`Bearer ${anonKey}`};
    const upload=await fetch(`${supabaseUrl}/storage/v1/object/yazzoon-moments/${path}`,{method:"POST",headers:{...headers,"Content-Type":"image/jpeg","x-upsert":"false"},body:blob});
    if(!upload.ok)throw new Error("The photograph could not be uploaded.");
    const data=new FormData(momentForm);
    const submission={id,storage_path:path,guest_name:String(data.get("guestName")||"").trim()||null,guest_email:String(data.get("guestEmail")||"").trim()||null,caption:String(data.get("caption")||"").trim()||null,status:"pending",consent_version:"2026-08-03"};
    const insert=await fetch(`${supabaseUrl}/rest/v1/yazzoon_moments`,{method:"POST",headers:{...headers,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(submission)});
    if(!insert.ok)throw new Error("The review request could not be created.");
    fetch(`${supabaseUrl}/functions/v1/notify-yazzoon-moment`,{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({submissionId:id})}).catch(()=>{});
    momentForm.reset();cameraInput.value="";momentFile=null;
    momentStatus.textContent="Thank you. Your YAZZOON moment was sent for review.";
    submit.textContent="Sent ✓";
    setTimeout(()=>momentDialog.close(),1800);
  }catch(error){momentStatus.textContent=error instanceof Error?error.message:"The photograph could not be sent. Please try again.";submit.disabled=false;}
};

function resize(){ renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }
addEventListener("resize",resize); resize(); updateCopy(0);

const clock=new THREE.Clock();
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta()*60,2);
  if(!dragging){ position+=(target-position)*Math.min(.12*dt,1); }
  const nearest=wrap(Math.round(position)); if(nearest!==active)updateCopy(nearest);
  if(!dragging&&Math.abs(target-position)<.035)hapticTick(active);
  meshes.forEach(({unit,mesh,frame,reflection},index)=>{
    let d=index-position; while(d>photos.length/2)d-=photos.length; while(d<-photos.length/2)d+=photos.length;
    unit.visible=Math.abs(d)<3.15;
    if(!unit.visible)return;
    const angle=d*.73;
    const galleryOffset=innerWidth<640?0:1.05;
    const x=galleryOffset+Math.sin(angle)*(innerWidth<640?3.25:4.9);
    const z=(Math.cos(angle)-1)*4.8;
    const mobile=innerWidth<640;
    unit.position.set(x,mobile?-.92+Math.abs(d)*.12:-.38+Math.abs(d)*.16,z);
    unit.rotation.y=-d*.57;
    const baseScale=mobile?.78:1;
    const scale=baseScale*Math.max(.58,1-Math.abs(d)*.18); unit.scale.setScalar(scale);
    mesh.material.opacity=Math.max(.16,1-Math.abs(d)*.3);
    frame.material.opacity=Math.max(.34,.96-Math.abs(d)*.22);
    reflection.position.set(0,-2.72,.06);
    reflection.material.opacity=Math.max(.012,.072-Math.abs(d)*.024);
    reflection.material.map=mesh.material.map;
    unit.renderOrder=10-Math.round(Math.abs(d));
  });
  group.rotation.y+=((innerWidth<640?0:.035)-group.rotation.y)*.04;
  renderer.render(scene,camera);
}
frame();
