// ===== 言語切り替え =====
let currentLang = 'ja';
const langBtn = document.getElementById('lang-toggle');

function setLang(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    langBtn.textContent = lang === 'ja' ? 'EN' : 'JP';

    document.querySelectorAll('[data-ja][data-en]').forEach(el => {
        el.textContent = el.getAttribute('data-' + lang);
    });

    // placeholder切り替え
    document.querySelectorAll('[data-placeholder-ja][data-placeholder-en]').forEach(el => {
        el.placeholder = el.getAttribute('data-placeholder-' + lang);
    });
}

langBtn.addEventListener('click', () => {
    setLang(currentLang === 'ja' ? 'en' : 'ja');
});

// ===== ナビメニュー（ドロップダウン） =====
const navToggle = document.querySelector('.nav-toggle');
const navDropdown = document.querySelector('.nav-dropdown');

function openDropdown() {
    navDropdown.hidden = false;
    requestAnimationFrame(() => navDropdown.classList.add('open'));
    navToggle.setAttribute('aria-expanded', 'true');
}

function closeDropdown() {
    navDropdown.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    setTimeout(() => {
        if (!navDropdown.classList.contains('open')) navDropdown.hidden = true;
    }, 200);
}

navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navDropdown.classList.contains('open')) closeDropdown();
    else openDropdown();
});

// 外側クリックで閉じる
document.addEventListener('click', (e) => {
    if (navDropdown.classList.contains('open') && !e.target.closest('.nav-menu')) {
        closeDropdown();
    }
});

// Escで閉じる
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navDropdown.classList.contains('open')) closeDropdown();
});

// ===== 背景モーションON/OFF =====
const bgToggle = document.getElementById('bg-anim-toggle');
const bgSaved = localStorage.getItem('bgAnimEnabled');
let bgEnabled = bgSaved !== 'false';
bgToggle.setAttribute('aria-checked', bgEnabled ? 'true' : 'false');

bgToggle.addEventListener('click', () => {
    bgEnabled = !bgEnabled;
    bgToggle.setAttribute('aria-checked', bgEnabled ? 'true' : 'false');
    localStorage.setItem('bgAnimEnabled', bgEnabled ? 'true' : 'false');
    if (window.bgAnimation) {
        if (bgEnabled) window.bgAnimation.start();
        else window.bgAnimation.stop();
    }
});

// スクロールアニメーション（フェードイン）
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// フェードイン対象を登録
document.querySelectorAll('.section-title, .about-grid, .skill-category, .timeline, .contact-content').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// Worksカードは2列なので交互にstaggerをつける
document.querySelectorAll('.work-card').forEach((el, i) => {
    el.classList.add('fade-in');
    el.classList.add(i % 2 === 0 ? 'stagger-1' : 'stagger-2');
    observer.observe(el);
});

// ナビバーのスクロール時の効果 & トップに戻るボタン
const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 60) {
        navbar.style.borderBottomColor = 'rgba(108, 99, 255, 0.2)';
    } else {
        navbar.style.borderBottomColor = 'var(--border)';
    }

    if (window.scrollY > 400) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

// ===== スクリーンショットカルーセル状態 =====
let currentScreenshots = [];
let currentSSIndex = 0;
let currentWorkTitle = '';

function buildSSAlt(index) {
    const n = currentScreenshots.length;
    const ord = (index + 1) + (currentLang === 'ja' ? '枚目' : (n > 1 ? '/' + n : ''));
    return currentWorkTitle ? currentWorkTitle + ' - ' + ord : ord;
}

function changeScreenshot(dir) {
    if (currentScreenshots.length <= 1) return;
    currentSSIndex = (currentSSIndex + dir + currentScreenshots.length) % currentScreenshots.length;
    const img = document.querySelector('.work-detail-screenshot img');
    if (img) {
        img.src = currentScreenshots[currentSSIndex];
        img.alt = buildSSAlt(currentSSIndex);
    }
}

// ===== ライトボックス =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox.querySelector('.lightbox-img');
const lightboxClose = lightbox.querySelector('.lightbox-close');
const lightboxBackdrop = lightbox.querySelector('.lightbox-backdrop');
const lightboxPrev = lightbox.querySelector('.lightbox-prev');
const lightboxNext = lightbox.querySelector('.lightbox-next');

function openLightbox(index) {
    currentSSIndex = index;
    lightboxImg.src = currentScreenshots[currentSSIndex];
    lightboxImg.alt = buildSSAlt(currentSSIndex);
    lightboxPrev.style.display = currentScreenshots.length > 1 ? '' : 'none';
    lightboxNext.style.display = currentScreenshots.length > 1 ? '' : 'none';
    lightbox.classList.add('active');
}

function closeLightbox() {
    lightbox.classList.remove('active');
}

function lightboxNav(dir) {
    if (currentScreenshots.length <= 1) return;
    currentSSIndex = (currentSSIndex + dir + currentScreenshots.length) % currentScreenshots.length;
    lightboxImg.src = currentScreenshots[currentSSIndex];
    lightboxImg.alt = buildSSAlt(currentSSIndex);
    // モーダル側のサムネイルも同期
    const modalImg = document.querySelector('.work-detail-screenshot img');
    if (modalImg) {
        modalImg.src = currentScreenshots[currentSSIndex];
        modalImg.alt = buildSSAlt(currentSSIndex);
    }
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxBackdrop.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => lightboxNav(-1));
lightboxNext.addEventListener('click', () => lightboxNav(1));

// ===== モーダル（作品クリック時） =====
const modal = document.getElementById('work-modal');
const modalClose = modal.querySelector('.modal-close');
const modalBackdrop = modal.querySelector('.modal-backdrop');

