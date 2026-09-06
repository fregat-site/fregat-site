const burger=document.querySelector('.burger');
const nav=document.querySelector('.nav nav');
if(burger){burger.addEventListener('click',()=>{nav.classList.toggle('open');document.body.classList.toggle('menu-open')})}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
 const el=document.querySelector(a.getAttribute('href'));
 if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth'});nav?.classList.remove('open');document.body.classList.remove('menu-open')}
}));
