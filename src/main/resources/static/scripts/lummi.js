window.toggleMenu = function(){
  const id = 'mobile-menu';
  let el = document.getElementById(id);
  if(!el){
    el = document.createElement('nav');
    el.id = id;
    el.className = 'mobile-menu';
    el.innerHTML = `
      <a href="#features" onclick="toggleMenu()">기능</a>
      <a href="#gallery" onclick="toggleMenu()">갤러리</a>
      <a href="#pricing" onclick="toggleMenu()">요금</a>
      <a href="#faq" onclick="toggleMenu()">FAQ</a>
      <a href="#cta" class="btn primary" style="margin-top:12px">무료로 시작하기</a>
    `;
    document.body.appendChild(el);
  }
  el.classList.toggle('show');
}

// set year in footer
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});

