// ===== シューティングミニゲーム =====
(function () {
    // ===== DOM =====
    const modal = document.getElementById('game-modal');
    if (!modal) return;
    const modalClose = modal.querySelector('.modal-close');
    const modalBackdrop = modal.querySelector('.modal-backdrop');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const hud = document.getElementById('game-hud');
    const scoreEl = document.getElementById('game-score');
    const livesEl = document.getElementById('game-lives');
    const overlay = document.getElementById('game-overlay');
    const titleScreen = document.getElementById('game-title-screen');
    const overScreen = document.getElementById('game-over-screen');
    const rankingScreen = document.getElementById('game-ranking-screen');
    const finalScoreEl = document.getElementById('game-final-score');
    const nameInput = document.getElementById('game-name');
    const startBtn = document.getElementById('game-start-btn');
    const playBtn = document.getElementById('game-play-btn');
    const submitBtn = document.getElementById('game-submit-btn');
    const retryBtn = document.getElementById('game-retry-btn');
    const rankingList = document.getElementById('game-ranking-list');
    const rankingCloseBtn = document.getElementById('game-ranking-close');

    // ===== Constants =====
    const W = 360;
    const H = 640;
    canvas.width = W;
    canvas.height = H;

    const PLAYER_SIZE = 14;
    const PLAYER_SPEED = 4;
    const PLAYER_HITBOX = 3;
    const BULLET_W = 3;
    const BULLET_H = 12;
    const BULLET_SPEED = 8;
    const FIRE_INTERVAL = 6;
    const MAX_LIVES = 3;
    const INVINCIBLE_FRAMES = 90;

    // ===== State =====
    var state = 'TITLE'; // TITLE, PLAYING, GAMEOVER, RANKING
    var animId = null;
    var frameCount = 0;
    var score = 0;
    var lives = 0;
    var invTimer = 0;
    var fireTimer = 0;
    var difficulty = 1;
    var spawnTimer = 0;

    // Entity pools
    var player = { x: W / 2, y: H - 60 };
    var pBullets = [];
    var enemies = [];
    var eBullets = [];
    var particles = [];
    var stars = [];

    // Input
    var keys = {};

    // ===== Stars (background) =====
    function initStars() {
        stars = [];
        for (var i = 0; i < 40; i++) {
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                speed: 0.5 + Math.random() * 1.5,
                size: 0.5 + Math.random() * 1.5
            });
        }
    }

    function updateStars() {
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            s.y += s.speed;
            if (s.y > H) {
                s.y = 0;
                s.x = Math.random() * W;
            }
        }
    }

    function drawStars() {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
    }

    // ===== Player =====
    function updatePlayer() {
        var dx = 0, dy = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) dx = -1;
        if (keys['ArrowRight'] || keys['KeyD']) dx = 1;
        if (keys['ArrowUp'] || keys['KeyW']) dy = -1;
        if (keys['ArrowDown'] || keys['KeyS']) dy = 1;

        // Normalize diagonal
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        player.x += dx * PLAYER_SPEED;
        player.y += dy * PLAYER_SPEED;

        // Clamp
        if (player.x < PLAYER_SIZE) player.x = PLAYER_SIZE;
        if (player.x > W - PLAYER_SIZE) player.x = W - PLAYER_SIZE;
        if (player.y < PLAYER_SIZE) player.y = PLAYER_SIZE;
        if (player.y > H - PLAYER_SIZE) player.y = H - PLAYER_SIZE;

        // Invincibility
        if (invTimer > 0) invTimer--;

        // Fire
        if (keys['Space']) {
            fireTimer++;
            if (fireTimer >= FIRE_INTERVAL) {
                fireTimer = 0;
                pBullets.push({ x: player.x - 5, y: player.y - PLAYER_SIZE });
                pBullets.push({ x: player.x + 5, y: player.y - PLAYER_SIZE });
            }
        } else {
            fireTimer = FIRE_INTERVAL - 1; // fire immediately on press
        }
    }

    function drawPlayer() {
        if (invTimer > 0 && Math.floor(invTimer / 4) % 2 === 0) return;

        ctx.save();
        ctx.translate(player.x, player.y);

        // Ship body
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, -PLAYER_SIZE);
        ctx.lineTo(-PLAYER_SIZE * 0.7, PLAYER_SIZE * 0.6);
        ctx.lineTo(0, PLAYER_SIZE * 0.3);
        ctx.lineTo(PLAYER_SIZE * 0.7, PLAYER_SIZE * 0.6);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        ctx.fillStyle = 'rgba(255, 68, 68, 0.8)';
        ctx.beginPath();
        ctx.arc(0, PLAYER_SIZE * 0.5, 3 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();

        // Hitbox indicator
        ctx.fillStyle = 'rgba(255, 68, 68, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, PLAYER_HITBOX, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // ===== Player Bullets =====
    function updatePBullets() {
        for (var i = pBullets.length - 1; i >= 0; i--) {
            pBullets[i].y -= BULLET_SPEED;
            if (pBullets[i].y < -BULLET_H) {
                pBullets.splice(i, 1);
            }
        }
    }

    function drawPBullets() {
        ctx.fillStyle = '#ff4444';
        for (var i = 0; i < pBullets.length; i++) {
            var b = pBullets[i];
            ctx.fillRect(b.x - BULLET_W / 2, b.y, BULLET_W, BULLET_H);
        }
    }

    // ===== Enemies =====
    function spawnEnemy() {
        var type = Math.random();
        var e = {
            x: 30 + Math.random() * (W - 60),
            y: -20,
            hp: 1,
            speed: 1 + Math.random() * 1,
            pattern: 'straight',
            fireRate: 120,
            fireTimer: Math.floor(Math.random() * 60),
            size: 12,
            baseX: 0,
            age: 0
        };

        if (difficulty >= 3 && type > 0.6) {
            e.pattern = 'sine';
            e.baseX = e.x;
            e.hp = 2;
            e.size = 14;
        }
        if (difficulty >= 5 && type > 0.85) {
            e.pattern = 'aimed';
            e.hp = 3;
            e.speed = 0.6;
            e.fireRate = 60;
            e.size = 16;
        }

        e.hp += Math.floor(difficulty / 4);
        e.fireRate = Math.max(30, e.fireRate - difficulty * 3);

        enemies.push(e);
    }

    function updateEnemies() {
        var spawnRate = Math.max(15, 60 - difficulty * 4);
        spawnTimer++;
        if (spawnTimer >= spawnRate) {
            spawnTimer = 0;
            spawnEnemy();
            if (difficulty >= 4 && Math.random() > 0.5) spawnEnemy();
        }

        for (var i = enemies.length - 1; i >= 0; i--) {
            var e = enemies[i];
            e.age++;
            e.y += e.speed;

            if (e.pattern === 'sine') {
                e.x = e.baseX + Math.sin(e.age * 0.03) * 50;
            }

            // Fire
            e.fireTimer++;
            if (e.fireTimer >= e.fireRate && e.y > 20 && e.y < H * 0.7) {
                e.fireTimer = 0;
                fireEnemyBullet(e);
            }

            // Remove if off screen
            if (e.y > H + 30) {
                enemies.splice(i, 1);
            }
        }
    }

    function fireEnemyBullet(e) {
        var angle = Math.atan2(player.y - e.y, player.x - e.x);
        var speed = 2 + difficulty * 0.15;

        if (e.pattern === 'aimed' && difficulty >= 6) {
            // Spread shot
            for (var a = -0.3; a <= 0.3; a += 0.3) {
                eBullets.push({
                    x: e.x, y: e.y,
                    vx: Math.cos(angle + a) * speed,
                    vy: Math.sin(angle + a) * speed,
                    size: 4
                });
            }
        } else {
            eBullets.push({
                x: e.x, y: e.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4
            });
        }
    }

    function drawEnemies() {
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            ctx.save();
            ctx.translate(e.x, e.y);

            // Body
            ctx.fillStyle = e.pattern === 'aimed' ? '#ff6666' : '#cc3333';
            ctx.beginPath();
            ctx.moveTo(0, e.size);
            ctx.lineTo(-e.size * 0.8, -e.size * 0.4);
            ctx.lineTo(0, -e.size * 0.1);
            ctx.lineTo(e.size * 0.8, -e.size * 0.4);
            ctx.closePath();
            ctx.fill();

            // Core
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, e.size * 0.2, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // ===== Enemy Bullets =====
    function updateEBullets() {
        for (var i = eBullets.length - 1; i >= 0; i--) {
            var b = eBullets[i];
            b.x += b.vx;
            b.y += b.vy;
            if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) {
                eBullets.splice(i, 1);
            }
        }
    }

    function drawEBullets() {
        ctx.fillStyle = '#ff8888';
        for (var i = 0; i < eBullets.length; i++) {
            var b = eBullets[i];
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ===== Particles =====
    function spawnExplosion(x, y, color) {
        for (var i = 0; i < 8; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 1 + Math.random() * 3;
            particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20 + Math.random() * 15,
                maxLife: 35,
                size: 2 + Math.random() * 3,
                color: color || '#ff4444'
            });
        }
    }

    function updateParticles() {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life--;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles() {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    // ===== Collision =====
    function checkCollisions() {
        // Player bullets vs enemies
        for (var i = pBullets.length - 1; i >= 0; i--) {
            var b = pBullets[i];
            for (var j = enemies.length - 1; j >= 0; j--) {
                var e = enemies[j];
                var dx = b.x - e.x;
                var dy = b.y - e.y;
                if (dx * dx + dy * dy < (e.size + 4) * (e.size + 4)) {
                    pBullets.splice(i, 1);
                    e.hp--;
                    if (e.hp <= 0) {
                        score += 100 * difficulty;
                        spawnExplosion(e.x, e.y, '#ff4444');
                        enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }

        // Enemy bullets vs player
        if (invTimer > 0) return;
        for (var i = eBullets.length - 1; i >= 0; i--) {
            var b = eBullets[i];
            var dx = b.x - player.x;
            var dy = b.y - player.y;
            if (dx * dx + dy * dy < (PLAYER_HITBOX + b.size) * (PLAYER_HITBOX + b.size)) {
                eBullets.splice(i, 1);
                playerHit();
                break;
            }
        }

        // Enemy body vs player
        for (var i = enemies.length - 1; i >= 0; i--) {
            var e = enemies[i];
            var dx = e.x - player.x;
            var dy = e.y - player.y;
            if (dx * dx + dy * dy < (PLAYER_HITBOX + e.size * 0.5) * (PLAYER_HITBOX + e.size * 0.5)) {
                playerHit();
                break;
            }
        }
    }

    function playerHit() {
        lives--;
        invTimer = INVINCIBLE_FRAMES;
        spawnExplosion(player.x, player.y, '#ffffff');
        // Clear nearby enemy bullets
        eBullets = [];
        if (lives <= 0) {
            gameOver();
        }
    }

    // ===== Game State =====
    function resetGame() {
        frameCount = 0;
        score = 0;
        lives = MAX_LIVES;
        invTimer = 0;
        fireTimer = 0;
        difficulty = 1;
        spawnTimer = 0;
        player.x = W / 2;
        player.y = H - 60;
        pBullets = [];
        enemies = [];
        eBullets = [];
        particles = [];
        initStars();
    }

    function startGame() {
        resetGame();
        state = 'PLAYING';
        overlay.hidden = true;
        updateHUD();
    }

    function gameOver() {
        state = 'GAMEOVER';
        overlay.hidden = false;
        titleScreen.hidden = true;
        overScreen.hidden = false;
        rankingScreen.hidden = true;
        finalScoreEl.textContent = 'SCORE: ' + score;
        nameInput.value = '';
        nameInput.focus();
    }

    function showRanking() {
        state = 'RANKING';
        overScreen.hidden = true;
        rankingScreen.hidden = false;
        rankingList.innerHTML = '<li><span style="color:var(--text-muted)">Loading...</span></li>';

        GameRanking.fetchRanking(10).then(function (data) {
            rankingList.innerHTML = '';
            if (data.length === 0) {
                rankingList.innerHTML = '<li><span style="color:var(--text-muted)">No scores yet</span></li>';
                return;
            }
            for (var i = 0; i < data.length; i++) {
                var li = document.createElement('li');
                li.innerHTML = '<span class="rank">' + (i + 1) + '.</span>' +
                    '<span class="name">' + escapeHtml(data[i].name) + '</span>' +
                    '<span class="score">' + data[i].score + '</span>';
                rankingList.appendChild(li);
            }
        });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function updateHUD() {
        scoreEl.textContent = 'SCORE: ' + score;
        var hearts = '';
        for (var i = 0; i < lives; i++) hearts += '\u2764 ';
        livesEl.textContent = hearts;
    }

    // ===== Game Loop =====
    function gameLoop() {
        // Update
        frameCount++;
        difficulty = 1 + Math.floor(frameCount / 900); // escalate every 15s at 60fps

        updateStars();
        updatePlayer();
        updatePBullets();
        updateEnemies();
        updateEBullets();
        updateParticles();
        checkCollisions();
        updateHUD();

        // Draw
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        drawStars();
        drawPBullets();
        drawEnemies();
        drawEBullets();
        drawPlayer();
        drawParticles();

        // Difficulty indicator
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '10px monospace';
        ctx.fillText('LV.' + difficulty, W - 40, 20);

        if (state === 'PLAYING') {
            animId = requestAnimationFrame(gameLoop);
        }
    }

    // ===== Modal Open/Close =====
    function openGameModal() {
        modal.classList.add('active');
        document.body.style.overflowY = 'hidden';
        state = 'TITLE';
        overlay.hidden = false;
        titleScreen.hidden = false;
        overScreen.hidden = true;
        rankingScreen.hidden = true;

        // Update language for game modal
        modal.querySelectorAll('[data-ja][data-en]').forEach(function (el) {
            el.textContent = el.getAttribute('data-' + currentLang);
        });

        initStars();
        drawTitleBg();
    }

    function closeGameModal() {
        modal.classList.remove('active');
        document.body.style.overflowY = '';
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
        state = 'TITLE';
        keys = {};
    }

    function drawTitleBg() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        drawStars();
    }

    // ===== Input =====
    document.addEventListener('keydown', function (e) {
        if (state !== 'PLAYING') return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) !== -1) {
            e.preventDefault();
        }
        keys[e.code] = true;
    });

    document.addEventListener('keyup', function (e) {
        keys[e.code] = false;
    });

    // ===== Touch Controls =====
    var touchId = null;
    var touchStartX = 0;
    var touchStartY = 0;
    var touchPlayerStartX = 0;
    var touchPlayerStartY = 0;

    canvas.addEventListener('touchstart', function (e) {
        if (state !== 'PLAYING') return;
        e.preventDefault();
        var t = e.changedTouches[0];
        touchId = t.identifier;
        var rect = canvas.getBoundingClientRect();
        var scaleX = W / rect.width;
        var scaleY = H / rect.height;
        touchStartX = (t.clientX - rect.left) * scaleX;
        touchStartY = (t.clientY - rect.top) * scaleY;
        touchPlayerStartX = player.x;
        touchPlayerStartY = player.y;
        keys['Space'] = true;
    }, { passive: false });

    canvas.addEventListener('touchmove', function (e) {
        if (state !== 'PLAYING') return;
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
            var t = e.changedTouches[i];
            if (t.identifier === touchId) {
                var rect = canvas.getBoundingClientRect();
                var scaleX = W / rect.width;
                var scaleY = H / rect.height;
                var cx = (t.clientX - rect.left) * scaleX;
                var cy = (t.clientY - rect.top) * scaleY;
                player.x = touchPlayerStartX + (cx - touchStartX);
                player.y = touchPlayerStartY + (cy - touchStartY);
                // Clamp
                if (player.x < PLAYER_SIZE) player.x = PLAYER_SIZE;
                if (player.x > W - PLAYER_SIZE) player.x = W - PLAYER_SIZE;
                if (player.y < PLAYER_SIZE) player.y = PLAYER_SIZE;
                if (player.y > H - PLAYER_SIZE) player.y = H - PLAYER_SIZE;
            }
        }
    }, { passive: false });

    canvas.addEventListener('touchend', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                touchId = null;
                keys['Space'] = false;
            }
        }
    });

    // ===== Event Listeners =====
    startBtn.addEventListener('click', openGameModal);
    modalClose.addEventListener('click', closeGameModal);
    modalBackdrop.addEventListener('click', closeGameModal);

    playBtn.addEventListener('click', function () {
        startGame();
        animId = requestAnimationFrame(gameLoop);
    });

    submitBtn.addEventListener('click', function () {
        var name = nameInput.value.trim() || 'AAA';
        submitBtn.disabled = true;
        submitBtn.textContent = '...';
        GameRanking.submitScore(name, score).then(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = currentLang === 'ja' ? '\u30B9\u30B3\u30A2\u9001\u4FE1' : 'Submit Score';
            showRanking();
        });
    });

    retryBtn.addEventListener('click', function () {
        startGame();
        animId = requestAnimationFrame(gameLoop);
    });

    rankingCloseBtn.addEventListener('click', function () {
        state = 'TITLE';
        titleScreen.hidden = false;
        overScreen.hidden = true;
        rankingScreen.hidden = true;

        drawTitleBg();
    });

    // Escape key for game modal
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeGameModal();
        }
    });

    // Initialize ranking system
    GameRanking.init();

    // Touch-action CSS on canvas
    canvas.style.touchAction = 'none';
})();
