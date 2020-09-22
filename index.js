import { Simulator } from "powerplant/powerplant_bg.js";
import { memory } from 'powerplant/powerplant_bg.wasm';

const button = document.getElementById('toggle').onclick = () => {toggleAnim()};
var isAnimating = false;
const toggleAnim = () => {
    isAnimating = !isAnimating;
}

const width = 96;
const height = 40;
const viscosity = 0.02;
const u0 = 0.2
const simulator = Simulator.new(width, height, viscosity, u0);

const cSize = 8;

const canvas = document.getElementById('canv');
canvas.height = cSize * height + 1;
canvas.width = cSize * width + 1;
const ctx = canvas.getContext('2d');

const animate = () => {
    requestAnimationFrame(animate);

    if (isAnimating) {
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
            let val = (1.0 - cmap[idx]) * 240
            ctx.fillStyle = 'hsl(' + val + ', 70%, 68%)';
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