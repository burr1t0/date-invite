// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    startDate: new Date('2025-07-28T00:00:00+03:00'), // дата начала отношений
    dateDate: new Date('2026-05-02T17:00:00+03:00'),   // дата свидания (2 мая, 17:00)
    timezone: 'Europe/Moscow'
};

// ===== СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====
let currentScreen = 'entry';
let choiceMade = false;
let chosenStyle = null;

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем, был ли уже сделан выбор
    const saved = await FirebaseDB.get('date-choice');
    if (saved && saved.chosen) {
        choiceMade = true;
        chosenStyle = saved.hint;
    }

    // Запускаем счётчики
    updateRelationshipCounter();
    setInterval(updateRelationshipCounter, 1000);
    updateDateCounter();
    setInterval(updateDateCounter, 1000);

    // Обработчики
    setupEntryScreen();
    setupNavigation();
    setupHintsNavigation();
    setupFinaleButtons();
});

// ===== НАВИГАЦИЯ МЕЖДУ ЭКРАНАМИ =====
function goToScreen(screenId) {
    const current = document.querySelector('.screen.active');
    const next = document.getElementById('screen-' + screenId);
    if (!next || !current || current === next) return;

    current.classList.remove('active');

    setTimeout(() => {
        next.classList.add('active');
        currentScreen = screenId;

        // Запускаем анимации для нового экрана
        switch (screenId) {
            case 'months': animateMonths(); break;
            case 'words': animateWords(); break;
            case 'letter': animateLetter(); break;
            case 'constructor': initHints(); break;
            case 'finale': animateFinale(); break;
        }
    }, 400);
}

// ===== ЭКРАН 1: ВХОД =====
function setupEntryScreen() {
    const mau = document.getElementById('entryMau');
    let clickCount = 0;
    const mauResponses = ['мяу!', 'мяяяу~', 'мур...', 'мяу мяу!', '♡'];

    mau.addEventListener('click', () => {
        clickCount++;

        if (clickCount < 3) {
            // Промежуточные клики — мяуканье
            const response = mauResponses[Math.floor(Math.random() * mauResponses.length)];
            mau.textContent = response;

            gsap.fromTo(mau,
                { scale: 0.9 },
                { scale: 1, duration: 0.4, ease: 'back.out(1.7)' }
            );
        } else {
            // Третий клик — переход
            mau.textContent = '♡';
            gsap.to(mau, {
                scale: 1.5,
                opacity: 0,
                duration: 0.8,
                ease: 'power2.in',
                onComplete: () => goToScreen('months')
            });
        }
    });
}

// ===== ЭКРАН 2: 9 МЕСЯЦЕВ =====
function animateMonths() {
    const number = document.getElementById('monthsNumber');
    const label = document.querySelector('.months__label');

    gsap.fromTo(number,
        { opacity: 0, scale: 0.5, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'back.out(1.4)' }
    );

    gsap.fromTo(label,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, delay: 0.6, ease: 'power2.out' }
    );

    gsap.fromTo('.counter__item',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, delay: 1, ease: 'power2.out' }
    );

    gsap.fromTo('.months__facts',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.8, delay: 1.6, ease: 'power2.out' }
    );

    gsap.fromTo('#btnToWords2',
        { opacity: 0 },
        { opacity: 1, duration: 0.6, delay: 1.8 }
    );
}

