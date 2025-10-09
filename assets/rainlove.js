// === Cấu hình Canvas chính ===
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// === Kiểm tra thiết bị ===
const isMobile = window.innerWidth < 768;
const gap = isMobile ? 2 : 5;

// === Canvas tạm để vẽ chữ ===
const shapeCanvas = document.createElement("canvas");
shapeCanvas.width = canvas.width;
shapeCanvas.height = canvas.height;
const shapeCtx = shapeCanvas.getContext("2d");

// === Giải mã base64 có hỗ trợ Unicode ===
function base64DecodeUnicode(str) {
    return decodeURIComponent(
        atob(str)
            .split("")
            .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
    );
}

// === Đọc dữ liệu từ URL (dạng base64) ===
const urlParams = new URLSearchParams(window.location.search);
let inputText = "Chúc mừng|sinh nhật|bạn❤|";
let gif = "";
let music = "";

if (urlParams.has("id")) {
    try {
        const decoded = base64DecodeUnicode(urlParams.get("id"));
        const data = JSON.parse(decoded);
        inputText = data.msg || inputText;
        gif = data.gif || "";
        music = data.music || "";
    } catch (e) {
        console.error("Không đọc được dữ liệu từ link:", e);
    }
}

// === Gắn ảnh GIF nếu có ===
const sticker = document.getElementById("sticker");
if (gif && gif.trim() !== "") {
    sticker.src = decodeURIComponent(gif);
}

// === Gắn nhạc nền nếu có ===
const bgm = document.getElementById("bgm");
if (music && music.trim() !== "") {
    bgm.src = decodeURIComponent(music);
    bgm.play().catch(() => {
        console.warn("Không thể phát nhạc do trình duyệt hạn chế.");
    });
}

document.addEventListener("click", () => {
    if (bgm.paused && music.trim() !== "") {
        bgm.play().catch(() => {
            console.warn("Trình duyệt chưa cho phép phát nhạc tự động");
        });
    }
});

// === Tách text thành các phần ===
const texts = inputText.split("|").filter(t => t.trim() !== "");
let currentIndex = 0;
let particles = [];
let morphDelay = 600;
let lastMorphTime = Date.now();
let stopAnimation = false;

// === Tự động căn chữ vừa khung ===
function getFittedFont(text) {
    let fontSize = 300;
    shapeCtx.font = `bold ${fontSize}px Segoe UI`;
    let textWidth = shapeCtx.measureText(text.replace("\n", "")).width;
    while (
        (textWidth > 0.9 * shapeCanvas.width || fontSize > 0.8 * shapeCanvas.height) &&
        fontSize > 10
    ) {
        fontSize -= 5;
        shapeCtx.font = `bold ${fontSize}px Segoe UI`;
        textWidth = shapeCtx.measureText(text.replace("\n", "")).width;
    }
    return fontSize;
}

// === Sinh tọa độ điểm của chữ ===
function generateDots(text) {
    shapeCtx.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
    const lines = text.split("\n");
    const fontSize = getFittedFont(text);
    shapeCtx.font = `bold ${fontSize}px Segoe UI`;
    shapeCtx.fillStyle = "#fff";
    shapeCtx.textAlign = "center";
    shapeCtx.textBaseline = "middle";

    const lineHeight = 1.2 * fontSize;
    const totalHeight = lineHeight * lines.length;
    const startY = shapeCanvas.height / 2 - totalHeight / 2 + lineHeight / 2;

    for (let i = 0; i < lines.length; i++) {
        shapeCtx.fillText(lines[i], shapeCanvas.width / 2, startY + i * lineHeight);
    }

    const imageData = shapeCtx.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height).data;
    const dots = [];
    for (let y = 0; y < shapeCanvas.height; y += gap) {
        for (let x = 0; x < shapeCanvas.width; x += gap) {
            if (imageData[(y * shapeCanvas.width + x) * 4 + 3] > 128) {
                dots.push({ x, y });
            }
        }
    }
    return dots;
}

