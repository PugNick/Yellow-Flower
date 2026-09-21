const particles = [];

let animationState = "point";

let stemHeight = 0;

let pulse = 0;

let energy = 0;
let energyStartTime = 0;

let explosionStartTime = 0;
let flashStartTime = 0;



let isWaiting = true;
let waitTime = 5000;
let startTime = performance.now();

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let width;
let height;

let mouseX = 0;
let mouseY = 0;

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


const point = {
    x: 0,
    y: -50,
    radius: 15,
    velocityY: 0,
    gravity: 0.185,
    bounce: 0.55
};

const initialPointRadius = 15;
const flowerPointRadius = 25;

point.x = width / 2;

function updatePoint() {

    if (animationState === "point") {

        if (isWaiting) {

            const elapsed = performance.now() - startTime;

            if (elapsed >= waitTime) {
                isWaiting = false;
            } else {
                return;
            }
        }

        point.velocityY += point.gravity;
        point.y += point.velocityY;

        const ground = height - point.radius - 30;

        if (point.y >= ground) {

            point.y = ground;

            point.velocityY *= -point.bounce;

            if (Math.abs(point.velocityY) < 1) {
                point.velocityY = 0;
            }
        }
    }

    if (animationState === "growing") {

        const targetY = height / 2;

        point.y += (targetY - point.y) * 0.025;

        const progress =
            1 - Math.abs(targetY - point.y) / (height / 2);

        point.radius =
            initialPointRadius +
            (flowerPointRadius - initialPointRadius) * progress;

        if (Math.abs(targetY - point.y) < 1) {

            point.y = targetY;
            point.radius = flowerPointRadius;

            animationState = "flower";
        }
    }
}