// ===== ЭКРАН 3: ТАЙМЛАЙН =====
function animateTimeline() {
    const canvas = document.getElementById('journeyCanvas');
    const ctx = canvas.getContext('2d');
    const months = document.querySelectorAll('.journey__month');
    const caption = document.getElementById('journeyCaption');

    // Цвета из дизайна
    const C = {
        her:     '#D4787A',   // pink-deep — она
        him:     '#6B5456',   // text-secondary — он
        hand:    '#E8A0A0',   // pink-medium — соединение
        path:    '#F4C2C2',   // pink-soft — дорожка
        text:    '#3D2C2E',   // text-primary
        textSub: '#D4787A',
        bg:      '#FFF8F0',
    };

    const TOTAL = 10000;    // 10 секунд
    const WALK_START = 500; // когда начинают идти
    const WALK_END = 8000;  // когда доходят
    const WALK_DUR = WALK_END - WALK_START;

    let startTime = null;
    let rafId = null;
    let finished = false;

    // Размеры canvas
    function resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }
    resize();

    const W = canvas.getBoundingClientRect().width;
    const H = canvas.getBoundingClientRect().height;
    const groundY = H * 0.72;

    // Параметры фигурок
    const SCALE_HER = 0.9;
    const SCALE_HIM = 1.0;
    const HEAD_R = 11;
    const TORSO = 28;
    const UPPER_LEG = 20;
    const LOWER_LEG = 20;
    const UPPER_ARM = 16;
    const LOWER_ARM = 14;

    // Нарисовать одну фигурку со скелетной анимацией
    function drawPerson(x, y, phase, scale, isHer, alpha, holdHandRight) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        const color = isHer ? C.her : C.him;
        const lw = 2.2;

        // Параметры ходьбы по синусоиде
        const s = Math.sin(phase);
        const c = Math.cos(phase);

        // Тазовое покачивание
        const hipSwing = s * 3;
        const bodyBob = Math.abs(s) * -2; // тело чуть опускается в середине шага

        // Углы конечностей
        const thighL = s * 30;   // левое бедро
        const thighR = -s * 30;  // правое бедро (противофаза)
        const shinL  = Math.max(0, -s) * 35;  // голень сгибается только назад
        const shinR  = Math.max(0, s) * 35;

        // Руки в противофазе к ногам
        const armLUp = -s * 22;
        const armRUp = s * 22;
        const foreArmL = Math.abs(s) * 10;
        const foreArmR = Math.abs(s) * 10;

        const rad = Math.PI / 180;

        // Координаты ключевых точек
        const headY = -TORSO - HEAD_R + bodyBob;
        const hipY  = bodyBob;
        const shoulderY = headY + HEAD_R * 2 + 4;

        // === ГОЛОВА ===
        ctx.beginPath();
        ctx.arc(hipSwing * 0.3, headY, HEAD_R, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.stroke();

        // Волосы у неё — дуга сверху
        if (isHer) {
            ctx.beginPath();
            ctx.arc(hipSwing * 0.3, headY, HEAD_R + 3, Math.PI * 1.1, Math.PI * 1.9);
            ctx.strokeStyle = C.her;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // === ТЕЛО ===
        ctx.beginPath();
        ctx.moveTo(hipSwing * 0.3, headY + HEAD_R);
        ctx.lineTo(hipSwing, hipY);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.stroke();

        // === ЮБКА у неё ===
        if (isHer) {
            ctx.beginPath();
            ctx.moveTo(hipSwing - 7, hipY - 8);
            ctx.lineTo(hipSwing + 7, hipY - 8);
            ctx.lineTo(hipSwing + 11, hipY + 6);
            ctx.lineTo(hipSwing - 11, hipY + 6);
            ctx.closePath();
            ctx.strokeStyle = C.her;
            ctx.lineWidth = 1.8;
            ctx.stroke();
        }

        // === НОГИ ===
        // Левая нога
        const kneeLX = hipSwing + Math.sin(thighL * rad) * UPPER_LEG;
        const kneeLY = hipY + Math.cos(thighL * rad) * UPPER_LEG;
        const footLX = kneeLX + Math.sin((thighL + shinL) * rad) * LOWER_LEG;
        const footLY = kneeLY + Math.cos((thighL + shinL) * rad) * LOWER_LEG;

        ctx.beginPath();
        ctx.moveTo(hipSwing, hipY);
        ctx.lineTo(kneeLX, kneeLY);
        ctx.lineTo(footLX, footLY);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Правая нога
        const kneeRX = hipSwing + Math.sin(thighR * rad) * UPPER_LEG;
        const kneeRY = hipY + Math.cos(thighR * rad) * UPPER_LEG;
        const footRX = kneeRX + Math.sin((thighR - shinR) * rad) * LOWER_LEG;
        const footRY = kneeRY + Math.cos((thighR - shinR) * rad) * LOWER_LEG;

        ctx.beginPath();
        ctx.moveTo(hipSwing, hipY);
        ctx.lineTo(kneeRX, kneeRY);
        ctx.lineTo(footRX, footRY);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.stroke();

        // === РУКИ ===
        // Левая рука
        const elbowLX = shoulderY < 0 ? hipSwing * 0.3 + Math.sin((armLUp) * rad) * UPPER_ARM : 0;
        const elbowLY_base = shoulderY + HEAD_R;

        const shX = hipSwing * 0.3;
        const shY = shoulderY + HEAD_R;

        const eLX = shX + Math.sin(armLUp * rad) * UPPER_ARM;
        const eLY = shY + Math.cos(armLUp * rad) * UPPER_ARM;
        const wLX = eLX + Math.sin((armLUp - foreArmL) * rad) * LOWER_ARM;
        const wLY = eLY + Math.cos((armLUp - foreArmL) * rad) * LOWER_ARM;

        // Правая рука — если держится за руку, тянется вправо
        const eRX = shX + Math.sin(armRUp * rad) * UPPER_ARM;
        const eRY = shY + Math.cos(armRUp * rad) * UPPER_ARM;
        let wRX, wRY;
        if (holdHandRight) {
            // Рука тянется вправо — к партнёру
            wRX = eRX + 14;
            wRY = eRY + 2;
        } else {
            wRX = eRX + Math.sin((armRUp + foreArmR) * rad) * LOWER_ARM;
            wRY = eRY + Math.cos((armRUp + foreArmR) * rad) * LOWER_ARM;
        }

        ctx.beginPath();
        ctx.moveTo(shX, shY);
        ctx.lineTo(eLX, eLY);
        ctx.lineTo(wLX, wLY);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(shX, shY);
        ctx.lineTo(eRX, eRY);
        ctx.lineTo(wRX, wRY);
        ctx.strokeStyle = holdHandRight ? C.hand : color;
        ctx.lineWidth = lw;
        ctx.stroke();

        // Возвращаем мировые координаты запястья правой руки для соединения
        ctx.restore();

        return {
            wRX: x + wRX * scale,
            wRY: y + wRY * scale,
            shY: y + shY * scale,
            shX: x + shX * scale
        };
    }

    // Нарисовать сердечко
    function drawHeart(x, y, size, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.3);
        ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.3);
        ctx.bezierCurveTo(x - size, y + size * 0.65, x, y + size, x, y + size * 1.1);
        ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.65, x + size, y + size * 0.3);
        ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3);
        ctx.strokeStyle = C.her;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    // Easing
    function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
    function easeOut(t) { return 1 - Math.pow(1-t, 3); }

    function draw(ts) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const t = Math.min(elapsed / TOTAL, 1);

        ctx.clearRect(0, 0, W * 2, H * 2);

        // Прогресс ходьбы [0..1]
        const walkRaw = Math.max(0, (elapsed - WALK_START) / WALK_DUR);
        const walk = Math.min(walkRaw, 1);
        const walkEased = easeInOut(walk);

        // Позиции фигурок
        const startX = W * 0.08;
        const endX   = W * 0.82;
        const gap = 30; // между ними

        const herX = startX + (endX - startX - gap) * walkEased;
        const himX = herX + gap;
        const baseY = groundY;

        // Фаза ходьбы — частота * прогресс
        const walkPhase = walk * Math.PI * 10;
        const alpha = Math.min(elapsed / 400, 1); // плавное появление

        // === ДОРОЖКА ===
        const pathAlpha = Math.min(elapsed / 600, 0.6);
        ctx.save();
        ctx.globalAlpha = pathAlpha;
        ctx.beginPath();
        ctx.moveTo(startX - 10, groundY + 8);
        ctx.lineTo(startX + (endX - startX) * walkEased + 10, groundY + 8);
        ctx.strokeStyle = C.path;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // === ФИГУРКИ ===
        const herInfo = drawPerson(herX, baseY, walkPhase, SCALE_HER, true, alpha, true);
        const himInfo = drawPerson(himX, baseY, walkPhase + Math.PI, SCALE_HIM, false, alpha, false);

        // === СОЕДИНЁННЫЕ РУКИ — линия между ними ===
        if (alpha > 0.3) {
            const handAlpha = Math.min((elapsed - 600) / 400, 1) * alpha;
            if (handAlpha > 0) {
                ctx.save();
                ctx.globalAlpha = handAlpha;
                ctx.beginPath();
                // Её правое запястье → его левое плечо (упрощённо)
                ctx.moveTo(herInfo.wRX, herInfo.wRY);
                ctx.lineTo(himX * SCALE_HIM - 2, himInfo.shY + 8);
                ctx.strokeStyle = C.hand;
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.restore();
            }
        }

        // === МЕСЯЦЫ — подсветка текущего ===
        const monthIdx = Math.floor(walk * 9);
        months.forEach((m, i) => {
            const mAlpha = walk > i / 9 ? 1 : 0;
            m.style.opacity = mAlpha;
            if (i === Math.min(monthIdx, 8) && walk < 1) {
                m.style.color = '#D4787A';
                m.style.fontWeight = '500';
            } else if (walk >= 1 && i === 8) {
                m.style.color = '#D4787A';
            } else {
                m.style.color = '#B09092';
                m.style.fontWeight = '300';
            }
        });

        // === ТЕКСТ "9 месяцев" — появляется в конце ===
        const textPhase = Math.max(0, (elapsed - WALK_END) / 1200);
        const textAlpha = Math.min(easeOut(textPhase), 1);
        if (textAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = textAlpha;
            ctx.textAlign = 'center';

            // «9 месяцев»
            ctx.font = `300 ${Math.round(W * 0.1)}px 'Cormorant Garamond', serif`;
            ctx.fillStyle = C.text;
            ctx.fillText('9 месяцев', W / 2, groundY - 75);

            // «вместе»
            ctx.font = `italic 300 ${Math.round(W * 0.065)}px 'Cormorant Garamond', serif`;
            ctx.fillStyle = C.textSub;
            ctx.fillText('вместе', W / 2, groundY - 50);

            ctx.restore();

            // Сердечко над ними
            const heartAlpha = Math.min(easeOut(Math.max(0, textPhase - 0.3)), 1);
            const heartY = groundY - 120 - Math.sin(elapsed / 800) * 3; // лёгкое парение
            drawHeart(W / 2, heartY, 8 + textPhase * 3, heartAlpha);
        }

        // Подпись снизу
        const captionAlpha = Math.min(easeOut(Math.max(0, (elapsed - WALK_END - 800) / 800)), 1);
        if (captionAlpha > 0) {
            caption.style.opacity = captionAlpha;
        }

        if (!finished) {
            rafId = requestAnimationFrame(draw);
        }

        // Автопереход
        if (elapsed >= TOTAL && !finished) {
            finished = true;
            cancelAnimationFrame(rafId);
            setTimeout(() => goToScreen('words'), 300);
        }
    }

    rafId = requestAnimationFrame(draw);
}

