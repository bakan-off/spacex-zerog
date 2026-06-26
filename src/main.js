// Движок покадрового скроллинга для SpaceX Starship landing page

const canvas = document.getElementById('scrub-canvas');
const ctx = canvas.getContext('2d');

const totalFrames = 120;
const images = [];
let loadedCount = 0;

// Опции плавности скролла
let currentProgress = 0; // Плавное значение (lerp)
let targetProgress = 0;  // Реальное значение скролла

// Настройки путей к кадрам
// Кадры будут находиться в /assets/frames/frame_001.jpg ... frame_120.jpg
const getFramePath = (index) => {
  const paddedIndex = String(index).padStart(3, '0');
  return `/assets/frames/frame_${paddedIndex}.jpg`;
};

// Создание элемента загрузки на странице
const loaderOverlay = document.createElement('div');
loaderOverlay.id = 'loader-overlay';
loaderOverlay.className = 'fixed inset-0 z-[100] bg-space-black flex flex-col items-center justify-center font-mono transition-opacity duration-1000';
loaderOverlay.innerHTML = `
  <div class="max-w-md w-full px-6 flex flex-col items-center">
    <div class="text-space-neon text-xs tracking-[0.3em] uppercase mb-4 animate-pulse">SPACEX // БОРТОВЫЕ СИСТЕМЫ</div>
    <div class="w-full bg-space-gray h-[2px] rounded-full overflow-hidden mb-4 relative">
      <div id="loader-bar" class="absolute top-0 left-0 h-full bg-gradient-to-r from-space-blue to-space-neon transition-all duration-300" style="width: 0%"></div>
    </div>
    <div class="flex justify-between w-full text-[10px] text-space-titanium">
      <span id="loader-status">ИННИЦИАЛИЗАЦИЯ КАДРОВ...</span>
      <span id="loader-percentage">0%</span>
    </div>
  </div>
`;
document.body.appendChild(loaderOverlay);

// Предзагрузка кадров
function preloadImages() {
  return new Promise((resolve) => {
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        loadedCount++;
        const pct = Math.round((loadedCount / totalFrames) * 100);
        document.getElementById('loader-bar').style.width = `${pct}%`;
        document.getElementById('loader-percentage').textContent = `${pct}%`;
        document.getElementById('loader-status').textContent = `ЗАГРУЗКА ДАННЫХ МИССИИ [${loadedCount}/${totalFrames}]`;
        
        // Показываем первый кадр сразу после его загрузки
        if (i === 1) {
          drawFrame(img);
          canvas.classList.remove('opacity-0');
        }

        if (loadedCount === totalFrames) {
          // Убираем загрузочный экран с плавной анимацией
          setTimeout(() => {
            loaderOverlay.classList.add('opacity-0');
            setTimeout(() => {
              loaderOverlay.remove();
            }, 1000);
          }, 500);
          resolve();
        }
      };
      
      // В случае ошибки (например, если файлы еще не нарезаны)
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalFrames) {
          setTimeout(() => {
            loaderOverlay.classList.add('opacity-0');
            setTimeout(() => {
              loaderOverlay.remove();
            }, 1000);
          }, 500);
          resolve();
        }
      };

      images.push(img);
    }
  });
}