function drawPoint() {

    if (animationState === "explosion") {
        return;
    }

    ctx.save();

    let radius = point.radius;
    let blur = 25;
    let color = "#ffff00";

    if (animationState === "charging") {

        radius = point.radius + energy * 8;

        blur =
            25 +
            energy * 35;

        color = `rgba(255, 255, 180, ${1 - energy * 0.35})`;
    }

    ctx.shadowColor = "#ffff00";
    ctx.shadowBlur = blur;

    ctx.fillStyle = color;

    ctx.beginPath();

    ctx.arc(
        point.x,
        point.y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}

function drawAura() {

    if (animationState === "explosion") {
        return;
    }

    let auraSize;
    let auraOpacity;

    if (animationState === "flower") {

        auraSize = 45 + Math.sin(pulse) * 12;
        auraOpacity = 0.35;

    } else if (animationState === "charging") {

        const elapsed = performance.now() - energyStartTime;

        energy = Math.min(elapsed / 1200, 1);

        auraSize =
            55 +
            energy * 100 +
            Math.sin(pulse * 2) * 8;

        auraOpacity =
            0.4 +
            energy * 0.5;

    } else {

        auraSize = 25 + Math.sin(pulse) * 8;
        auraOpacity = 0.35;
    }

    ctx.save();

    const gradient = ctx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        auraSize
    );

    gradient.addColorStop(
        0,
        `rgba(255, 255, 0, ${auraOpacity})`
    );

    gradient.addColorStop(
        1,
        "rgba(255, 255, 0, 0)"
    );

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.arc(
        point.x,
        point.y,
        auraSize,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}


function drawExplosionFlash() {

    if (animationState !== "explosion") {
        return;
    }

    const elapsed = performance.now() - flashStartTime;

    if (elapsed >= 120) {
        return;
    }

    const progress = elapsed / 120;

    const radius = 25 + progress * 100;
    const opacity = 1 - progress;

    ctx.save();

    const gradient = ctx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        radius
    );

    gradient.addColorStop(
        0,
        `rgba(255, 255, 255, ${opacity})`
    );

    gradient.addColorStop(
        0.25,
        `rgba(255, 255, 180, ${opacity * 0.8})`
    );

    gradient.addColorStop(
        1,
        "rgba(255, 255, 0, 0)"
    );

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.arc(
        point.x,
        point.y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}

function updateCursor(mouseX, mouseY) {

    const distance = Math.hypot(
        mouseX - point.x,
        mouseY - point.y
    );

    const pointIsClickable =
        (
            animationState === "point" &&
            !isWaiting &&
            point.velocityY === 0
        ) ||
        animationState === "flower";

    if (
        pointIsClickable &&
        distance <= point.radius + 15
    ) {
        canvas.style.cursor = "pointer";
    } else {
        canvas.style.cursor = "default";
    }
}

function drawStem() {

    if (animationState !== "growing" && animationState !== "flower") {
        return;
    }

    const groundY = height;
    const targetHeight = groundY - (point.y + point.radius);

    stemHeight += (targetHeight - stemHeight) * 0.08;

    ctx.save();

    ctx.strokeStyle = "#27F538";
    ctx.lineWidth = 4;

    ctx.shadowColor = "#27F538";
    ctx.shadowBlur = 15;

    ctx.beginPath();

    ctx.moveTo(
        point.x,
        groundY
    );

    ctx.lineTo(
        point.x,
        groundY - stemHeight
    );

    ctx.stroke();

    ctx.restore();
}

pulse += 0.05;


function animate() {

    ctx.clearRect(0, 0, width, height);

    updatePoint();
    updateParticles();

    updateCursor(mouseX, mouseY);

    drawAura();
    drawStem();
    drawPoint();
    drawExplosionFlash();
    drawParticles();

    pulse += 0.05;

    requestAnimationFrame(animate);
}

animate();




function createParticles() {

    particles.length = 0;

    const targets = createFlowerTargets();

    for (let i = 0; i < targets.length; i++) {

        particles.push({
            x: point.x,
            y: point.y,

            targetX: targets[i].x,
            targetY: targets[i].y,

            velocityX: 0,
            velocityY: 0,

            radius: Math.random() * 2 + 1
        });
    }
}

function updateParticles() {

    particles.forEach((particle) => {

        if (animationState === "contracting") {

            particle.targetX = point.x;
            particle.targetY = point.y;

            particle.x +=
                (particle.targetX - particle.x) * 0.06;

            particle.y +=
                (particle.targetY - particle.y) * 0.06;

        } else if (animationState === "explosion") {

            particle.x += particle.velocityX;
            particle.y += particle.velocityY;

            particle.velocityX *= 0.985;
            particle.velocityY *= 0.985;

            particle.life -= 0.015;

        } else {

            particle.x +=
                (particle.targetX - particle.x) * 0.025;

            particle.y +=
                (particle.targetY - particle.y) * 0.025;
        }

    });

    if (animationState === "contracting" && particles.length > 0) {

        let allClose = true;

        particles.forEach((particle) => {

            const distance = Math.hypot(
                particle.x - point.x,
                particle.y - point.y
            );

            if (distance > 5) {
                allClose = false;
            }

        });

        if (allClose) {

            animationState = "charging";

            energy = 0;
            energyStartTime = performance.now();

        }
    }

    if (animationState === "charging") {

        const elapsed = performance.now() - energyStartTime;

        if (elapsed >= 1200) {

            animationState = "explosion";

            explosionStartTime = performance.now();
            flashStartTime = performance.now();


            particles.forEach((particle) => {

                const angle = Math.random() * Math.PI * 2;

                const speed = Math.random() * 8 + 4;

                particle.velocityX = Math.cos(angle) * speed;
                particle.velocityY = Math.sin(angle) * speed;

                particle.life = 1;

            });
        }
    }

    if (animationState === "explosion") {

        const elapsed = performance.now() - explosionStartTime;

        if (elapsed >= 3000) {

            animationState = "point";

            particles.length = 0;

            point.x = width / 2;
            point.y = -50;
            point.radius = initialPointRadius;
            point.velocityY = 0;

            stemHeight = 0;

            isWaiting = true;
            startTime = performance.now();
        }
    }
}



function drawParticles() {
    particles.forEach((particle) => {
        ctx.save();

        ctx.fillStyle =
            `rgba(255, 255, 0, ${particle.life ?? 1})`;
        ctx.shadowColor = "#ffff00";
        ctx.shadowBlur = 12;

        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    });
}

function createFlowerTargets() {
    const targets = [];

    const particleCount = 150;

    const centerX = width / 2;
    const centerY = height / 2;

    const flowerSize = 180;

    for (let i = 0; i < particleCount; i++) {

        const theta = (Math.PI * 2 * i) / particleCount;

        const r = flowerSize * Math.cos(6 * theta);

        const x = centerX + r * Math.cos(theta);
        const y = centerY + r * Math.sin(theta);

        targets.push({
            x,
            y
        });
    }

    return targets;
}

canvas.addEventListener("mousemove", (event) => {

    mouseX = event.clientX;
    mouseY = event.clientY;

});


canvas.addEventListener("click", (event) => {

    const distance = Math.hypot(
        event.clientX - point.x,
        event.clientY - point.y
    );

    // Primer click: hacer crecer la flor
    if (
        animationState === "point" &&
        !isWaiting &&
        distance <= point.radius + 15
    ) {
        createParticles();

        animationState = "growing";

        return;
    }

    // Second click: contract flower
    if (
        animationState === "flower" &&
        distance <= point.radius + 15
    ) {
        animationState = "contracting";
    }

});