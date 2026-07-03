import { Injectable } from '@nestjs/common';
import { createCanvas } from '@napi-rs/canvas';

@Injectable()
export class MathCaptchaService {

    generate() {
        // 1. Generate Math Problem
        const operators = ['+', '-', '*'];
        const operator = operators[Math.floor(Math.random() * operators.length)];

        let a = Math.floor(Math.random() * 20) + 1;
        let b = Math.floor(Math.random() * 10) + 1;

        if (operator === '*') {
            a = Math.floor(Math.random() * 9) + 2;
            b = Math.floor(Math.random() * 9) + 2;
        }

        let answer = 0;
        let equation = '';

        switch (operator) {
            case '+': answer = a + b; equation = `${a} + ${b} = ?`; break;
            case '-': answer = a + b; equation = `${a + b} - ${b} = ?`; break;
            case '*': answer = a * b; equation = `${a} × ${b} = ?`; break;
        }

        // 2. Generate Misleading Options
        const options = new Set<number>();
        options.add(answer);
        while (options.size < 5) {
            const offset = Math.floor(Math.random() * 12) - 6;
            if (offset === 0) continue;
            const fake = answer + offset;
            if (fake >= 0) options.add(fake);
        }
        const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);

        // 3. Setup Canvas
        const width = 500;
        const height = 200;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // A. Background Noise
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        // Random Blobs
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.3)`;
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 50, 0, Math.PI * 2);
            ctx.fill();
        }

        // B. Draw Distorted Text
        const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier', 'Georgia', 'Impact'];
        const textToDraw = equation.split('');

        // Calculate rough start position
        // We will advance x dynamically
        let currentX = 60;
        const startY = height / 2;

        textToDraw.forEach((char, index) => {
            ctx.save();

            // 1. Random Font & Size
            const size = Math.floor(Math.random() * 30) + 50; // 50px - 80px
            const font = fonts[Math.floor(Math.random() * fonts.length)];
            ctx.font = `bold ${size}px "${font}"`;

            // 2. Position with Jitter (Wave effect + Randomness)
            const yJitter = (Math.random() - 0.5) * 20;
            const wave = Math.sin(index * 0.8) * 15;
            const x = currentX;
            const y = startY + yJitter + wave;

            ctx.translate(x, y);

            // 3. Distortion: Rotation
            const angle = (Math.random() - 0.5) * 0.8; // +/- 0.4 radians (~25 degrees)
            ctx.rotate(angle);

            // 4. Distortion: Skew/Shear
            // transform(a, b, c, d, e, f) -> b is skewY, c is skewX
            // Mild skew makes it look "melted" or 3D
            const skewX = (Math.random() - 0.5) * 0.3;
            ctx.transform(1, 0, skewX, 1, 0, 0);

            // 5. Draw Character
            // Gradient fill for complexity
            const gradient = ctx.createLinearGradient(0, -30, 0, 30);
            gradient.addColorStop(0, '#38bdf8'); // Light Blue
            gradient.addColorStop(0.5, '#e879f9'); // Purple
            gradient.addColorStop(1, '#ffffff'); // White
            ctx.fillStyle = gradient;

            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 5;

            ctx.fillText(char, 0, 0);

            ctx.restore();

            // Advance X cursor
            const measure = ctx.measureText(char);
            currentX += measure.width + 10 + (Math.random() * 10); // Random spacing
        });

        // C. Foreground Interference (Lines & Curves)
        // Bezier curves are harder for AI to remove than straight lines
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
            ctx.lineWidth = Math.random() * 3 + 1;
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.bezierCurveTo(
                Math.random() * width, Math.random() * height,
                Math.random() * width, Math.random() * height,
                Math.random() * width, Math.random() * height
            );
            ctx.stroke();
        }

        // Noise Dots (Salt & Pepper)
        for (let i = 0; i < 1000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        return {
            imageBuffer: canvas.toBuffer('image/png'),
            answer,
            options: shuffledOptions
        };
    }
}
