const menu=document.querySelector('.menu'),nav=document.querySelector('nav');
if(menu && nav){
  menu.addEventListener('click',()=>nav.classList.toggle('open'));
  document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
}

const header=document.querySelector('header');
function updateHeader(){if(header)header.classList.toggle('scrolled',window.scrollY>30)}
window.addEventListener('scroll',updateHeader,{passive:true});updateHeader();

const revealTargets=document.querySelectorAll('.section:not(.hero) > .eyebrow,.section:not(.hero) > h2,.about-grid > *, .timeline article,.cards article,.edu article,.contact > p,.contact > .actions,.contact-info');
revealTargets.forEach(el=>el.classList.add('reveal'));
const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target)}});
},{threshold:.14,rootMargin:'0px 0px -45px'});
revealTargets.forEach(el=>revealObserver.observe(el));

const links=[...document.querySelectorAll('nav a[href^="#"]')];
const sections=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
const sectionObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${entry.target.id}`));
    }
  });
},{rootMargin:'-35% 0px -55%',threshold:0});
sections.forEach(section=>sectionObserver.observe(section));

const progress=document.querySelector('.scroll-progress');
function updateProgress(){
  if(!progress)return;
  const max=document.documentElement.scrollHeight-window.innerHeight;
  const pct=max>0?(window.scrollY/max)*100:0;
  progress.style.width=`${Math.min(100,Math.max(0,pct))}%`;
}
window.addEventListener('scroll',updateProgress,{passive:true});updateProgress();

const extraReveal=document.querySelectorAll('.impact-strip > div,.approach-grid article,.availability');
extraReveal.forEach((el,i)=>{el.classList.add('reveal');el.style.transitionDelay=`${(i%4)*70}ms`;revealObserver.observe(el)});

// ===== HD RESUME / IMAGE LIGHTBOX =====
const lightbox=document.getElementById('lightbox');
const lbImg=document.getElementById('lightboxImage');
const lbCaption=document.getElementById('lightboxCaption');
const zoomLabel=document.getElementById('zoomLabel');
const stage=lightbox?.querySelector('.lightbox-stage');

let scale=1,drag=false,startX=0,startY=0,startScrollLeft=0,startScrollTop=0;
let baseWidth=0,baseHeight=0,lastFocus=null;

function fitImage(){
  if(!stage || !lbImg)return;
  const sw=Math.max(280,stage.clientWidth-48);
  const sh=Math.max(240,stage.clientHeight-48);
  const nw=lbImg.naturalWidth||sw;
  const nh=lbImg.naturalHeight||sh;
  const fit=Math.min(sw/nw,sh/nh,1);
  baseWidth=Math.round(nw*fit);
  baseHeight=Math.round(nh*fit);
}

function renderImage(keepCenter=true){
  if(!stage || !lbImg || !zoomLabel)return;

  const oldW=lbImg.offsetWidth||baseWidth;
  const oldH=lbImg.offsetHeight||baseHeight;
  const oldCenterX=stage.scrollLeft+(stage.clientWidth/2);
  const oldCenterY=stage.scrollTop+(stage.clientHeight/2);
  const ratioX=oldW ? oldCenterX/oldW : .5;
  const ratioY=oldH ? oldCenterY/oldH : .5;

  const newW=Math.round(baseWidth*scale);
  const newH=Math.round(baseHeight*scale);

  lbImg.style.width=`${newW}px`;
  lbImg.style.height=`${newH}px`;
  lbImg.style.margin='0';

  const holder=lbImg.parentElement;
  if(holder){
    holder.style.setProperty('--image-width',`${newW}px`);
    holder.style.setProperty('--image-height',`${newH}px`);
  }

  zoomLabel.textContent=`${Math.round(scale*100)}%`;
  stage.classList.toggle('is-zoomed',scale>1);

  requestAnimationFrame(()=>{
    if(scale<=1){
      stage.scrollLeft=0;
      stage.scrollTop=0;
      return;
    }
    if(keepCenter){
      stage.scrollLeft=Math.max(0,(ratioX*newW)-(stage.clientWidth/2));
      stage.scrollTop=Math.max(0,(ratioY*newH)-(stage.clientHeight/2));
    }
  });
}

function setZoom(next){
  scale=Math.max(1,Math.min(5,next));
  renderImage(true);
}
function resetZoom(){scale=1;renderImage(false)}

function openLightbox(trigger){
  if(!lightbox || !lbImg || !stage)return;
  lastFocus=document.activeElement;
  if(lbCaption)lbCaption.textContent=trigger.dataset.caption||'';
  lbImg.onload=()=>{fitImage();scale=1;renderImage(false)};
  lbImg.src=trigger.dataset.image;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  lightbox.querySelector('[data-close-lightbox]')?.focus();
}

function closeLightbox(){
  if(!lightbox || !lbImg || !stage)return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
  lbImg.src='';
  stage.classList.remove('is-zoomed','is-dragging');
  drag=false;
  lastFocus?.focus?.();
}

document.querySelectorAll('.image-trigger').forEach(el=>el.addEventListener('click',()=>openLightbox(el)));
lightbox?.querySelectorAll('[data-close-lightbox]').forEach(el=>el.addEventListener('click',closeLightbox));
lightbox?.querySelector('[data-zoom-in]')?.addEventListener('click',()=>setZoom(scale+.25));
lightbox?.querySelector('[data-zoom-out]')?.addEventListener('click',()=>setZoom(scale-.25));
lightbox?.querySelector('[data-zoom-reset]')?.addEventListener('click',resetZoom);

stage?.addEventListener('wheel',e=>{
  if(!e.ctrlKey&&!e.metaKey)return;
  e.preventDefault();
  setZoom(scale+(e.deltaY<0?.25:-.25));
},{passive:false});

stage?.addEventListener('pointerdown',e=>{
  if(scale<=1||e.button!==0)return;
  drag=true;
  stage.classList.add('is-dragging');
  stage.setPointerCapture(e.pointerId);
  startX=e.clientX; startY=e.clientY;
  startScrollLeft=stage.scrollLeft; startScrollTop=stage.scrollTop;
});
stage?.addEventListener('pointermove',e=>{
  if(!drag)return;
  stage.scrollLeft=startScrollLeft-(e.clientX-startX);
  stage.scrollTop=startScrollTop-(e.clientY-startY);
});
function stopDrag(){drag=false;stage?.classList.remove('is-dragging')}
stage?.addEventListener('pointerup',stopDrag);
stage?.addEventListener('pointercancel',stopDrag);

window.addEventListener('resize',()=>{
  if(lightbox?.classList.contains('open')&&lbImg?.naturalWidth){
    fitImage(); renderImage(false);
  }
});

// ===== PORTFOLIO DETAILS MODAL =====
const detailModal=document.getElementById('detailModal');
const detailModalTitle=document.getElementById('detailModalTitle');
const detailModalBody=document.getElementById('detailModalBody');
let detailLastFocus=null;

function openPortfolioDetail(card){
  if(!detailModal||!card)return;
  detailLastFocus=document.activeElement;
  detailModalTitle.textContent=card.dataset.title||card.querySelector('h3,h4,strong')?.textContent?.trim()||'Details';
  detailModalBody.textContent=card.dataset.detail||'More information about this item.';
  detailModal.classList.add('is-open');
  detailModal.setAttribute('aria-hidden','false');
  document.body.classList.add('detail-modal-open');
  detailModal.querySelector('.detail-modal-close')?.focus();
}
function closePortfolioDetail(){
  if(!detailModal)return;
  detailModal.classList.remove('is-open');
  detailModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('detail-modal-open');
  detailLastFocus?.focus?.();
}
document.querySelectorAll('.detail-card').forEach(card=>{
  card.addEventListener('click',()=>openPortfolioDetail(card));
  card.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault();openPortfolioDetail(card);
    }
  });
});
detailModal?.querySelectorAll('[data-modal-close]').forEach(el=>el.addEventListener('click',closePortfolioDetail));

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(detailModal?.classList.contains('is-open'))closePortfolioDetail();
    else if(lightbox?.classList.contains('open'))closeLightbox();
  }
});