// 作品ごとのデータ
const workData = {
    'puramai9': {
        title: { ja: '±9（プラマイナイン）', en: '±9 (Plus-Minus Nine)' },
        year: '2026',
        period: { ja: '1週間（企画書のみ）', en: '1 week (concept document only)' },
        tags: ['Unity', 'C#', { ja: '個人制作', en: 'Personal' }, { ja: '企画書', en: 'Design Document' }],
        award: null,
        env: 'Unity',
        desc: {
            ja: '「神ゲー創造主エボリューション」への応募用に、1週間で企画・制作したオリジナル戦略カードゲームの企画書。結果は一次審査落ち。\n\nコンセプトは「計算＋心理戦」。コイントスで決まる「当たり偶奇」に手札の合計値を合わせられるかで攻撃先が変わり、合っていれば相手に、外せば自分にダメージが返る。相手のHPを +100 と −100 のどちらの端に押し切っても勝ちという綱引き構造にすることで、削るか押し上げるかを切り替える2方向の勝ち筋を作った。出すカードでダメージ値を自分で決められるため、強い手ほど外したときのリスクも大きくなる設計になっている。\n\nルールが成立するかを確かめるため、テスト版を Unity で制作して実際に対戦を回しながら数値を調整した。掲載画像は提出した企画書（コンセプト・画面イメージ・1ラウンドの流れとゲームボリューム）。現状は企画書までで、この先の開発予定はない。',
            en: 'A design document for an original strategy card game, planned and produced in one week for submission to the Kamige Souzoushu Evolution game contest. It did not pass the first round of screening.\n\nThe concept is "calculation plus mind game." A coin toss sets a target parity, and whether the sum of the cards you play matches it decides who takes the damage — match it and the damage goes to your opponent, miss and it comes back to you. Victory comes from pushing the opponent to either the +100 or the −100 end of the HP track, which creates two opposing win conditions and lets players switch between chipping down and pushing up. Because you choose your own damage value through the cards you play, a stronger hand also means a more painful backfire.\n\nTo verify that the rules held up, I built a test version in Unity and tuned the numbers through actual play. The images are from the submitted document (concept, screen mockup, and the round flow and game volume). The project stands at the design document stage, with no further development planned.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: ['images/puramai9_Overview.webp', 'images/puramai9_Concept.webp', 'images/puramai9_Screen.webp', 'images/puramai9_Rules.webp'],
        download: '',
        repo: 'https://github.com/IrokawaRikuto/puramai9',
    },
    'touhou': {
        title: { ja: '東方春三校', en: 'Touhou Harusankou' },
        year: '2024',
        period: { ja: '約2ヶ月', en: 'About 2 months' },
        tags: ['Unity', { ja: '課題制作：個人', en: 'Assignment: Solo' }],
        award: { ja: 'おもしろゲームづくり学内コンテスト 意欲賞 受賞', en: 'Fun Game Making In-School Contest — Enthusiasm Award' },
        env: 'Unity',
        desc: {
            ja: 'プログラマーとして本格的に取り組んだ、記念すべき1作目。元々東方Projectのファンだったことから、ジャンルは迷わずシューティングを選んだ。プレイヤーへの自機狙い、敵の挙動パターン、残機システムなど、シューティングに必要な基本要素を一通り実装。Unityのビジュアルスクリプティングで構築したため作業効率は決して高くなく、調べながらの試行錯誤が続いたが、当時の自分なりに「できることを全部詰め込もう」と取り組んだ意欲が評価され、初出展のコンテストで賞を頂くことができた。\n\n工夫した点は、画面の比率・解像度を東方Project原作に合わせて4:3で構成したこと、フリー素材を集めて見た目の雰囲気を原作寄りに統一したこと、自機の移動速度を調整して操作感まで原作に寄せたこと。プログラマーとしてのスタート地点であり、「ゲームを最後まで作りきる」体験を初めて得た作品。',
            en: 'My very first complete project as a programmer. Being a fan of the Touhou Project series, I naturally settled on a shoot \'em up. The build covers the genre fundamentals — aimed shots toward the player, enemy behavior patterns, and a lives system — all implemented through Unity\'s Visual Scripting. The workflow leaned heavily on visual scripting and constant lookups, so iteration was slow, but the determination to "cram in everything I could do at the time" came through, and the project earned an award at the very first contest I ever submitted to.\n\nThe areas I focused on were authenticity to the source material. The screen aspect ratio and resolution were tuned to Touhou Project\'s 4:3 layout, free assets were curated to align the look with the original, and even the player ship\'s movement speed was adjusted so the feel matched the source. This was my starting line as a programmer — and the first time I experienced "finishing a game all the way through."'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: ['images/Touhou_Title.webp', 'images/Touhou_GamePlay.webp'],
        download: '',
    },
    'circlestriker': {
        title: { ja: 'CIRCLESTRIKER', en: 'CIRCLESTRIKER' },
        year: '2024',
        period: { ja: '約2ヶ月', en: 'About 2 months' },
        tags: ['Unity', 'C#', { ja: '課題制作：個人', en: 'Assignment: Solo' }],
        award: { ja: 'オリジナルTPS学内コンペ 構成力賞 受賞', en: 'Original TPS In-School Competition — Composition Award' },
        env: 'Unity / Visual Studio Code',
        desc: {
            ja: '2作目はUnity / C#でフルスクラッチした3Dアクションゲーム。当初は剣で敵をなぎ倒す無双系を構想していたが、開発過程で方向転換し、筒状の巨大ステージを進んでゴールを目指すコース型アクションゲームへと作り直した。\n\n本作の特徴はカメラとプレイヤーの位置関係。プレイヤー自身は左右に動かず、ステージ全体が回転することで疑似的に横移動を再現している。プレイヤーの左右には透明な壁を配置して進行ラインを固定し、視点をそのままにステージ側がスクロールする操作感が成立する設計にした。キャラクターには Unity-chan アセットを採用し、それに合わせて公式ボイス素材も組み込むことで、世界観の統一感を出している。\n\n敵キャラクターやエフェクトの追加までは手が回らず実装を断念したが、3D空間における移動・カメラ制御・ステージ構成を実装し切った経験が、その後の作品に繋がる土台となった作品。『巨大ステージそのものを回転させる』というアイデアが評価され、オリジナルTPS学内コンペでは『構成力賞』を頂くことができた。',
            en: 'My second project, built from scratch in Unity / C#. The original concept was a hack-and-slash where you mow down enemies with a sword, but partway through development I pivoted to a course-based 3D action game where the player advances through a giant cylindrical stage toward a goal.\n\nThe defining design feature is the camera-and-player relationship. The player character does not move sideways at all — instead, the entire stage rotates around them, reproducing horizontal movement in a pseudo way. Invisible walls placed to the player\'s left and right lock the lane of travel, so visually the stage scrolls past while the camera stays put. The character uses the Unity-chan asset, paired with official voice clips to keep the world consistent.\n\nI had wanted to add enemy characters and combat effects but ran out of bandwidth, leaving it as a pure course-style game. Even so, fully implementing 3D movement, camera control, and stage construction laid the foundation that carried into my later projects. The core idea — rotating the entire massive stage itself — was recognized at the Original TPS In-School Competition, where the project earned the Composition Award.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: ['images/CircleStrikerLogo.webp'],
        download: '',
    },
    'gamma': {
        title: { ja: 'GAMMA', en: 'GAMMA' },
        year: '2025',
        period: { ja: '約4ヶ月', en: 'About 4 months' },
        team: { ja: '9人', en: '9 members' },
        tags: ['C++', 'DirectX', { ja: '課題制作：チーム', en: 'Assignment: Team' }],
        award: null,
        env: 'Visual Studio / DirectX11',
        desc: {
            ja: '2年次の未来創造展（HEW）にてチーム制作したパズルアクションゲーム。プレイヤーが影に変身し、物体の影を足場にして進む独自のコンセプトを軸に、チームで企画から完成までを走り抜けた、自身にとって初のチーム制作作品。\n\nチーム結成直後に肺気胸を患い、しばらく制作に参加できない時期があったが、復帰後はリーダー補佐の立場で、TA（テクニカルアーティスト）としてチームに加わった。デザイナーへの素材提出フォーマットの取り決め、自身でのUI制作、プランナーと相談しながらのゲームストーリー構成に携わり、プログラマーとしてはプレイヤーの操作実装を担当。最終フェーズではチーム全体を横断するバグ修正にも回った。\n\n受賞には至らなかったものの、初めてのチーム制作、しかも病気というトラブルを挟みながらも、企画から完成・発表までをチーム全員で完走できた経験は大きく、その後のチーム制作観の土台になった作品。',
            en: 'My very first team project, created during the 2nd-year HEW exhibition: a puzzle action game built around the unique concept of the player transforming into a shadow and traversing the shadows of objects as footholds — from planning to release as a full team effort.\n\nShortly after the team was formed, I was diagnosed with a pneumothorax that sidelined me from development for a stretch of time. After recovering, I returned in a leader-support role as the team\'s Technical Artist — coordinating asset submission formats with the designers, building the UI myself, and shaping the game\'s story alongside the planner. As a programmer, I implemented the player controls, and in the final phase I took on bug fixes across the entire codebase.\n\nWe did not place at the exhibition, but completing the project from concept to release — as a full team, through my first team experience and a mid-development health setback — was a formative experience that shaped how I approach team-based development to this day.'
        },
        video: { type: 'video', src: 'videos/gamma_pv.mp4' },
        screenshots: ['images/gamma_screenshot.webp'],
        download: '',
    },
    'blast-ball': {
        title: { ja: 'ブラストボール', en: 'Blast Ball' },
        year: '2025',
        tags: ['C++', 'DirectX'],
        award: null,
        env: 'Visual Studio / DirectX11',
        desc: {
            ja: 'C++・DirectX で制作したゲーム。詳細な説明・スクリーンショットは後日追記予定。',
            en: 'A game developed with C++ and DirectX. A detailed writeup and screenshots will be added later.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: [],
        download: '',
    },
    'blade-slash': {
        title: { ja: 'ブレードスラッシュ', en: 'Blade Slash' },
        year: '2025',
        tags: [{ ja: '課題制作：個人', en: 'Assignment: Solo' }, 'OpenGL'],
        award: null,
        env: 'Nintendo Switch / OpenGL',
        desc: {
            ja: 'Nintendo Switch 向けに制作した課題制作のゲーム。OpenGL を用いて実装。詳細な説明・スクリーンショットは後日追記予定。',
            en: 'A solo assignment game developed for the Nintendo Switch, implemented using OpenGL. A detailed writeup and screenshots will be added later.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: [],
        download: '',
    },
    'gamma-plus': {
        title: { ja: 'GAMMA+', en: 'GAMMA+' },
        year: '2026',
        period: { ja: '約1ヶ月（原作GAMMAの約4ヶ月を含めると約5ヶ月）', en: 'About 1 month (about 5 months including the ~4 months on the original GAMMA)' },
        tags: ['C++', 'DirectX', { ja: 'リメイク', en: 'Remake' }, { ja: '個人制作', en: 'Personal' }],
        award: null,
        env: 'Visual Studio / DirectX11 / Claude Code Pro',
        desc: {
            ja: '2年次のチーム制作『GAMMA』を、当時の心残りを踏まえて個人でブラッシュアップしたリメイク作品。ゲームコンセプトはそのままに、操作感の改善、各種バグの修正、攻撃・被弾・演出系のエフェクト追加、STAGE構成とUIの全面刷新を行い、ゲームとしての完成度を一段引き上げた。「当時もっとこうしたかった」を一つずつ潰し、見た目と触り心地の両面から仕上げ直した一作。',
            en: 'A solo remake of GAMMA, the team project I worked on in my 2nd year, revisited and brushed up with everything I had learned since. The core game concept is unchanged, but controls have been refined, bugs squashed, attack/hit/presentation effects added, and the stage layout and UI fully redesigned — addressing the issues I could not resolve back then and pushing the overall polish another step forward.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: [],
        download: '',
        repo: 'https://github.com/IrokawaRikuto/Re-GAMMA',
    },
    'discord-bot': {
        title: { ja: 'Discord BOT', en: 'Discord BOT' },
        year: '2026',
        period: { ja: '1週間（現在休止中）', en: '1 week (currently on hold)' },
        tags: ['Discord', { ja: '個人制作', en: 'Personal' }, { ja: '休止中', en: 'On Hold' }],
        award: null,
        env: '',
        desc: {
            ja: '個人で開発・運用している Discord BOT。実装した機能の技術的な紹介は後日追記予定。',
            en: 'A Discord bot I developed and operate personally. A technical write-up of the features I implemented will be added later.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: [],
        download: '',
    },
    'sd-mcp': {
        title: { ja: 'Stable Diffusion MCP', en: 'Stable Diffusion MCP' },
        year: '2026',
        period: { ja: '2日', en: '2 days' },
        tags: ['MCP', 'Python', 'Stable Diffusion', { ja: '個人制作', en: 'Personal' }],
        award: null,
        env: 'Python / MCP / Stable Diffusion (Forge WebUI)',
        desc: {
            ja: '生成AIの Claude から、ローカルで動く画像生成AI『Stable Diffusion』（Forge WebUI）を操作して画像を生成できるようにする、自作の MCP（Model Context Protocol）サーバー。Python製で、Forge の REST API を介して動作する。\n\n「桜の下に立つ少女を描いて」のように Claude へ自然言語で指示するだけで、Claude がプロンプト（Danbooruタグ等）へ変換し、画像生成から保存までを自動で実行する。提供ツールは画像生成(txt2img)・接続確認・モデル一覧・モデル切替・サンプラー一覧の5種で、アニメ系SDXL向けの推奨設定（1024×1024 / Euler a / steps28 / Clip skip2）を既定値に組み込んでいる。VRAM 8GB 環境を考慮し、生成を頼まれた時だけ Forge を自動起動し、一定時間使われなければ自動終了する「オンデマンド方式」も実装。Claude Desktop 向けにはワンクリックで導入できる拡張（.mcpb）としてもパッケージ化した。\n\n生成AIを単に「使う」だけでなく、AIエージェントに独自ツールを与えて機能を拡張する MCP を自ら実装することで、AIを目的に合わせて「拡張する・制作ワークフローへ組み込む」側に回れることを示した一作。',
            en: 'A custom MCP (Model Context Protocol) server that lets the generative AI Claude operate a locally running image generator, "Stable Diffusion" (Forge WebUI), to create images. Written in Python, it works through Forge\'s REST API.\n\nWith a simple natural-language instruction to Claude — for example, "draw a girl standing under cherry blossoms" — Claude converts the request into a prompt (Danbooru tags, etc.) and automatically handles everything from generation to saving. It exposes five tools: image generation (txt2img), connection check, model listing, model switching, and sampler listing, with recommended anime-SDXL defaults built in (1024×1024 / Euler a / steps 28 / Clip skip 2). Mindful of an 8GB VRAM environment, it also implements an "on-demand" approach: Forge is auto-launched only when a generation is requested, and auto-terminates after a period of inactivity. For Claude Desktop, it is also packaged as a one-click extension (.mcpb).\n\nBeyond merely using generative AI, by implementing MCP — the mechanism for extending an AI agent with custom tools — myself, this project shows the ability to extend AI for a purpose and fold it into a production workflow.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: ['images/SDMCP_icon.webp'],
        download: '',
    },
    'rm-engine': {
        title: { ja: 'RM Engine', en: 'RM Engine' },
        year: '2026',
        period: { ja: '制作中', en: 'In progress' },
        tags: ['C++', 'DirectX', { ja: '個人制作', en: 'Personal' }, { ja: '制作中', en: 'In Development' }],
        award: null,
        env: 'Visual Studio / DirectX11 / Claude Code Pro',
        desc: {
            ja: '「このソフトひとつで何でも作れる」をコンセプトに開発を進めている、プラグイン拡張型のゲームエンジン。既存のゲームエンジンは起動やデバッグ実行に時間がかかるという課題を解消するため、ECS（Entity Component System）アーキテクチャを採用して処理を軽量化し、エディタ起動からゲーム実行までを数秒で完結できる軽快さを目標にしている。\n\n物理挙動は外部ライブラリに頼らず C++ ですべて自作しており、3D物理シミュレーションはもちろん2Dゲームも同一エンジンで開発できる構成にしている。エディタは「シーンビュー / ゲームビュー / UIビュー / アニメーター」のタブ切替式で、ヒエラルキー・インスペクター・アセットブラウザを備え、Position / Rotation / Scale / Color / Texture などをスライダーや数値入力からリアルタイムに編集できる。GUIは現在 ImGui をベースにしているが、最終的には自前のGUIフレームワークへ置き換える方針。UIビューでは独自実装のUIウィンドウを通じてHPバーや各種ゲージなどのレイアウトを直感的に配置でき、解像度に合わせた比率調整や透明度などの細かい調整もインスペクターから行える。\n\n加えて、ゲーム開発に必要な周辺ツールもすべてエンジン内で完結させるべく、作曲ツール・画像編集・3Dモデリング・ストーリープロット・シェーダー作成・ペイントツールなどをプラグイン形式で順次搭載していく予定。外部依存をできる限り減らし、コアからツール群まで一貫して自前で組み上げていくことを開発方針としている。',
            en: 'A plugin-extensible game engine in development under the concept of "a single tool that can build anything." Built around an Entity Component System (ECS) architecture to keep runtime processing light, the engine aims to solve a long-standing pain point with existing engines — slow startup and debug iteration — by reaching from editor launch to in-game playback in just a few seconds.\n\nPhysics is implemented from scratch in C++ without relying on external libraries, and the same engine handles both 3D physics simulation and 2D games. The editor uses a tab-switched layout — Scene View / Game View / UI View / Animator — with hierarchy, inspector, and asset browser panels that let Position / Rotation / Scale / Color / Texture and more be edited in real time via sliders and numeric input. The GUI is currently built on ImGui but will be replaced with a custom in-house GUI framework. The UI View uses an original UI window implementation, letting HUD elements like HP bars and gauges be placed intuitively, with fine-grained control over aspect-ratio fitting and opacity from the inspector.\n\nOn top of that, all the peripheral tools normally required for game development — music composition, image editing, 3D modeling, story plotting, shader authoring, paint tools — are planned to be folded into the engine as plugins. The development policy is to minimize external dependencies and build everything from the core to the toolset in-house, end to end.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: [
            'images/RMEngine_Logo.png',
            'images/RMEngine_Icon.png',
            'images/RMEngine_Launcher.png',
            'images/RMEngine_SceneView.png',
            'images/RMEngine_UIView.png',
            'images/RMEngine_GameView.png'
        ],
        download: '',
    },
    'jump-beat': {
        title: { ja: 'あがれ！ジャンプビート', en: 'Agare! Jump Beat' },
        year: '2026',
        period: { ja: '1週間弱', en: 'Just under a week' },
        tags: ['Unreal Engine', 'C++', { ja: '課題制作：個人', en: 'Assignment: Solo' }],
        award: null,
        env: 'Unreal Engine 5 / C++ / Python（BGM合成）',
        desc: {
            ja: 'ゲームジャム「ぷちコン」への応募用に、1週間弱で個人制作したリズムアクション。お題が「だん」だったことから「段」を軸に据え、曲の拍に合わせて SPACE で跳び、崩れていく階段を登っていくゲームにまとめた。\n\n押した瞬間の精度で一度に進める段数が変わり、拍を外すと足場にヒビが入る。ただジャンプするだけでは操作が単調になってしまうため銃を撃てる要素も加え、裏拍を絡めたリズムの取り方を要求することで操作の難易度を一段引き上げている。\n\nリズムゲームで最も致命的になる同期のズレは、BGM 側から潰した。曲を既製音源に頼らず Python で波形から自作合成し、拍の位置を厳密に 0 に置くことで、ズレの原因そのものを排除している。判定もフレーム経過ではなく音の実再生位置を基準に取り、再生環境による揺れの影響を受けないようにした。\n\nジャンプは、進む段数が変わっても滞空時間が一定になるよう跳躍のたびに重力を逆算して決定している。これによりどの段数へ跳んでも同じリズムで入力でき、拍と操作感が最後まで一致する。階段は毎回自動生成される仕様で、詰みが発生しないよう穴の連結数に制約をかけている。\n\n工夫した点は、曲とジャンプのタイミングを合わせる部分と、タイトル画面の背景。また、落下してゲームオーバーになったときの見た目が少しシュールなのだが、これはこれで味があると思いそのまま残している。\n\nゲームファイル・スクリーンショットは後日追加予定。',
            en: 'A rhythm action game built solo in just under a week for the Puchi-Con game jam. The theme was "dan," which I took as 段 (steps), building the game around jumping with SPACE in time with the beat to climb a crumbling staircase.\n\nHow precisely you hit the beat determines how many steps you advance at once, and missing the beat cracks the platform beneath you. Since jumping alone made the controls feel monotonous, I also added the ability to shoot a gun, bringing off-beat timing into play and raising the difficulty of the controls a step further.\n\nI tackled audio sync drift — the most damaging problem in any rhythm game — from the music side. Rather than relying on an existing track, I synthesized the BGM from waveforms in Python and placed the beats at exactly zero, eliminating the source of the drift itself. Timing judgment is taken from the actual playback position of the audio rather than elapsed frames, so it is unaffected by variation in the playback environment.\n\nJumps recalculate gravity every time so that airtime stays constant no matter how many steps are covered. The input rhythm is therefore identical for any jump distance, keeping the beat and the feel of the controls aligned throughout. The staircase is procedurally generated on every run, with a constraint on how many gaps may connect so that unwinnable layouts never occur.\n\nThe parts I put the most care into were syncing the jump timing to the music, and the title screen background. Falling to a game over also ends up looking a little surreal — I felt that had a charm of its own, so I left it in as is.\n\nGame files and screenshots will be added later.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: [],
        download: '',
    },
    'pettan-maker': {
        title: { ja: 'ぺったんメイカー', en: 'Pettan Maker' },
        year: '2026',
        period: { ja: '約4ヶ月', en: 'About 4 months' },
        team: { ja: '10人+α', en: '10+ members' },
        tags: ['Unity', 'C#', { ja: '課題制作：チーム', en: 'Assignment: Team' }, { ja: '制作中', en: 'In Development' }],
        award: null,
        role: {
            ja: 'マップ、レベルデザイン、敵キャラクター原案、プレイヤー操作、アイテム使用、ラスボス（モデリング・楽曲の監修も担当）',
            en: 'Map, level design, enemy character concepts, player controls, item usage, final boss (also supervised modeling and music)'
        },
        env: 'Unity / Visual Studio',
        desc: {
            ja: '敵をつぶしてシールにし、そのシールをからだに貼ることで効果を発動してボスを倒していく3Dアクションゲーム。ステージごとに童話をモチーフにした世界観が用意されており、STAGE1は「不思議の国のアリス」をテーマに、ボスとして「ハートの女王」が登場する。HAL東京の3年次チーム制作（NullPointerGames）として現在開発中。',
            en: 'A 3D action game where you defeat enemies, turn them into stickers, and stick them onto your body to activate their effects and take down bosses. Each stage is themed around a fairy tale — STAGE 1 is inspired by "Alice in Wonderland," featuring the Queen of Hearts as a boss. Currently in development as a 3rd-year team project at HAL Tokyo (NullPointerGames).'
        },
        video: { type: 'video', src: 'videos/PettanMaker_PV.mp4' },
        screenshots: [
            'images/PettanMaker_Title.webp',
            'images/PettanMaker_ConceptArt.webp',
            'images/PettanMaker_Logo.webp',
            'images/PettanMaker_GamePlay.webp',
            'images/PettanMaker_Sticker.webp',
            'images/PettanMaker_Clear.webp'
        ],
        download: '',
    },
    'sand-tetris': {
        title: { ja: 'Sand Tetris', en: 'Sand Tetris' },
        year: '2026',
        period: { ja: '1日', en: '1 day' },
        tags: ['C++', { ja: '個人制作', en: 'Personal' }],
        award: null,
        env: 'Visual Studio / Claude Code Pro',
        desc: {
            ja: 'テトリスの派生ルール「サンドテトリス」をC++で再現したゲーム。テトロミノが着地すると砂粒に分解され、セルオートマトンによる物理挙動で崩れ落ちる。同色の砂がフィールド左壁から右壁まで連結したときにライン消去となる独自の消去ルールを持つ。\n\n本作はAI支援コーディングツール（Claude Code）の実力を検証する目的で制作した。自分では一文字もコードを書かず、完全にClaude Codeのみで実装を行ったが、生成されるコードを逐一確認しながら進めることで、ブラックボックス化を避けた。NEXT表示やランキング機能（TOP5をファイル保存、日時付き）、タイトル画面やゲームオーバー演出も実装し、ゲームとしての完成度を高めた。\n\n描画にはシェーダー（HLSL）を使わず、Direct2DのFillRectangleのみで全画面を構成している。GPUパイプラインの設定が不要なため実装が簡潔で、依存関係も軽い。砂物理シミュレーションでは全7,200セルを毎フレーム走査するのではなく、activeフラグとdirty範囲で動く可能性のあるセルだけを処理することで、全砂静止時の計算コストをO(1)に抑えた。BFSによる消去判定でも配列全体のmemsetを避け、キューに記録された訪問セルだけをクリアする方式でメモリ書き込み量を削減している。フォントリソースは起動時に一度だけ生成してキャッシュし、毎フレームのCOM生成・解放を排除。BGMは外部音声ファイルを持たず、コロブチカの旋律を矩形波としてプログラム上で合成しメモリから直接再生するため、実行ファイル以外の外部リソースを必要としない。BFSキューやエフェクト配列もすべて固定長で確保し、動的メモリ確保によるヒープ断片化を排除している。これらの工夫により、単一ソースファイル約1,240行という小規模な構成でありながら、低負荷で安定した動作を実現した。',
            en: 'A C++ recreation of "Sand Tetris," a Tetris variant. When a tetromino lands, it disintegrates into sand particles that collapse under cellular automaton physics. Lines are cleared when same-colored sand forms a connected path from the left wall to the right wall — a unique clearing mechanic.\n\nThis project was created to evaluate the capabilities of the AI-assisted coding tool Claude Code. I did not write a single line of code myself — all implementation was done entirely by Claude Code, but I reviewed every line of generated code to avoid black-box development. The game includes NEXT display, a ranking system (top 5 saved to file with timestamps), a title screen, and game-over effects.\n\nRendering uses only Direct2D FillRectangle calls without shaders (HLSL), eliminating GPU pipeline setup for a simple and lightweight implementation. The sand physics simulation avoids scanning all 7,200 cells every frame — instead, only cells marked with an active flag within a dirty range are processed, reducing computation to O(1) when all sand is at rest. BFS-based line clear detection avoids memset over the entire array, clearing only visited cells recorded in the queue. Font resources are created once at startup and cached, eliminating per-frame COM creation/release. BGM requires no external audio files — the Korobeiniki melody is synthesized as a square wave in code and played directly from memory. All BFS queues and effect arrays use fixed-size allocation, eliminating heap fragmentation from dynamic memory. These optimizations achieve stable, low-overhead performance within a single source file of approximately 1,240 lines.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: ['images/SANDTETRIS_Title.png', 'images/SANDTETRIS_GamePlay.png'],
        download: 'games/SandTetris.zip',
        requirements: { ja: 'Windows 10 / 11（64bit）／追加のランタイム不要', en: 'Windows 10 / 11 (64-bit); no additional runtime required' },
        controls: { ja: 'A/←・D/→ 移動、W/↑ 回転、S/↓ ソフトドロップ、Space ハードドロップ、R リスタート、Esc タイトルへ', en: 'A/Left and D/Right to move, W/Up to rotate, S/Down to soft drop, Space to hard drop, R to restart, Esc for title' },
    },
    'console-shooter': {
        title: { ja: 'ConsoleSTG', en: 'ConsoleSTG' },
        year: '2026',
        tags: ['C++', { ja: '個人制作', en: 'Personal' }],
        award: null,
        period: { ja: '1日', en: '1 day' },
        env: 'Visual Studio / Claude Code Pro',
        desc: {
            ja: '「グラディウス」のような横スクロール型シューティングを、コンソール画面上で実装したC++製ゲーム。学内のゲーム発表で1年生のお題が「コンソールゲーム」だったことをきっかけに、自分が1年生の頃に取り組んだ課題を、当時よりも一段踏み込んだ形で作り直したいと考えたのが制作の出発点。「画像素材を一切使わず、コンソールウィンドウだけでどこまでゲームとして成立させられるか」をテーマに、自機・敵・弾・爆発エフェクト・背景の星まで、すべてをASCII文字と色情報のみで表現している。\n\n描画にはWindows APIのWriteConsoleOutputAを採用し、画面全体をCHAR_INFOバッファとして一括転送するダブルバッファ方式を実装。printfベースの描画で発生するちらつきを排除し、80×25の文字画面でも滑らかなスクロールを実現した。さらにフォントサイズを36pxに引き上げた上でSW_MAXIMIZEによる全画面化を行い、「小さなコンソール画面」という印象も払拭している。\n\nゲーム部分は、タイトル → ステージ選択（3面）→ プレイ → リザルトまでを1本のループとして構築。敵は直進型・上下移動型・蛇行型の3種類を実装し、各ステージの最後にはHPゲージ付きのボスが登場する。自機側もパワーアップ最大3段階によるショット数増加、被弾時の無敵時間、残機制、チャージショット中は自機の向きが反転する演出など、操作感と手応えを両立させるための細部まで作り込んだ。\n\n開発にはAI支援ツール（Claude Code）を活用しつつ、自分でもコードを書きながら完成させた。生成されたコードを読み解き、修正・統合していく過程で、Windows APIによるコンソール制御や描画最適化への理解を一段深められた作品となっている。',
            en: 'A side-scrolling shooter inspired by "Gradius," built entirely inside a Windows console window in C++. The project began at an in-school showcase where the theme assigned to first-year students was "console games," prompting me to revisit an assignment from my own first year and rebuild it with everything I had learned since. The guiding theme was: "How far can a game be taken using only the console window, with no image assets at all?" — so the player ship, enemies, bullets, explosion effects, and even the background stars are all expressed using ASCII characters and color information alone.\n\nRendering is built on the Windows API call WriteConsoleOutputA, transferring the entire screen as a single CHAR_INFO buffer per frame in a double-buffered approach. This eliminates the flicker inherent to printf-based output and produces smooth scrolling even at 80×25 character resolution. The font size is also raised to 36px and the window is maximized via SW_MAXIMIZE, dispelling the impression of a "small console window."\n\nThe game flow runs as a single loop: title → stage select (3 stages) → play → result. Three enemy archetypes are implemented — straight-line, vertical-strafing, and weaving — and each stage ends with a boss equipped with an HP gauge. The player ship features up to three power-up tiers that increase shot count, post-hit invincibility, a lives system, and a presentational touch where the ship faces backward while charging a shot — details added so that nothing about the controls feels rough.\n\nDevelopment combined the AI-assisted tool Claude Code with hand-written code, weaving the two together. Reading, modifying, and integrating the generated code line by line deepened my understanding of Windows API console control and rendering optimization.'
        },
        video: { type: 'placeholder', src: '' },
        screenshots: ['images/ConsoleSTG_Title.webp', 'images/ConsoleSTG_StageSelect.webp', 'images/ConsoleSTG_GamePlay.webp'],
        download: 'games/ConsoleSTG.zip',
        requirements: { ja: 'Windows 10 / 11（64bit）／コンソールアプリ／追加のランタイム不要', en: 'Windows 10 / 11 (64-bit); console application; no additional runtime required' },
        controls: { ja: '←→↑↓ 移動、Space / Z ショット（押しっぱなしで連射）、Enter 決定、ESC タイトルへ', en: 'Arrow keys to move, Space or Z to shoot (hold to rapid-fire), Enter to confirm, ESC for title' },
    },
};

function openModal(workId) {
    const data = workData[workId];
    if (!data) return;

    const lang = currentLang;

    // タイトル
    modal.querySelector('.work-detail-title').textContent =
        typeof data.title === 'object' ? data.title[lang] : data.title;

    // 動画エリア
    const videoArea = modal.querySelector('.work-detail-video');
    videoArea.innerHTML = '';
    const vid = data.video;
    if (!vid || vid.type === 'placeholder' || !vid.src) {
        // 動画が無い作品は、1枚目のサムネ画像をそのまま動画欄に表示（無ければ「準備中…」）
        if (data.screenshots && data.screenshots.length > 0) {
            const img = document.createElement('img');
            img.src = data.screenshots[0];
            img.alt = workId;
            img.className = 'work-detail-video-thumb';
            videoArea.appendChild(img);
        } else {
            videoArea.innerHTML = '<div class="media-placeholder">' + (currentLang === 'ja' ? '準備中…' : 'Coming soon...') + '</div>';
        }
    } else if (vid.type === 'video') {
        const v = document.createElement('video');
        v.src = vid.src; v.controls = true; v.autoplay = true;
        videoArea.appendChild(v);
    } else if (vid.type === 'gif') {
        const img = document.createElement('img');
        img.src = vid.src; img.alt = workId;
        videoArea.appendChild(img);
    } else if (vid.type === 'youtube') {
        const iframe = document.createElement('iframe');
        iframe.src = vid.src; iframe.width = '100%'; iframe.height = '100%';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        videoArea.appendChild(iframe);
    }

    // タグ
    const tagsEl = modal.querySelector('.work-detail-tags');
    tagsEl.innerHTML = data.tags.map(t => {
        const text = typeof t === 'object' ? t[lang] : t;
        let cls = '';
        if (typeof t === 'object' && t.ja === '制作中') cls = ' tag-wip';
        else if (typeof t === 'object' && t.ja === '休止中') cls = ' tag-paused';
        return '<span class="tag' + cls + '">' + text + '</span>';
    }).join('');

    // 作品情報：年号
    const yearLabel = currentLang === 'ja' ? '制作年：' : 'Year: ';
    modal.querySelector('.work-detail-year').textContent = yearLabel + data.year;

    // 作品情報：制作期間（period がある作品のみ表示）
    const periodEl = modal.querySelector('.work-detail-period');
    if (data.period) {
        const periodLabel = currentLang === 'ja' ? '制作期間：' : 'Duration: ';
        periodEl.textContent = periodLabel + (typeof data.period === 'object' ? data.period[lang] : data.period);
    } else {
        periodEl.textContent = '';
    }

    // 作品情報：チーム規模（team がある作品のみ表示。個人制作は未設定で非表示）
    const teamEl = modal.querySelector('.work-detail-team');
    if (data.team) {
        const teamLabel = currentLang === 'ja' ? 'チーム規模：' : 'Team: ';
        teamEl.textContent = teamLabel + (typeof data.team === 'object' ? data.team[lang] : data.team);
    } else {
        teamEl.textContent = '';
    }

    // 作品情報：担当（role がある作品のみ表示）
    const roleEl = modal.querySelector('.work-detail-role');
    if (data.role) {
        const roleLabel = currentLang === 'ja' ? '担当：' : 'Role: ';
        roleEl.textContent = roleLabel + (typeof data.role === 'object' ? data.role[lang] : data.role);
    } else {
        roleEl.textContent = '';
    }

    // 作品情報：開発環境
    const envEl = modal.querySelector('.work-detail-env');
    if (data.env) {
        const envLabel = currentLang === 'ja' ? '開発環境：' : 'Environment: ';
        envEl.textContent = envLabel + data.env;
    } else {
        envEl.textContent = '';
    }

    // 作品情報：受賞
    const awardEl = modal.querySelector('.work-detail-award');
    if (data.award) {
        awardEl.textContent = typeof data.award === 'object' ? data.award[lang] : data.award;
    } else {
        awardEl.textContent = '';
    }

    // 作品配布：ダウンロードURL
    const dlSection = modal.querySelector('.work-detail-download-section');
    const dlLink = modal.querySelector('.work-detail-download');
    const reqEl = modal.querySelector('.work-detail-requirements');
    const ctrlEl = modal.querySelector('.work-detail-controls');
    if (data.download) {
        dlSection.classList.add('has-link');
        dlLink.href = data.download;
        dlLink.textContent = 'Download';
        // 動作環境・操作方法（設定がある作品のみ）
        const reqLabel = currentLang === 'ja' ? '動作環境：' : 'Requirements: ';
        reqEl.textContent = data.requirements ? reqLabel + data.requirements[lang] : '';
        const ctrlLabel = currentLang === 'ja' ? '操作方法：' : 'Controls: ';
        ctrlEl.textContent = data.controls ? ctrlLabel + data.controls[lang] : '';
    } else {
        dlSection.classList.remove('has-link');
        reqEl.textContent = '';
        ctrlEl.textContent = '';
    }

    // ソースコード：GitHubリポジトリURL
    const repoSection = modal.querySelector('.work-detail-repo-section');
    const repoLink = modal.querySelector('.work-detail-repo');
    if (data.repo) {
        repoSection.classList.add('has-link');
        repoLink.href = data.repo;
        repoLink.textContent = 'GitHub';
    } else {
        repoSection.classList.remove('has-link');
    }

    // セクションタイトルの言語切替
    modal.querySelectorAll('[data-ja][data-en]').forEach(el => {
        el.textContent = el.getAttribute('data-' + lang);
    });

    // スクリーンショット（カルーセル）
    const ssArea = modal.querySelector('.work-detail-screenshot');
    const screenshots = data.screenshots || [];
    currentScreenshots = screenshots;
    currentSSIndex = 0;
    currentWorkTitle = typeof data.title === 'object' ? data.title[lang] : data.title;
    ssArea.innerHTML = '';
    if (screenshots.length > 0) {
        const img = document.createElement('img');
        img.src = screenshots[0];
        img.alt = buildSSAlt(0);
        img.loading = 'lazy';
        img.addEventListener('click', () => openLightbox(currentSSIndex));
        ssArea.appendChild(img);
        if (screenshots.length > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'screenshot-nav prev';
            prevBtn.innerHTML = '&#8249;';
            prevBtn.addEventListener('click', (e) => { e.stopPropagation(); changeScreenshot(-1); });
            const nextBtn = document.createElement('button');
            nextBtn.className = 'screenshot-nav next';
            nextBtn.innerHTML = '&#8250;';
            nextBtn.addEventListener('click', (e) => { e.stopPropagation(); changeScreenshot(1); });
            ssArea.appendChild(prevBtn);
            ssArea.appendChild(nextBtn);
        }
    } else {
        ssArea.innerHTML = '<div class="media-placeholder">' + (currentLang === 'ja' ? '準備中…' : 'Coming soon...') + '</div>';
    }

    // 説明文
    modal.querySelector('.work-detail-desc').textContent =
        typeof data.desc === 'object' ? data.desc[lang] : data.desc;

    modal.classList.add('active');
    document.body.style.overflowY = 'hidden';
    history.replaceState(null, '', '#work-' + workId);
}

function closeModal() {
    closeLightbox();
    // 再生中の動画を停止
    const video = modal.querySelector('video');
    if (video) { video.pause(); video.currentTime = 0; }
    modal.classList.remove('active');
    document.body.style.overflowY = '';
    if (location.hash.startsWith('#work-')) {
        history.replaceState(null, '', location.pathname);
    }
}

// URLハッシュから作品モーダルを開く
function openModalFromHash() {
    const hash = location.hash;
    if (hash.startsWith('#work-')) {
        const workId = hash.replace('#work-', '');
        if (workData[workId]) openModal(workId);
    }
}
window.addEventListener('load', openModalFromHash);
window.addEventListener('hashchange', openModalFromHash);

// 作品カードのクリックイベント
document.querySelectorAll('.work-card[data-work]').forEach(card => {
    card.addEventListener('click', () => {
        openModal(card.dataset.work);
    });
});

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (lightbox.classList.contains('active')) {
            closeLightbox();
        } else {
            closeModal();
            closeEmailModal();
        }
    }
    // ライトボックス内の左右キー
    if (lightbox.classList.contains('active')) {
        if (e.key === 'ArrowLeft') lightboxNav(-1);
        if (e.key === 'ArrowRight') lightboxNav(1);
    }
});

// ===== Worksカードにサムネイル表示 =====
document.querySelectorAll('.work-card[data-work]').forEach(card => {
    const data = workData[card.dataset.work];
    if (data && data.screenshots && data.screenshots.length > 0) {
        const mediaDiv = card.querySelector('.work-media');
        const placeholder = mediaDiv.querySelector('.media-placeholder');
        if (placeholder) {
            const img = document.createElement('img');
            img.src = data.screenshots[0];
            img.alt = card.dataset.work;
            img.className = 'work-card-thumb';
            img.loading = 'lazy';
            placeholder.replaceWith(img);
        }
    }
});

// ===== Works: 年カルーセル（見切れるピーク／自動スライド／年切替アニメ／下グリッド連動） =====
(function initWorksCarousel() {
    const track = document.getElementById('wc-track');
    if (!track) return;
    const viewport = track.parentElement;               // .wc-viewport
    const carousel = document.querySelector('.works-carousel');
    const yearLabel = document.getElementById('wc-year-label');
    const yearCount = document.getElementById('wc-year-count');
    const dotsWrap = document.getElementById('wc-dots');
    const yearBtn = document.getElementById('wc-year-btn');
    const yearMenu = document.getElementById('wc-year-menu');
    const cPrev = document.getElementById('wc-prev');
    const cNext = document.getElementById('wc-next');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const AUTO_MS = 5000;

    // Works の表示順（HTMLグリッドの data-work 順）を保ったまま年でグループ化
    const order = ['jump-beat', 'pettan-maker', 'rm-engine', 'puramai9', 'sd-mcp', 'discord-bot',
                   'gamma-plus', 'sand-tetris', 'console-shooter', 'gamma', 'blast-ball', 'blade-slash', 'circlestriker', 'touhou'];
    const byYear = {};
    order.forEach(id => {
        const d = workData[id];
        if (!d) return;
        (byYear[d.year] = byYear[d.year] || []).push(id);
    });
    const years = Object.keys(byYear).sort((a, b) => b - a); // 新しい順
    let yi = 0;      // 年インデックス
    let pos = 0;     // 3連トラック上の位置（中央コピー基準）
    let n = 0;       // その年の件数
    let autoTimer = null;

    const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const pair = t => (typeof t === 'object' ? t : { ja: t, en: t });

    // カルーセルカード＝スクショ画像＋タイトル（タグなし）
    function cardHTML(id) {
        const d = workData[id];
        const title = pair(d.title);
        let media;
        if (d.screenshots && d.screenshots.length > 0) {
            media = '<img src="' + esc(d.screenshots[0]) + '" alt="' + esc(id) + '" loading="lazy">';
        } else {
            media = '<div class="media-placeholder" data-ja="準備中…" data-en="Coming soon...">' + (currentLang === 'ja' ? '準備中…' : 'Coming soon...') + '</div>';
        }
        return '<article class="wc-card" data-work="' + esc(id) + '">'
            + '<div class="wc-media"><span class="work-year">' + esc(d.year) + '</span>' + media + '</div>'
            + '<h3 class="wc-title" data-ja="' + esc(title.ja) + '" data-en="' + esc(title.en) + '">' + esc(currentLang === 'ja' ? title.ja : title.en) + '</h3>'
            + '</article>';
    }

    function cardW() { const c = track.querySelector('.wc-card'); return c ? c.offsetWidth : 0; }
    function gapPx() { const cs = getComputedStyle(track); return parseFloat(cs.columnGap || cs.gap || '0') || 0; }
    function step() { return cardW() + gapPx(); }
    function centerOffset() { return (viewport.offsetWidth - cardW()) / 2; }

    function place(animate) {
        const instant = !animate || reduce;
        // スナップ（無限ループの折り返し等）中は track の移動もカードの active(opacity/scale) も
        // トランジションを止めて瞬間反映（＝折り返し時の「かくっと」フラッシュを防ぐ）
        if (instant) track.classList.add('wc-snap');
        track.style.transition = instant ? 'none' : '';
        track.style.transform = 'translateX(' + (centerOffset() - pos * step()) + 'px)';
        markActive();
        markDots();
        if (instant) { void track.offsetWidth; track.classList.remove('wc-snap'); }
    }
    function markActive() {
        const cards = track.children;
        const len = cards.length || 1;
        const active = ((pos % len) + len) % len;
        for (let i = 0; i < cards.length; i++) cards[i].classList.toggle('active', i === active);
    }
    function markDots() {
        if (n < 1) return;
        const a = ((pos % n) + n) % n;
        Array.prototype.forEach.call(dotsWrap.children, (d, i) => d.classList.toggle('on', i === a));
    }
    // スライド完了後、3連トラックの中央コピー域[n,2n)へ座標を戻して無限ループ化
    function normalize() {
        if (n <= 1) return;
        let changed = false;
        while (pos >= 2 * n) { pos -= n; changed = true; }   // 素早い連続操作で範囲を超えても戻す
        while (pos < n) { pos += n; changed = true; }
        if (changed) place(false);
    }
    // トラック自身の移動(transform)完了時のみ折り返し。カードの scale(=transform) の
    // バブリングで誤発火すると、スライド中に折り返しが割り込んで逆方向へ高速回転してしまうため e.target を限定
    track.addEventListener('transitionend', e => {
        if (e.target === track && e.propertyName === 'transform') normalize();
    });

    function go(delta) { if (n <= 1) return; pos += delta; place(true); }

    function updateCount() {
        yearCount.textContent = byYear[years[yi]].length + (currentLang === 'ja' ? ' 作品' : ' works');
    }

    function buildYear() {
        const list = byYear[years[yi]];
        n = list.length;
        // n>1 は3連（見切れ＋無限ループ用）、n===1 は単体
        const seq = n > 1 ? list.concat(list).concat(list) : list.slice();
        track.innerHTML = seq.map(cardHTML).join('');
        dotsWrap.innerHTML = '';
        for (let i = 0; i < n; i++) {
            const b = document.createElement('button');
            b.className = 'wc-dot';
            b.setAttribute('aria-label', (i + 1) + '番目');
            b.addEventListener('click', () => { pos = (n > 1 ? n : 0) + i; place(true); restartAuto(); });
            dotsWrap.appendChild(b);
        }
        yearLabel.textContent = years[yi];
        updateCount();
        markYearMenu();
        const single = n <= 1;
        cPrev.disabled = single;
        cNext.disabled = single;
        pos = n > 1 ? n : 0;     // 中央コピーの先頭
        place(false);
    }

    // 年ドロップダウン（クリックで一覧を出して選択）。下グリッドは年に関係なく常に全作品を表示
    function buildYearMenu() {
        yearMenu.innerHTML = years.map((y, i) =>
            '<li role="option" class="wc-year-opt" data-yi="' + i + '">' + y + '<span class="wc-year-opt-n">' + byYear[y].length + '</span></li>'
        ).join('');
    }
    function markYearMenu() {
        Array.prototype.forEach.call(yearMenu.children, (li, i) => {
            li.classList.toggle('sel', i === yi);
            li.setAttribute('aria-selected', i === yi ? 'true' : 'false');
        });
    }
    function openMenu(o) {
        const open = (o === undefined) ? !yearMenu.classList.contains('open') : o;
        yearMenu.classList.toggle('open', open);
        yearBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    // 年切替：カルーセルのみスライド＋フェード（下グリッドは常に全作品なので触らない）
    function setYear(newYi, dir) {
        if (newYi === yi || newYi < 0 || newYi >= years.length) return;
        stopAuto();
        if (reduce) { yi = newYi; buildYear(); startAuto(); return; }
        viewport.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        viewport.style.opacity = '0';
        viewport.style.transform = 'translateX(' + (dir > 0 ? -36 : 36) + 'px)';
        setTimeout(() => {
            yi = newYi;
            buildYear();
            viewport.style.transition = 'none';
            viewport.style.transform = 'translateX(' + (dir > 0 ? 36 : -36) + 'px)';
            void viewport.offsetWidth;
            viewport.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            viewport.style.opacity = '1';
            viewport.style.transform = 'translateX(0)';
            startAuto();
        }, 240);
    }

    function startAuto() { if (reduce || n <= 1) return; stopAuto(); autoTimer = setInterval(() => go(1), AUTO_MS); }
    function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
    function restartAuto() { startAuto(); }

    let suppressClick = false;
    track.addEventListener('click', e => {
        if (suppressClick) { suppressClick = false; return; }
        const card = e.target.closest('.wc-card');
        if (card && card.dataset.work) openModal(card.dataset.work);
    });

    // ドラッグ / スワイプで横移動（マウス・タッチ共通の Pointer Events）
    let dragging = false, decided = false, horiz = false, startX = 0, startY = 0, baseT = 0, moved = 0;
    function currentTranslate() { return centerOffset() - pos * step(); }
    viewport.addEventListener('pointerdown', e => {
        if (n <= 1) return;
        dragging = true; decided = false; horiz = false; moved = 0;
        startX = e.clientX; startY = e.clientY; baseT = currentTranslate();
        suppressClick = false;
        stopAuto();
    });
    window.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (!decided) {
            if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
            decided = true; horiz = Math.abs(dx) > Math.abs(dy);
            if (!horiz) { dragging = false; place(true); startAuto(); return; } // 縦方向はスクロールに任せる
            track.style.transition = 'none';
            viewport.classList.add('dragging');
        }
        moved = dx;
        if (e.cancelable) e.preventDefault();
        track.style.transform = 'translateX(' + (baseT + dx) + 'px)';
    }, { passive: false });
    function endDrag() {
        if (!dragging) return;
        dragging = false;
        viewport.classList.remove('dragging');
        if (horiz) {
            const th = Math.max(40, step() * 0.16);
            if (Math.abs(moved) > th) pos += (moved < 0 ? 1 : -1);
            if (Math.abs(moved) > 8) suppressClick = true;
            place(true);
        }
        restartAuto();
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    cPrev.addEventListener('click', () => { go(-1); restartAuto(); });
    cNext.addEventListener('click', () => { go(1); restartAuto(); });
    // 年ドロップダウン：ボタンで開閉、項目クリックでその年へ
    yearBtn.addEventListener('click', e => { e.stopPropagation(); openMenu(); });
    yearMenu.addEventListener('click', e => {
        const li = e.target.closest('.wc-year-opt');
        if (!li) return;
        e.stopPropagation();
        const ni = +li.dataset.yi;
        openMenu(false);
        if (ni !== yi) setYear(ni, ni > yi ? 1 : -1);
    });
    document.addEventListener('click', () => openMenu(false));
    if (carousel) {
        carousel.addEventListener('mouseenter', stopAuto);
        carousel.addEventListener('mouseleave', startAuto);
    }
    window.addEventListener('resize', () => place(false));
    if (langBtn) langBtn.addEventListener('click', () => updateCount());
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopAuto(); else startAuto(); });

    buildYearMenu();
    buildYear();
    startAuto();
})();

// ===== Works 一覧：検索・タグ絞り込み・タイトルのマーキー =====
(function initWorksGrid() {
    const grid = document.querySelector('.works-grid');
    if (!grid) return;
    const cards = Array.prototype.slice.call(grid.querySelectorAll('.work-card'));
    const heads = Array.prototype.slice.call(grid.querySelectorAll('.year-head'));
    const searchInput = document.getElementById('works-search');
    const filterWrap = document.getElementById('works-filter');
    const emptyMsg = document.getElementById('works-empty');
    const searchBtn = document.getElementById('works-search-btn');
    const searchModal = document.getElementById('works-search-modal');
    const searchGo = document.getElementById('works-search-go');

    // タイトルを .wt-text でラップ（マーキー用。多言語 data 属性を span 側へ移す）
    cards.forEach(card => {
        const title = card.querySelector('.work-title');
        if (!title || title.querySelector('.wt-text')) return;
        const span = document.createElement('span');
        span.className = 'wt-text';
        ['data-ja', 'data-en'].forEach(a => {
            if (title.hasAttribute(a)) { span.setAttribute(a, title.getAttribute(a)); title.removeAttribute(a); }
        });
        span.textContent = title.textContent.trim();
        title.textContent = '';
        title.appendChild(span);
    });

    // タグ収集（key=ja文字列で一意化）してチップ生成
    const tagMap = new Map();
    cards.forEach(card => {
        const d = workData[card.dataset.work]; if (!d) return;
        (d.tags || []).forEach(t => {
            const o = (typeof t === 'object') ? t : { ja: t, en: t };
            if (!tagMap.has(o.ja)) tagMap.set(o.ja, o);
        });
    });
    const activeTags = new Set();
    tagMap.forEach(t => {
        const chip = document.createElement('button');
        chip.className = 'works-chip';
        chip.dataset.key = t.ja;
        chip.setAttribute('data-ja', t.ja);
        chip.setAttribute('data-en', t.en);
        chip.textContent = (currentLang === 'ja' ? t.ja : t.en);
        chip.addEventListener('click', () => {
            if (activeTags.has(t.ja)) { activeTags.delete(t.ja); chip.classList.remove('active'); }
            else { activeTags.add(t.ja); chip.classList.add('active'); }
            apply();
        });
        filterWrap.appendChild(chip);
    });

    // 各年のカードを .year-group でラップ（折りたたみを滑らかに上下スライドさせるため）
    const groups = [];   // {year, head, group}
    heads.forEach(head => {
        const h3 = head.querySelector('h3');
        const y = h3 ? h3.textContent.trim() : '';
        head.dataset.year = y;
        const group = document.createElement('div');
        group.className = 'year-group';
        let node = head.nextElementSibling;
        while (node && !node.classList.contains('year-head')) {
            const next = node.nextElementSibling;
            group.appendChild(node);
            node = next;
        }
        head.insertAdjacentElement('afterend', group);
        groups.push({ year: y, head: head, group: group });
        // キャレット（表示位置は CSS の order:-1 で年号の左）
        const caret = document.createElement('span');
        caret.className = 'year-caret';
        caret.setAttribute('aria-hidden', 'true');
        if (h3) h3.insertAdjacentElement('beforebegin', caret); else head.insertBefore(caret, head.firstChild);
    });

    function tagKeys(card) {
        const d = workData[card.dataset.work];
        return (d.tags || []).map(t => (typeof t === 'object' ? t.ja : t));
    }
    function matchesSearch(card, q) {
        if (!q) return true;
        const d = workData[card.dataset.work];
        const hay = [d.title.ja, d.title.en].concat((d.tags || []).map(t => typeof t === 'object' ? (t.ja + ' ' + t.en) : t)).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
    }
    function apply() {
        const q = (searchInput ? searchInput.value || '' : '').trim().toLowerCase();
        let anyMatch = false;
        const yearMatch = {};
        cards.forEach(card => {
            const d = workData[card.dataset.work];
            const keys = tagKeys(card);
            const tagOk = activeTags.size === 0 || keys.some(k => activeTags.has(k));
            const match = tagOk && matchesSearch(card, q);   // 検索・タグの一致
            if (match) { anyMatch = true; yearMatch[String(d.year)] = true; }
            card.style.display = match ? '' : 'none';        // 折りたたみは group 側で制御
            if (match) card.classList.add('visible');
        });
        // 年ごと：一致カードが無ければ見出し＋グループを隠す
        groups.forEach(g => {
            const has = !!yearMatch[g.year];
            g.head.style.display = has ? '' : 'none';
            g.group.style.display = has ? '' : 'none';
        });
        emptyMsg.hidden = anyMatch;
        // 検索使用中は丸ボタンを赤くハイライト
        if (searchBtn) searchBtn.classList.toggle('has-filter', activeTags.size > 0 || q.length > 0);
    }
    if (searchInput) searchInput.addEventListener('input', apply);

    // 年見出しクリックでその年を折りたたみ（滑らかに上下スライド）
    function toggleYear(g) {
        const collapse = !g.head.classList.contains('collapsed');
        if (collapse) {
            g.group.style.maxHeight = g.group.scrollHeight + 'px';
            g.group.getBoundingClientRect();                 // reflow
            requestAnimationFrame(() => {
                g.group.style.maxHeight = '0px';
                g.group.style.opacity = '0';
                g.group.style.marginBottom = '0px';
            });
            g.head.classList.add('collapsed');
        } else {
            g.head.classList.remove('collapsed');
            g.group.style.opacity = '1';
            g.group.style.marginBottom = '';
            g.group.style.maxHeight = g.group.scrollHeight + 'px';
            const done = (e) => {
                if (e.target !== g.group || e.propertyName !== 'max-height') return;
                g.group.style.maxHeight = '';                 // 展開後は自然な高さに戻す
                g.group.removeEventListener('transitionend', done);
            };
            g.group.addEventListener('transitionend', done);
        }
    }
    groups.forEach(g => {
        g.head.setAttribute('role', 'button');
        g.head.addEventListener('click', () => toggleYear(g));
    });

    // 検索モーダルの開閉
    if (searchBtn && searchModal) {
        const openSearch = () => { searchModal.classList.add('active'); setTimeout(() => { if (searchInput) searchInput.focus(); }, 60); };
        const closeSearch = () => searchModal.classList.remove('active');
        searchBtn.addEventListener('click', openSearch);
        const mc = searchModal.querySelector('.modal-close');
        const mb = searchModal.querySelector('.modal-backdrop');
        if (mc) mc.addEventListener('click', closeSearch);
        if (mb) mb.addEventListener('click', closeSearch);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && searchModal.classList.contains('active')) closeSearch(); });
    }
    // 検索欄左の確定ボタン＝Enter と同等（live 適用済みだが明示）
    if (searchGo) searchGo.addEventListener('click', () => { apply(); if (searchInput) searchInput.focus(); });
    if (searchInput) searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });

    // ホバーでタイトルを横スクロール（末尾で1.5秒 → 瞬時に先頭へ → 繰り返し）
    cards.forEach(card => {
        const title = card.querySelector('.work-title');
        const inner = card.querySelector('.wt-text');
        if (!title || !inner) return;
        let cancel = null;
        card.addEventListener('mouseenter', () => {
            const overflow = inner.scrollWidth - title.clientWidth;
            if (overflow <= 1) return;
            title.classList.add('marquee');
            const dur = Math.max(0.6, overflow / 60);   // 約60px/秒
            let stopped = false, t1 = 0, t2 = 0;
            function cycle() {
                if (stopped) return;
                inner.style.transition = 'transform ' + dur + 's linear';
                inner.style.transform = 'translateX(' + (-overflow) + 'px)';
                t1 = setTimeout(() => {
                    if (stopped) return;
                    inner.style.transition = 'none';
                    inner.style.transform = 'translateX(0)';
                    void inner.offsetWidth;                 // 瞬時に先頭へ
                    t2 = setTimeout(cycle, 30);
                }, dur * 1000 + 1500);                       // 末尾到達後 1.5秒待つ
            }
            cycle();
            cancel = () => { stopped = true; clearTimeout(t1); clearTimeout(t2); title.classList.remove('marquee'); inner.style.transition = 'none'; inner.style.transform = 'translateX(0)'; };
        });
        card.addEventListener('mouseleave', () => { if (cancel) { cancel(); cancel = null; } });
    });

    apply();
})();