// Отрисовка кадра на canvas (симуляция object-fit: cover)
function drawFrame(img) {
  if (!img || !img.complete) return;
  
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  
  // Учитываем devicePixelRatio для кристальной четкости
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  ctx.scale(dpr, dpr);
  
  const imgWidth = img.width || 1920;
  const imgHeight = img.height || 1080;
  
  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, offsetX, offsetY;
  
  if (canvasRatio > imgRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    offsetX = 0;
    offsetY = (canvasHeight - drawHeight) / 2;
  } else {
    drawWidth = canvasHeight * imgRatio;
    drawHeight = canvasHeight;
    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = 0;
  }
  
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // Рисуем сглаженно
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// Адаптация размера canvas при изменении окна
window.addEventListener('resize', () => {
  const currentFrameIndex = Math.max(1, Math.min(totalFrames, Math.round(currentProgress * (totalFrames - 1)) + 1));
  const activeImg = images[currentFrameIndex - 1];
  if (activeImg) {
    drawFrame(activeImg);
  }
});

// Обновление состояния текстовых блоков на основе прогресса скролла
// Мы изолируем текстовые блоки с помощью интервалов видимости
const sectionsConfig = [
  { id: 'text-block-1', min: 0.00, max: 0.15, dotIndex: 0 },
  { id: 'text-block-2', min: 0.20, max: 0.35, dotIndex: 1 },
  { id: 'text-block-3', min: 0.40, max: 0.55, dotIndex: 2 },
  { id: 'text-block-4', min: 0.60, max: 0.75, dotIndex: 3 },
  { id: 'text-block-5', min: 0.80, max: 0.92, dotIndex: 4 },
  { id: 'text-block-6', min: 0.95, max: 1.00, dotIndex: 5 }
];

function updateTextBlocks(progress) {
  sectionsConfig.forEach(section => {
    const el = document.getElementById(section.id);
    if (!el) return;
    
    if (progress >= section.min && progress <= section.max) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Обновляем активные навигационные точки на панели справа
  const dots = document.querySelectorAll('.nav-dot');
  let activeDotIndex = 0;
  
  // Определяем к какому блоку мы ближе всего
  sectionsConfig.forEach((section) => {
    if (progress >= (section.min - 0.05) && progress <= (section.max + 0.05)) {
      activeDotIndex = section.dotIndex;
    }
  });
  
  // Дополнительно проверяем если мы перешли границу
  if (progress > 0.92) activeDotIndex = 5;

  dots.forEach((dot, idx) => {
    if (idx === activeDotIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  // Скрытие подсказки "Листайте вниз" после начала скролла
  const scrollHint = document.getElementById('scroll-hint');
  if (scrollHint) {
    if (progress > 0.05) {
      scrollHint.classList.add('opacity-0');
    } else {
      scrollHint.classList.remove('opacity-0');
    }
  }
}

// Симуляция данных телеметрии для десктопа
function updateTelemetry(progress, frameIndex) {
  const telemetryAlt = document.getElementById('telemetry-altitude');
  const telemetryVel = document.getElementById('telemetry-velocity');
  const telemetryFrame = document.getElementById('telemetry-frame');
  
  if (telemetryFrame) {
    telemetryFrame.textContent = `${frameIndex} / ${totalFrames}`;
  }

  // Расчет динамических значений телеметрии
  let altitude = 0;
  let velocity = 0;

  if (progress <= 0.15) {
    altitude = 0;
    velocity = 0;
  } else if (progress <= 0.35) {
    // Взлет: высота от 0 до 125 км, скорость от 0 до 8000 км/ч
    const t = (progress - 0.15) / 0.20;
    altitude = Math.round(t * 125);
    velocity = Math.round(t * 8000);
  } else if (progress <= 0.55) {
    // Выход на орбиту: высота от 125 до 390 км, скорость от 8000 до 27600 км/ч
    const t = (progress - 0.35) / 0.20;
    altitude = Math.round(125 + t * 265);
    velocity = Math.round(8000 + t * 19600);
  } else if (progress <= 0.75) {
    // Орбитальный полет и вход в атмосферу: высота от 390 до 95 км, скорость от 27600 до 18000 км/ч
    const t = (progress - 0.55) / 0.20;
    altitude = Math.round(390 - t * 295);
    velocity = Math.round(27600 - t * 9600);
  } else if (progress <= 0.92) {
    // Посадка/Второй этап: высота до 2 км, скорость до 450 км/ч
    const t = (progress - 0.75) / 0.17;
    altitude = Math.round(95 - t * 93);
    velocity = Math.round(18000 - t * 17550);
  } else {
    // Финал: Посадка завершена или стабильно
    altitude = 0;
    velocity = 0;
  }

  if (telemetryAlt) telemetryAlt.textContent = `${altitude} км`;
  if (telemetryVel) telemetryVel.textContent = `${velocity.toLocaleString('ru-RU')} км/ч`;
}

// Основной цикл анимации (requestAnimationFrame с LERP для плавности)
function animate() {
  // Интерполяция (линейная интерполяция между текущим и целевым прогрессом)
  // 0.1 дает приятную инерцию скролла
  currentProgress += (targetProgress - currentProgress) * 0.1;
  
  // Ограничиваем прогресс
  const progress = Math.max(0, Math.min(1, currentProgress));
  
  // Вычисляем индекс кадра (от 1 до 120)
  const frameIndex = Math.max(1, Math.min(totalFrames, Math.round(progress * (totalFrames - 1)) + 1));
  
  // Рисуем кадр
  const activeImg = images[frameIndex - 1];
  if (activeImg && activeImg.complete) {
    drawFrame(activeImg);
  }

  // Обновляем элементы интерфейса
  updateTextBlocks(progress);
  updateTelemetry(progress, frameIndex);
  
  // Обновляем прогресс-бар сверху
  const progressBar = document.getElementById('scroll-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progress * 100}%`;
  }

  requestAnimationFrame(animate);
}

// Подключение скролла
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  
  if (maxScroll <= 0) return;
  
  // Целевой прогресс в диапазоне от 0 до 1
  targetProgress = scrollTop / maxScroll;
});

// Клик по навигационным точкам справа
document.querySelectorAll('.nav-dot').forEach(dot => {
  dot.addEventListener('click', (e) => {
    const targetIdx = parseInt(e.target.getAttribute('data-target'), 10);
    const sectionConfig = sectionsConfig.find(s => s.dotIndex === targetIdx);
    
    if (sectionConfig) {
      const targetPercent = (sectionConfig.min + sectionConfig.max) / 2;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      window.scrollTo({
        top: targetPercent * maxScroll,
        behavior: 'smooth'
      });
    }
  });
});

// Инициализация при запуске
async function init() {
  await preloadImages();
  
  // Первоначальный расчет скролла
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll > 0) {
    targetProgress = scrollTop / maxScroll;
    currentProgress = targetProgress;
  }
  
  // Запуск цикла анимации
  requestAnimationFrame(animate);
}

init();

// --- Логика Управления Формой Обратной Связи ---

const mainScreen = document.getElementById('contacts-main-screen');
const formScreen = document.getElementById('contacts-form-screen');
const successScreen = document.getElementById('contacts-success-screen');

const btnShowForm = document.getElementById('btn-show-form');
const btnBackToMain = document.getElementById('btn-back-to-main');
const btnSuccessClose = document.getElementById('btn-success-close');
const orderForm = document.getElementById('order-form');
const btnSubmitOrder = document.getElementById('btn-submit-order');

// Переключение экранов с плавным фейдом
function fadeTransition(fromEl, toEl) {
  if (!fromEl || !toEl) return;
  fromEl.classList.add('opacity-0');
  setTimeout(() => {
    fromEl.classList.add('hidden');
    toEl.classList.remove('hidden');
    // Небольшая задержка перед убиранием opacity-0 для срабатывания transition
    setTimeout(() => {
      toEl.classList.remove('opacity-0');
    }, 50);
  }, 500);
}

if (btnShowForm && mainScreen && formScreen) {
  btnShowForm.addEventListener('click', () => {
    fadeTransition(mainScreen, formScreen);
  });
}

if (btnBackToMain && formScreen && mainScreen) {
  btnBackToMain.addEventListener('click', () => {
    fadeTransition(formScreen, mainScreen);
  });
}

if (btnSuccessClose && successScreen && mainScreen) {
  btnSuccessClose.addEventListener('click', () => {
    if (orderForm) orderForm.reset();
    fadeTransition(successScreen, mainScreen);
  });
}

// Обработка отправки формы
if (orderForm) {
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const keyInput = orderForm.querySelector('input[name="access_key"]');
    const key = keyInput ? keyInput.value : '';
    
    // Если ключ не изменен, симулируем успешную отправку для портфолио
    if (key === 'YOUR_ACCESS_KEY_HERE' || !key) {
      console.warn('Web3Forms Access Key не настроен. Активирована симуляция успешной отправки для портфолио.');
      if (btnSubmitOrder) {
        btnSubmitOrder.disabled = true;
        btnSubmitOrder.textContent = 'ОТПРАВКА НА ОРБИТУ...';
      }
      setTimeout(() => {
        if (btnSubmitOrder) {
          btnSubmitOrder.disabled = false;
          btnSubmitOrder.textContent = 'Отправить на орбиту';
        }
        fadeTransition(formScreen, successScreen);
      }, 1500);
      return;
    }

    // Реальная отправка через Web3Forms API
    if (btnSubmitOrder) {
      btnSubmitOrder.disabled = true;
      btnSubmitOrder.textContent = 'ОТПРАВКА НА ОРБИТУ...';
    }

    const formData = new FormData(orderForm);
    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: json
    })
    .then(async (response) => {
      const result = await response.json();
      if (response.status === 200) {
        fadeTransition(formScreen, successScreen);
      } else {
        console.error('Ошибка отправки Web3Forms:', result);
        alert('Ошибка при отправке: ' + (result.message || 'Неизвестная ошибка'));
      }
    })
    .catch((error) => {
      console.error('Сетевая ошибка при отправке:', error);
      alert('Ошибка соединения. Пожалуйста, попробуйте позже.');
    })
    .finally(() => {
      if (btnSubmitOrder) {
        btnSubmitOrder.disabled = false;
        btnSubmitOrder.textContent = 'Отправить на орбиту';
      }
    });
  });
}
