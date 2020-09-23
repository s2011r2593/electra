import { Simulator } from 'powerplant';
import { memory } from 'powerplant/powerplant_bg';

var isAnimating = false;
const toggleA = () => {
    isAnimating = !isAnimating;
    let source = document.getElementById('flick').src;
    if (source.charAt(source.length - 5) == 'f') {
        document.getElementById('flick').src = './on.png';
        then = Date.now();
    } else {
        document.getElementById('flick').src = './off.png';
        document.getElementById('speedometer').innerHTML = '0.00';
    }
}
const image = document.getElementById('flick').onclick = () => {toggleA()};

const width = 96;
const height = 40;
const viscosity = 0.07;
const u0 = 0.24;
const simulator = Simulator.new(width, height, viscosity, u0);

var frameWidth = window.innerWidth * 0.6;
var frameHeight = window.innerHeight * 0.5;
var cSize = Math.floor(Math.min(frameWidth/width, frameHeight/height));

const canvas = document.getElementById('canv');
canvas.height = cSize * height + 1;
canvas.width = cSize * width + 1;
const ctx = canvas.getContext('2d');

const setSize = () => {
    frameWidth = window.innerWidth * 0.6;
    frameHeight = window.innerHeight * 0.5;
    cSize = Math.floor(Math.min(frameWidth/width, frameHeight/height));
    canvas.height = cSize * height + 1;
    canvas.width = cSize * width + 1;
    if (!isAnimating) {
        draw();
    }
}

window.addEventListener('resize', setSize);

var then = Date.now();
var lastRefresh = Date.now();

const animate = () => {
    requestAnimationFrame(animate);

    let now = Date.now();

    if (isAnimating) {
        if (now - lastRefresh > 200) {
            document.getElementById('speedometer').innerHTML = (1000/(now - then)).toFixed(2);
            lastRefresh = now;
        }
        then = now;
        simulator.tick();
        draw();
    }
}
const draw = () => {
    const latticePtr = simulator.curl();
    var curl = new Float64Array(memory.buffer, latticePtr, width * height);

    const barrierPtr = simulator.barrier();
    var barriers = new Uint8Array(memory.buffer, barrierPtr, width * height);
    var barrierIdx = [];

    var cmap = [];

    let threshold = 0.11
    for (let i = 0; i < curl.length; i++) {
        cmap.push(curl[i])

        if (cmap[i] > threshold) {
            cmap[i] = (cmap[i] + (4 * threshold))/5;
        } else if (cmap[i] < -threshold) {
            cmap[i] = (cmap[i] - (4 * threshold))/5;
        }
        cmap[i] = (cmap[i] + threshold) / (2 * threshold);

        if (barriers[i]) {
            barrierIdx.push(i);
        }
    }

    ctx.beginPath();
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const idx = i * width + j;
            let val = cmap[idx] * 240 + 120;
            let lshift = 0.3/(Math.abs(cmap[idx] - 0.5)+0.01);
            ctx.fillStyle = 'hsl(' + val + ', ' + (70 - lshift) + '%, ' + (68 - (lshift * 0.7)) + '%)';
            if (barrierIdx.includes(idx)) {
                ctx.fillStyle = '#282828';
            }

            ctx.fillRect(
                j * cSize + 1,
                i * cSize + 1,
                cSize,
                cSize
            );
        }
    }
    ctx.stroke();
};

draw();
animate();