// ===== メール送信モーダル =====
const emailModal = document.getElementById('email-modal');
const emailForm = document.getElementById('email-form');
const emailBtn = document.getElementById('email-btn');
const emailCancel = document.getElementById('email-cancel');
const emailStatus = document.getElementById('email-status');
const emailModalClose = emailModal.querySelector('.modal-close');
const emailModalBackdrop = emailModal.querySelector('.modal-backdrop');

function openEmailModal() {
    emailModal.classList.add('active');
    document.body.style.overflowY = 'hidden';
    emailStatus.hidden = true;
    emailForm.reset();
}

function closeEmailModal() {
    emailModal.classList.remove('active');
    document.body.style.overflowY = '';
}

emailBtn.addEventListener('click', openEmailModal);
emailCancel.addEventListener('click', closeEmailModal);
emailModalClose.addEventListener('click', closeEmailModal);
emailModalBackdrop.addEventListener('click', closeEmailModal);

// ===== タイムライン吹き出しのタッチ対応 =====
document.querySelectorAll('.timeline-year').forEach(year => {
    year.addEventListener('click', (e) => {
        // リンククリック時は閉じない
        if (e.target.closest('.tooltip-link')) return;
        const isActive = year.classList.contains('tooltip-active');
        // 他の吹き出しを閉じる
        document.querySelectorAll('.timeline-year.tooltip-active').forEach(y => y.classList.remove('tooltip-active'));
        if (!isActive) year.classList.add('tooltip-active');
    });
});
// 吹き出し外タップで閉じる
document.addEventListener('click', (e) => {
    if (!e.target.closest('.timeline-year')) {
        document.querySelectorAll('.timeline-year.tooltip-active').forEach(y => y.classList.remove('tooltip-active'));
    }
});

emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sendBtn = emailForm.querySelector('.btn-send');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    emailStatus.hidden = true;

    const formData = new FormData(emailForm);

    try {
        const res = await fetch('https://formsubmit.co/ajax/IRcola777@gmail.com', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: formData,
        });

        if (res.ok) {
            emailStatus.textContent = '送信しました。';
            emailStatus.className = 'email-status success';
            emailStatus.hidden = false;
            emailForm.reset();
            setTimeout(closeEmailModal, 1500);
        } else {
            throw new Error('送信に失敗しました');
        }
    } catch (err) {
        emailStatus.textContent = '送信に失敗しました。時間をおいて再度お試しください。';
        emailStatus.className = 'email-status error';
        emailStatus.hidden = false;
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
    }
});