// ===== ЭКРАН 4: ЧТО ТЫ ДЛЯ МЕНЯ =====
function animateWords() {
    const container = document.getElementById('wordsContainer');
    const words = [
        'Моё солнышко',
        'Самая нежная',
        'Самая заботливая',
        'Самая красивая',
        'Моя дорогая',
        'Та, с кем даже молчание значит очень много',
        'Та, с кем мяуканье — целый язык',
        'Моя котечка'
    ];

    container.innerHTML = '';
    let currentIndex = 0;

    // Кнопка сразу в DOM, но невидимая. pointerEvents сразу auto — можно пропустить анимацию
    const btn = document.createElement('button');
    btn.className = 'btn btn--next';
    btn.textContent = 'а теперь прочитай...';
    btn.style.opacity = '0';
    btn.style.pointerEvents = 'auto';
    btn.addEventListener('click', () => goToScreen('letter'));
    container.appendChild(btn);

    function showNextWord() {
        if (currentIndex >= words.length) {
            // Все слова показаны — показываем кнопку
            setTimeout(() => {
                gsap.to(btn, { opacity: 1, duration: 0.6 });
            }, 600);
            return;
        }

        // Предыдущие слова уходят вверх
        const existing = container.querySelectorAll('.word-item');
        existing.forEach(el => el.classList.add('fade'));

        const wordEl = document.createElement('div');
        wordEl.className = 'word-item';
        wordEl.textContent = words[currentIndex];
        container.insertBefore(wordEl, btn);

        setTimeout(() => wordEl.classList.add('visible'), 50);

        currentIndex++;
        // Последнее слово висит дольше
        const delay = currentIndex === words.length ? 2400 : 1600;
        setTimeout(showNextWord, delay);
    }

    setTimeout(showNextWord, 600);
}

