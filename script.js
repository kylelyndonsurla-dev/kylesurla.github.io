const menu=document.querySelector('.menu'),nav=document.querySelector('nav');
menu.addEventListener('click',()=>nav.classList.toggle('open'));
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

const header=document.querySelector('header');
function updateHeader(){header.classList.toggle('scrolled',window.scrollY>30)}
window.addEventListener('scroll',updateHeader,{passive:true});updateHeader();

// Reveal sections and cards as they enter the viewport.
const revealTargets=document.querySelectorAll('.section:not(.hero) > .eyebrow,.section:not(.hero) > h2,.about-grid > *, .timeline article,.cards article,.edu article,.contact > p,.contact > .actions,.contact-info');
revealTargets.forEach(el=>el.classList.add('reveal'));
const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target)}});
},{threshold:.14,rootMargin:'0px 0px -45px'});
revealTargets.forEach(el=>revealObserver.observe(el));

// Highlight the navigation item for the section currently on screen.
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

// Slim progress indicator makes long-page navigation feel more polished.
const progress=document.querySelector('.scroll-progress');
function updateProgress(){
  const max=document.documentElement.scrollHeight-window.innerHeight;
  const pct=max>0?(window.scrollY/max)*100:0;
  progress.style.width=`${Math.min(100,Math.max(0,pct))}%`;
}
window.addEventListener('scroll',updateProgress,{passive:true});updateProgress();

// Reveal the added portfolio details using the same motion language.
const extraReveal=document.querySelectorAll('.impact-strip > div,.approach-grid article,.availability');
extraReveal.forEach((el,i)=>{el.classList.add('reveal');el.style.transitionDelay=`${(i%4)*70}ms`;revealObserver.observe(el)});

// Clickable portfolio details.
// High-resolution lightbox with scroll-based zoom and easy grab-to-pan.
const lightbox=document.getElementById('lightbox'),lbImg=document.getElementById('lightboxImage'),lbCaption=document.getElementById('lightboxCaption'),zoomLabel=document.getElementById('zoomLabel'),stage=lightbox.querySelector('.lightbox-stage');
let scale=1,drag=false,startX=0,startY=0,startScrollLeft=0,startScrollTop=0,baseWidth=0,baseHeight=0;

function fitImage(){
  const sw=Math.max(280,stage.clientWidth-40), sh=Math.max(240,stage.clientHeight-40);
  const nw=lbImg.naturalWidth||sw, nh=lbImg.naturalHeight||sh;
  const fit=Math.min(sw/nw,sh/nh,1);
  baseWidth=Math.round(nw*fit); baseHeight=Math.round(nh*fit);
}
function renderImage(keepCenter=true){
  const oldW=lbImg.clientWidth||baseWidth, oldH=lbImg.clientHeight||baseHeight;
  const cx=stage.scrollLeft+stage.clientWidth/2, cy=stage.scrollTop+stage.clientHeight/2;
  const rx=oldW?cx/oldW:.5, ry=oldH?cy/oldH:.5;
  lbImg.style.width=`${Math.round(baseWidth*scale)}px`;
  lbImg.style.height=`${Math.round(baseHeight*scale)}px`;
  lbImg.style.margin=scale<=1?'auto':'20px';
  zoomLabel.textContent=`${Math.round(scale*100)}%`;
  stage.classList.toggle('is-zoomed',scale>1);
  requestAnimationFrame(()=>{
    if(keepCenter&&scale>1){
      stage.scrollLeft=Math.max(0,rx*lbImg.clientWidth-stage.clientWidth/2);
      stage.scrollTop=Math.max(0,ry*lbImg.clientHeight-stage.clientHeight/2);
    }else if(scale<=1){stage.scrollLeft=0;stage.scrollTop=0}
  });
}
function setZoom(next){scale=Math.max(1,Math.min(5,next));renderImage(true)}
function resetZoom(){scale=1;renderImage(false)}
function openLightbox(trigger){
  lastFocus=document.activeElement;
  lbCaption.textContent=trigger.dataset.caption||'';
  lbImg.onload=()=>{fitImage();scale=1;renderImage(false)};
  lbImg.src=trigger.dataset.image;
  lightbox.classList.add('open');lightbox.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  lightbox.querySelector('[data-close-lightbox]').focus();
}
function closeLightbox(){
  lightbox.classList.remove('open');lightbox.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');lbImg.src='';
  stage.classList.remove('is-zoomed','is-dragging');
  if(lastFocus)lastFocus.focus();
}
document.querySelectorAll('.image-trigger').forEach(el=>el.addEventListener('click',()=>openLightbox(el)));
lightbox.querySelectorAll('[data-close-lightbox]').forEach(el=>el.addEventListener('click',closeLightbox));
lightbox.querySelector('[data-zoom-in]').addEventListener('click',()=>setZoom(scale+.25));
lightbox.querySelector('[data-zoom-out]').addEventListener('click',()=>setZoom(scale-.25));
lightbox.querySelector('[data-zoom-reset]').addEventListener('click',resetZoom);
stage.addEventListener('wheel',e=>{
  if(!e.ctrlKey&&!e.metaKey)return; // normal wheel scroll pans the enlarged image naturally
  e.preventDefault(); setZoom(scale+(e.deltaY<0?.2:-.2));
},{passive:false});
stage.addEventListener('pointerdown',e=>{
  if(scale<=1||e.button!==0)return;
  drag=true; stage.classList.add('is-dragging'); stage.setPointerCapture(e.pointerId);
  startX=e.clientX;startY=e.clientY;startScrollLeft=stage.scrollLeft;startScrollTop=stage.scrollTop;
});
stage.addEventListener('pointermove',e=>{
  if(!drag)return;
  stage.scrollLeft=startScrollLeft-(e.clientX-startX);
  stage.scrollTop=startScrollTop-(e.clientY-startY);
});
function stopDrag(){drag=false;stage.classList.remove('is-dragging')}
stage.addEventListener('pointerup',stopDrag);stage.addEventListener('pointercancel',stopDrag);
window.addEventListener('resize',()=>{if(lightbox.classList.contains('open')&&lbImg.naturalWidth){fitImage();renderImage(false)}});

// Reliable portfolio detail modal
const detailModal = document.getElementById('detailModal');
const detailModalTitle = document.getElementById('detailModalTitle');
const detailModalBody = document.getElementById('detailModalBody');
let detailLastFocus = null;

function openPortfolioDetail(card){
  if(!detailModal || !card) return;
  detailLastFocus = document.activeElement;
  detailModalTitle.textContent =
    card.dataset.title ||
    card.querySelector('h3,h4,strong')?.textContent?.trim() ||
    'Details';
  detailModalBody.textContent =
    card.dataset.detail ||
    'More information about this item.';
  detailModal.classList.add('is-open');
  detailModal.setAttribute('aria-hidden','false');
  document.body.classList.add('detail-modal-open');
  detailModal.querySelector('.detail-modal-close')?.focus();
}

function closePortfolioDetail(){
  if(!detailModal) return;
  detailModal.classList.remove('is-open');
  detailModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('detail-modal-open');
  detailLastFocus?.focus?.();
}

document.querySelectorAll('.detail-card').forEach(card => {
  card.addEventListener('click', () => openPortfolioDetail(card));
  card.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      openPortfolioDetail(card);
    }
  });
});

detailModal?.querySelectorAll('[data-modal-close]').forEach(el => {
  el.addEventListener('click', closePortfolioDetail);
});

document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && detailModal?.classList.contains('is-open')){
    closePortfolioDetail();
  }
});

