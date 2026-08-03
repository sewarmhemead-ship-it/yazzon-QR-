import * as THREE from "three";
import "./style.css";

const photos = [
  { src:"/images/brunch-1.avif", title:"A table begins" },
  { src:"/images/brunch-2.avif", title:"Morning, shared" },
  { src:"/images/brunch-2b.avif", title:"Made to gather" },
  { src:"/images/brunch-2c.jpg", title:"Between moments" },
  { src:"/images/brunch-3.avif", title:"The taste remains" },
];

const canvas = document.querySelector("#scene");
const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:!matchMedia("(max-width:640px)").matches, powerPreference:"high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia("(max-width:640px)").matches ? 1.25 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
camera.position.set(0,.1,8.8);
const group = new THREE.Group();
scene.add(group);

const loader = new THREE.TextureLoader();
const geometry = new THREE.PlaneGeometry(3.65,2.55,1,1);
const meshes = photos.map((photo,index) => {
  const texture = loader.load(photo.src, tex => { tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4); });
  const material = new THREE.MeshBasicMaterial({ map:texture, transparent:true, opacity:1, side:THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry,material);
  mesh.userData.index=index;
  group.add(mesh);
  return mesh;
});

const floor = new THREE.Mesh(new THREE.PlaneGeometry(30,18),new THREE.MeshBasicMaterial({ color:0x7d542b, transparent:true, opacity:.11, side:THREE.DoubleSide }));
floor.rotation.x=-Math.PI/2; floor.position.y=-2.2; floor.position.z=-2; scene.add(floor);

let position=0, target=0, velocity=0, active=0, dragging=false, moved=false, startX=0, lastX=0;
const dots=document.querySelector(".dots");
photos.forEach((photo,index)=>{ const b=document.createElement("button"); b.type="button"; b.ariaLabel=`View photograph ${index+1}`; b.onclick=()=>{target=index;velocity=0}; dots.append(b); });

function wrap(value){ return ((value%photos.length)+photos.length)%photos.length; }
function updateCopy(index){
  active=index;
  document.querySelector("#ambientImage").src=photos[index].src;
  document.querySelector("#reflectionImage").src=photos[index].src;
  document.querySelector("#counter").textContent=`${String(index+1).padStart(2,"0")} / ${String(photos.length).padStart(2,"0")}`;
  document.querySelector("#chapter").textContent=`Chapter ${String(index+1).padStart(2,"0")}`;
  document.querySelector("#caption").textContent=photos[index].title;
  [...dots.children].forEach((dot,i)=>dot.setAttribute("aria-current",String(i===index)));
}

function down(e){ dragging=true;moved=false;startX=lastX=e.clientX;velocity=0;canvas.setPointerCapture(e.pointerId); }
function move(e){ if(!dragging)return; const dx=e.clientX-lastX; if(Math.abs(e.clientX-startX)>6)moved=true; position-=dx/(innerWidth<640?170:280); velocity=-dx/(innerWidth<640?170:280); lastX=e.clientX; }
function up(e){ if(!dragging)return; dragging=false;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId); target=Math.round(position+velocity*5); }
canvas.addEventListener("pointerdown",down); canvas.addEventListener("pointermove",move); canvas.addEventListener("pointerup",up); canvas.addEventListener("pointercancel",up);
canvas.addEventListener("wheel",e=>{ if(Math.abs(e.deltaY)+Math.abs(e.deltaX)<5)return; target=Math.round(position)+(e.deltaY+e.deltaX>0?1:-1); },{passive:true});
window.addEventListener("keydown",e=>{ if(e.key==="ArrowRight")target=Math.round(position)+1; if(e.key==="ArrowLeft")target=Math.round(position)-1; if(e.key==="Enter")openPhoto(); if(e.key==="Escape")closePhoto(); });

const lightbox=document.querySelector("#lightbox");
function openPhoto(){ const photo=photos[active]; document.querySelector("#lightboxImage").src=photo.src; document.querySelector("#lightboxImage").alt=photo.title; document.querySelector("#lightboxNumber").textContent=`Photograph ${String(active+1).padStart(2,"0")}`; document.querySelector("#lightboxTitle").textContent=photo.title; lightbox.hidden=false; document.querySelector("#closeLightbox").focus(); }
function closePhoto(){ if(lightbox.hidden)return;lightbox.hidden=true;document.querySelector("#openActive").focus(); }
document.querySelector("#openActive").onclick=openPhoto; document.querySelector("#closeLightbox").onclick=closePhoto; lightbox.addEventListener("click",e=>{if(e.target===lightbox)closePhoto()});

function resize(){ renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }
addEventListener("resize",resize); resize(); updateCopy(0);

const clock=new THREE.Clock();
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta()*60,2);
  if(!dragging){ position+=(target-position)*Math.min(.12*dt,1); }
  const nearest=wrap(Math.round(position)); if(nearest!==active)updateCopy(nearest);
  meshes.forEach((mesh,index)=>{
    let d=index-position; while(d>photos.length/2)d-=photos.length; while(d<-photos.length/2)d+=photos.length;
    const angle=d*.73;
    const x=Math.sin(angle)*(innerWidth<640?3.1:4.7);
    const z=(Math.cos(angle)-1)*4.2;
    mesh.position.set(x,-.25+Math.abs(d)*.12,z);
    mesh.rotation.y=-d*.48;
    const scale=Math.max(.62,1-Math.abs(d)*.16); mesh.scale.setScalar(scale);
    mesh.material.opacity=Math.max(.16,1-Math.abs(d)*.3);
    mesh.renderOrder=10-Math.round(Math.abs(d));
  });
  group.rotation.y+=((innerWidth<640?0:.035)-group.rotation.y)*.04;
  renderer.render(scene,camera);
}
frame();