// ===== ЭКРАН 5: ПИСЬМО =====
function animateLetter() {
    const heading = document.querySelector('.letter__heading');
    const lines = Array.from(document.querySelectorAll('.letter__line'));
    const signature = document.querySelector('.letter__signature');

    const elements = [
        { el: heading, pause: 0 },
        ...lines.map((el, i) => ({ el, pause: i === 0 ? 600 : 700 })),
        { el: signature, pause: 700 }
    ];

    const CHAR_DELAY = 42;

    // Сбрасываем всё
    elements.forEach(({ el }) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.dataset.original = el.textContent;
        el.textContent = '';
    });

    function typeElement(index) {
        if (index >= elements.length) return;
        const { el, pause } = elements[index];
        const text = el.dataset.original;

        let i = 0;
        function tick() {
            if (i < text.length) {
                el.appendChild(document.createTextNode(text[i]));
                i++;
                const jitter = CHAR_DELAY + (Math.random() * CHAR_DELAY * 0.5 - CHAR_DELAY * 0.25);
                setTimeout(tick, jitter);
            } else {
                setTimeout(() => typeElement(index + 1), pause);
            }
        }

        setTimeout(tick, index === 0 ? 400 : 0);
    }

    // Добавляем keyframe для курсора если ещё нет
    if (!document.getElementById('cursorKeyframe')) {
        const style = document.createElement('style');
        style.id = 'cursorKeyframe';
        style.textContent = '@keyframes letterCursor{0%,100%{opacity:1}50%{opacity:0}}';
        document.head.appendChild(style);
    }

    typeElement(0);

    // Кнопка — сразу кликабельна, появляется через 2с (можно пропустить анимацию)
    const btn = document.getElementById('btnToConstructor');
    btn.style.opacity = '0';
    btn.style.pointerEvents = 'auto';
    setTimeout(() => {
        gsap.to('#btnToConstructor', { opacity: 1, duration: 0.6 });
    }, 2000);
}

