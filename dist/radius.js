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
    slider.setAttribute('aria-valuetext', `${radius} ปีแสง`);
    byId('radius-value').value = String(radius);
    minus.disabled = radius === 0;
    plus.disabled = radius === 10;
    byId('map-fill').style.width = `${radius * 10}%`;
    byId('radius-dot').style.left = `${radius * 10}%`;
    let title, text;
    if (radius === 0) {
      title = 'โลก — จุดเริ่มต้นของเรา';
      text = 'เริ่มขยายระยะออกจากโลก เพื่อดูว่าจุดหมายรอบตัวอยู่ไกลแค่ไหน';
    } else if (radius === 1) {
      title = 'เมฆออร์ตที่คาดว่ามีอยู่';
      text = 'อาจยังอยู่ในแหล่งวัตถุน้ำแข็งรอบระบบสุริยะ ยังไม่ถึงดาวฤกษ์ดวงอื่น';
    } else if (radius <= 4) {
      title = 'ยังไม่ถึงดาวฤกษ์เพื่อนบ้าน';
      text = 'ระหว่างทางส่วนใหญ่เป็นอวกาศเบาบาง Proxima Centauri อยู่ห่างประมาณ 4.24 ปีแสง';
    } else {
      title = 'รู้จักจุดหมายใกล้บ้านมากขึ้น';
      text = 'จุดหมายเหล่านี้อยู่ภายในรัศมีที่เลือก แต่แต่ละแห่งอยู่คนละทิศ คลิกเพื่อรู้จักให้มากขึ้น';
    }
    byId('radius-result-title').textContent = title;
    byId('radius-result-text').textContent = text;
    document.dispatchEvent(new CustomEvent('radiuschange', { detail: radius }));
  };
  plus.addEventListener('click', () => update(radius + 1));
  minus.addEventListener('click', () => update(radius - 1));
  slider.addEventListener('input', () => update(slider.value));
  update(radius);
})();
