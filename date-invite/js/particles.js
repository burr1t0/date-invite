// Мягкие плавающие частицы на фоне
(function() {
    const container = document.getElementById('particles');
    if (!container) return;

    const colors = ['#F4C2C2', '#E8A0A0', '#FFD4D4', '#F5EDE3'];
    const count = 20;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 6 + 3;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
        particle.style.animationDelay = (Math.random() * 10) + 's';
        container.appendChild(particle);
    }
})();