// ===== ЭКРАН 6: ПАСХАЛКИ =====
const HINTS_DATA = {
    1: {
        text: 'Иногда лучше просто закрыть глаза и чувствовать',
        img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80'
    },
    2: {
        text: 'Иногда лучший маршрут — тот, что без карты',
        img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80'
    },
    3: {
        text: 'Некоторые вещи лучше получать неожиданно',
        img: 'https://images.unsplash.com/photo-1487530811015-780be43dc900?w=600&q=80'
    },
    4: {
        text: 'Иногда красота живёт всего несколько дней — а потом остаётся только в памяти',
        img: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=600&q=80'
    }
};

function initHints() {
    if (choiceMade && chosenStyle) {
        // Уже выбирала — показываем её карточку, потом финал
        const hint = HINTS_DATA[chosenStyle];
        const content = document.getElementById('hintsContent');
        const reveal = document.getElementById('hintsReveal');
        const chosenText = document.getElementById('hintsChosenText');
        const label = document.getElementById('hintsRevealLabel');

        chosenText.textContent = hint.text;
        content.style.display = 'none';
        reveal.style.display = 'flex';

        gsap.to(label, { opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: 'power2.out' });
        gsap.to('.hints__chosen-card', { opacity: 1, scale: 1, duration: 0.7, delay: 0.7, ease: 'back.out(1.3)' });
        gsap.fromTo('#btnHintsNext', { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 1.4 });
        return;
    }

    // Анимируем появление карточек
    const cards = document.querySelectorAll('.hints__card');
    gsap.fromTo('.hints__header',
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }
    );
    gsap.fromTo(cards,
        { opacity: 0, scale: 0.85, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.4, ease: 'back.out(1.4)' }
    );

    // Обработчик выбора
    cards.forEach(card => {
        card.addEventListener('click', () => onHintChosen(card), { once: true });
    });
}

