// Конфетти для финального экрана
class Confetti {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.pieces = [];
        this.running = false;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    launch() {
        if (!this.canvas) return;
        this.running = true;
        const colors = ['#F4C2C2', '#E8A0A0', '#D4787A', '#FFD4D4', '#C9656B', '#FFF8F0', '#FFB6C1'];
        
        for (let i = 0; i < 120; i++) {
            this.pieces.push({
                x: Math.random() * this.canvas.width,
                y: -Math.random() * this.canvas.height * 0.5,
                w: Math.random() * 10 + 5,
                h: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 3 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }
        this.animate();
    }

    animate() {
        if (!this.running) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        let alive = 0;
        this.pieces.forEach(p => {
            if (p.opacity <= 0) return;
            alive++;
            
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.rotation += p.rotationSpeed;
            
            if (p.y > this.canvas.height * 0.8) {
                p.opacity -= 0.02;
            }
            
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation * Math.PI / 180);
            this.ctx.globalAlpha = Math.max(0, p.opacity);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            this.ctx.restore();
        });

        if (alive > 0) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.running = false;
            this.pieces = [];
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

window.confetti = new Confetti('confettiCanvas');