// === Chuyển trạng thái hạt ===
function interpolateParticles(targetDots) {
    const maxCount = Math.max(particles.length, targetDots.length);
    const newParticles = [];
    for (let i = 0; i < maxCount; i++) {
        const p = particles[i % particles.length] || { x: canvas.width / 2, y: canvas.height / 2 };
        const t = targetDots[i % targetDots.length];
        newParticles.push({
            x: p.x,
            y: p.y,
            tx: t.x,
            ty: t.y,
            progress: 0,
            speed: 0.06 + 0.05 * Math.random(),
        });
    }
    particles = newParticles;
}

// === Cập nhật vị trí hạt ===
function updateParticles() {
    for (let p of particles) {
        if (p.progress < 1) {
            p.progress += p.speed;
            if (p.progress > 1) p.progress = 1;
        }
        p.x += (p.tx - p.x) * p.speed;
        p.y += (p.ty - p.y) * p.speed;
    }
}

// === Vẽ hạt ===
function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let p of particles) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(p.x, p.y, isMobile ? 1.3 : 2.3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// === Canvas trái tim ===
const pinkboard = document.getElementById("pinkboard");
const pinkCtx = pinkboard.getContext("2d");
pinkboard.width = window.innerWidth;
pinkboard.height = window.innerHeight;
pinkboard.style.display = "none";

let hearts = [];

function createHeart(x, y) {
    hearts.push({
        x,
        y,
        size: 6 * Math.random() + 4,
        alpha: 1,
        dx: 2 * Math.random() - 1,
        dy: -2 * Math.random() - 1,
    });
}

function drawHearts() {
    pinkCtx.clearRect(0, 0, pinkboard.width, pinkboard.height);
    hearts.forEach((h, i) => {
        pinkCtx.globalAlpha = h.alpha;
        pinkCtx.fillStyle = "pink";
        pinkCtx.beginPath();
        pinkCtx.moveTo(h.x, h.y);
        pinkCtx.bezierCurveTo(h.x + h.size, h.y - h.size, h.x + 2 * h.size, h.y + h.size, h.x, h.y + 2 * h.size);
        pinkCtx.bezierCurveTo(h.x - 2 * h.size, h.y + h.size, h.x - h.size, h.y - h.size, h.x, h.y);
        pinkCtx.fill();
        h.x += h.dx;
        h.y += h.dy;
        h.alpha -= 0.01;
        if (h.alpha <= 0) hearts.splice(i, 1);
    });
}

function heartLoop() {
    drawHearts();
    requestAnimationFrame(heartLoop);
}

function startParticleHeart() {
    pinkboard.style.display = "block";
    setInterval(() => {
        createHeart(Math.random() * pinkboard.width, Math.random() * pinkboard.height);
    }, 200);
    heartLoop();
}

// === Chuyển sang dòng chữ kế tiếp ===
function morphToNextText() {
    currentIndex++;
    if (currentIndex >= texts.length) {
        particles = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = "none";

        if (sticker.src && sticker.src !== window.location.href && sticker.src.trim() !== "") {
            sticker.style.display = "block";
        } else {
            startParticleHeart();
        }
        stopAnimation = true;
        return;
    }

    interpolateParticles(generateDots(texts[currentIndex]));
    lastMorphTime = Date.now();
}

// === Vòng lặp hoạt ảnh ===
function animate() {
    if (stopAnimation) return;
    updateParticles();
    drawParticles();

    if (
        particles.every(
            p => Math.abs(p.x - p.tx) < 0.5 && Math.abs(p.y - p.ty) < 0.5
        ) &&
        Date.now() - lastMorphTime > morphDelay
    ) {
        morphToNextText();
    }

    requestAnimationFrame(animate);
}

// === Bắt đầu hoạt ảnh ===
const firstDots = generateDots(texts[0]);
particles = firstDots.map(dot => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    tx: dot.x,
    ty: dot.y,
    progress: 0,
    speed: 0.05 + 0.05 * Math.random(),
}));

canvas.style.display = "none";
setTimeout(() => {
    canvas.style.display = "block";
    lastMorphTime = Date.now();
    animate();
}, 1000);

// === Cập nhật khi đổi kích thước màn hình ===
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    shapeCanvas.width = canvas.width;
    shapeCanvas.height = canvas.height;
    pinkboard.width = window.innerWidth;
    pinkboard.height = window.innerHeight;
});