function onHintChosen(chosenCard) {
    const hintNum = parseInt(chosenCard.dataset.hint);
    const hint = HINTS_DATA[hintNum];

    // Сохраняем в Firebase
    FirebaseDB.set('date-choice', {
        chosen: true,
        hint: hintNum,
        timestamp: new Date().toISOString()
    });
    choiceMade = true;

    // Остальные карточки разлетаются
    const allCards = document.querySelectorAll('.hints__card');
    const directions = [
        { x: -160, y: -120, r: -25 },
        { x: 160, y: -100, r: 20 },
        { x: -140, y: 120, r: 15 },
        { x: 160, y: 130, r: -20 }
    ];

    allCards.forEach((card, i) => {
        if (card === chosenCard) return;
        const d = directions[i];
        gsap.to(card, {
            x: d.x, y: d.y,
            rotation: d.r,
            opacity: 0,
            scale: 0.6,
            duration: 0.55,
            ease: 'power2.in'
        });
    });

    // Убираем header и выбранную карточку
    gsap.to('.hints__header', { opacity: 0, y: -15, duration: 0.4, delay: 0.1 });
    gsap.to(chosenCard, { opacity: 0, scale: 0.8, duration: 0.4, delay: 0.3 });

    // Показываем reveal
    setTimeout(() => {
        const content = document.getElementById('hintsContent');
        const reveal = document.getElementById('hintsReveal');
        const chosenText = document.getElementById('hintsChosenText');
        const label = document.getElementById('hintsRevealLabel');

        chosenText.textContent = hint.text;

        content.style.display = 'none';
        reveal.style.display = 'flex';

        // Анимируем появление
        gsap.to(label, { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: 'power2.out' });
        gsap.to('.hints__chosen-card', {
            opacity: 1, scale: 1,
            duration: 0.7, delay: 0.6,
            ease: 'back.out(1.3)'
        });
        gsap.fromTo('#btnHintsNext',
            { opacity: 0 },
            { opacity: 1, duration: 0.5, delay: 1.4 }
        );
    }, 700);
}

function setupHintsNavigation() {
    document.getElementById('btnHintsNext').addEventListener('click', () => goToScreen('finale'));
}

// ===== ЭКРАН 7: ФИНАЛ =====
function animateFinale() {
    const lines = document.querySelectorAll('.finale__line');
    const delays = [0, 0.5, 0.9, 1.6];

    lines.forEach((line, i) => {
        gsap.to(line, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay: delays[i],
            ease: 'power3.out'
        });
    });

    // Таймер появляется после текста
    gsap.to('#finaleTimer', {
        opacity: 1,
        duration: 1,
        delay: 2.6,
        ease: 'power2.out'
    });

    // Мяу — последним
    gsap.to('#finaleMau', {
        opacity: 1,
        duration: 1,
        delay: 3.4,
        ease: 'power2.out'
    });
}

function setupFinaleButtons() {
    // Кнопок нет, функция оставлена для совместимости
}

// ===== НАВИГАЦИЯ (КНОПКИ) =====
function setupNavigation() {
    document.getElementById('btnToWords2').addEventListener('click', () => goToScreen('words'));
    document.getElementById('btnToConstructor').addEventListener('click', () => {
        goToScreen('constructor');
    });
}

// ===== СЧЁТЧИК ОТНОШЕНИЙ =====
function updateRelationshipCounter() {
    const now = new Date();
    const msk = new Date(now.toLocaleString('en-US', { timeZone: CONFIG.timezone }));
    const diff = msk - CONFIG.startDate;

    if (diff < 0) return;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    setText('counterDays', days);
    setText('counterHours', hours);
    setText('counterMinutes', minutes);
    setText('counterSeconds', seconds);
}

// ===== СЧЁТЧИК ДО СВИДАНИЯ =====
function updateDateCounter() {
    const now = new Date();
    const msk = new Date(now.toLocaleString('en-US', { timeZone: CONFIG.timezone }));
    const diff = CONFIG.dateDate - msk;

    if (diff <= 0) {
        setText('dateDays', '0');
        setText('dateHours', '0');
        setText('dateMinutes', '0');
        setText('dateSeconds', '0');
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    setText('dateDays', days);
    setText('dateHours', hours);
    setText('dateMinutes', minutes);
    setText('dateSeconds', seconds);
}

// ===== УТИЛИТЫ =====
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}