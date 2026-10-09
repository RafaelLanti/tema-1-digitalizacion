
const theme = localStorage.getItem('theme') || 'light';
document.documentElement.dataset.theme = theme;
document.addEventListener('DOMContentLoaded',()=>{
  const toggle=document.querySelector('[data-theme-toggle]');
  if(toggle) toggle.addEventListener('click',()=>{
    const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
    document.documentElement.dataset.theme=next; localStorage.setItem('theme',next);
  });
  const menu=document.querySelector('[data-menu]');
  const nav=document.querySelector('.nav');
  if(menu) menu.addEventListener('click',()=>nav.classList.toggle('open'));
  const q=document.querySelector('[data-search]');
  if(q){
    q.addEventListener('input',()=>{
      const term=q.value.toLowerCase().trim();
      document.querySelectorAll('[data-searchable]').forEach(el=>{
        el.style.display=!term || el.innerText.toLowerCase().includes(term)?'':'none';
      });
    });
  }
  const path=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.navlinks a').forEach(a=>{
    if(a.getAttribute('href')===path) a.classList.add('active');
  });
});
