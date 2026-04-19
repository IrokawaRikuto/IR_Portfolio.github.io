// 背景アニメーション：不規則に走る青いライン
(function () {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');

    let w, h;
    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // ライン1本分のデータ
    class Line {
        constructor() {
            this.reset();
        }

        reset() {
            // ランダムな開始位置（画面端から）
            const side = Math.random();
            if (side < 0.25) {
                this.x = 0;
                this.y = Math.random() * h;
                this.angle = (Math.random() * 0.8 - 0.4); // 右方向
            } else if (side < 0.5) {
                this.x = w;
                this.y = Math.random() * h;
                this.angle = Math.PI + (Math.random() * 0.8 - 0.4); // 左方向
            } else if (side < 0.75) {
                this.x = Math.random() * w;
                this.y = 0;
                this.angle = Math.PI / 2 + (Math.random() * 0.8 - 0.4); // 下方向
            } else {
                this.x = Math.random() * w;
                this.y = h;
                this.angle = -Math.PI / 2 + (Math.random() * 0.8 - 0.4); // 上方向
            }

            this.speed = 2 + Math.random() * 4;
            this.length = 60 + Math.random() * 140;
            this.opacity = 0.08 + Math.random() * 0.15;
            this.width = 0.5 + Math.random() * 1.5;
            this.life = 0;
            this.maxLife = this.length / this.speed + 20 + Math.random() * 40;

            // 青系の色バリエーション
            const hue = 210 + Math.random() * 40; // 210-250 (青〜紫青)
            this.color = 'hsla(' + hue + ', 80%, 60%, ';

            // 軌跡を記録
            this.trail = [];

            // 不規則な方向変化
            this.turnSpeed = (Math.random() - 0.5) * 0.02;
            this.turnTimer = 0;
            this.turnInterval = 20 + Math.random() * 40;
        }

        update() {
            this.life++;

            // 不規則に方向を変える
            this.turnTimer++;
            if (this.turnTimer > this.turnInterval) {
                this.turnSpeed = (Math.random() - 0.5) * 0.04;
                this.turnInterval = 15 + Math.random() * 35;
                this.turnTimer = 0;
            }
            this.angle += this.turnSpeed;

            const vx = Math.cos(this.angle) * this.speed;
            const vy = Math.sin(this.angle) * this.speed;
            this.x += vx;
            this.y += vy;

            this.trail.push({ x: this.x, y: this.y });

            // 軌跡の長さを制限
            const maxTrailPoints = Math.floor(this.length / this.speed);
            if (this.trail.length > maxTrailPoints) {
                this.trail.shift();
            }

            // 寿命チェック
            if (this.life > this.maxLife) {
                this.reset();
            }
        }

        draw() {
            if (this.trail.length < 2) return;

            // フェードイン・フェードアウト
            let fadeMultiplier = 1;
            if (this.life < 20) {
                fadeMultiplier = this.life / 20;
            } else if (this.life > this.maxLife - 20) {
                fadeMultiplier = (this.maxLife - this.life) / 20;
            }

            ctx.lineWidth = this.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // グラデーション描画（先端が明るく、尾が消える）
            for (let i = 1; i < this.trail.length; i++) {
                const t = i / this.trail.length;
                const alpha = t * this.opacity * fadeMultiplier;
                ctx.beginPath();
                ctx.strokeStyle = this.color + alpha + ')';
                ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
                ctx.stroke();
            }

            // 先端に小さなグロウ
            const tip = this.trail[this.trail.length - 1];
            const glowAlpha = this.opacity * fadeMultiplier * 0.5;
            const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 4);
            glow.addColorStop(0, this.color + glowAlpha + ')');
            glow.addColorStop(1, this.color + '0)');
            ctx.beginPath();
            ctx.fillStyle = glow;
            ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ライン数（パフォーマンスに配慮）
    const lineCount = 15;
    const lines = [];
    for (let i = 0; i < lineCount; i++) {
        const line = new Line();
        line.life = Math.random() * line.maxLife; // 初期タイミングをずらす
        lines.push(line);
    }

    function animate() {
        // 半透明の黒で塗りつぶし（残像なし、bodyのbgを活かす）
        ctx.clearRect(0, 0, w, h);

        for (const line of lines) {
            line.update();
            line.draw();
        }

        requestAnimationFrame(animate);
    }

    animate();
})();
