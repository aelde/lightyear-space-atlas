import { t } from './i18n.js?v=11';

(() => {
  const byId = id => document.getElementById(id);
  const slider = byId('radius-slider');
  const plus = byId('radius-plus');
  const minus = byId('radius-minus');
  if (!slider || !plus || !minus) return;
  let radius = Number(slider.value) || 1;
  const update = value => {
    radius = Math.min(10, Math.max(0, Number(value)));
    slider.value = String(radius);
    slider.setAttribute('aria-valuetext', `${radius} ${t('ปีแสง', radius === 1 ? 'light-year' : 'light-years')}`);
    byId('radius-value').value = String(radius);
    document.querySelector('.radius-readout>span').textContent = t('ปีแสง', radius === 1 ? 'light-year' : 'light-years');
    minus.disabled = radius === 0;
    plus.disabled = radius === 10;
    byId('map-fill').style.width = `${radius * 10}%`;
    byId('radius-dot').style.left = `${radius * 10}%`;
    let title, text;
    if (radius === 0) {
      title = t('โลก — จุดเริ่มต้นของเรา', 'Earth — our starting point');
      text = t('เริ่มขยายระยะออกจากโลก เพื่อดูว่าจุดหมายรอบตัวอยู่ไกลแค่ไหน', 'Expand the radius from Earth to see how far nearby destinations lie.');
    } else if (radius === 1) {
      title = t('เมฆออร์ตที่คาดว่ามีอยู่', 'The inferred Oort Cloud');
      text = t('อาจยังอยู่ในแหล่งวัตถุน้ำแข็งรอบระบบสุริยะ ยังไม่ถึงดาวฤกษ์ดวงอื่น', 'We may still be among the icy objects surrounding the Solar System, before reaching another star.');
    } else if (radius <= 4) {
      title = t('ยังไม่ถึงดาวฤกษ์เพื่อนบ้าน', 'Before our nearest neighbouring star');
      text = t('ระหว่างทางส่วนใหญ่เป็นอวกาศเบาบาง Proxima Centauri อยู่ห่างประมาณ 4.24 ปีแสง', 'Most of the space along the way is sparse. Proxima Centauri is about 4.24 light-years away.');
    } else {
      title = t('รู้จักจุดหมายใกล้บ้านมากขึ้น', 'Explore our stellar neighbourhood');
      text = t('จุดหมายเหล่านี้อยู่ภายในรัศมีที่เลือก แต่แต่ละแห่งอยู่คนละทิศ คลิกเพื่อรู้จักให้มากขึ้น', 'These destinations fall within the selected radius, in different directions. Choose one to discover more.');
    }
    byId('radius-result-title').textContent = title;
    byId('radius-result-text').textContent = text;
    document.dispatchEvent(new CustomEvent('radiuschange', { detail: radius }));
  };
  plus.addEventListener('click', () => update(radius + 1));
  minus.addEventListener('click', () => update(radius - 1));
  slider.addEventListener('input', () => update(slider.value));
  document.addEventListener('languagechange', () => update(radius));
  update(radius);
})();
