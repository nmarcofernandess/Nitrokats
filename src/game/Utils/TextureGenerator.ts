import { CanvasTexture, NearestFilter } from 'three';

export const createPixelTexture = (
    width: number,
    height: number,
    drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        // Disable smoothing for pixel art look
        ctx.imageSmoothingEnabled = false;
        drawFn(ctx, width, height);
    }

    const texture = new CanvasTexture(canvas);
    texture.magFilter = NearestFilter; // Keep pixels sharp
    texture.minFilter = NearestFilter;
    return texture;
};

export const generateCatFaceTexture = (primaryColor: string, eyeColor: string) => {
    return createPixelTexture(64, 64, (ctx, w, h) => {
        // Background
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, w, h);

        // Eyes (Big Pixel Eyes)
        ctx.fillStyle = eyeColor;
        // Left Eye
        ctx.fillRect(10, 20, 15, 15);
        // Right Eye
        ctx.fillRect(39, 20, 15, 15);

        // Pupils (Black)
        ctx.fillStyle = '#000000';
        ctx.fillRect(15, 25, 5, 5);
        ctx.fillRect(44, 25, 5, 5);

        // Whiskers
        ctx.fillStyle = '#ffffff';
        // Left
        ctx.fillRect(5, 45, 15, 2);
        ctx.fillRect(5, 50, 15, 2);
        // Right
        ctx.fillRect(44, 45, 15, 2);
        ctx.fillRect(44, 50, 15, 2);

        // Nose
        ctx.fillStyle = '#ff9999';
        ctx.fillRect(28, 40, 8, 5);
    });
};

export const generateTracksTexture = () => {
    return createPixelTexture(32, 32, (ctx, w, h) => {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, w, h);

        // Treads
        ctx.fillStyle = '#444';
        for (let i = 0; i < h; i += 8) {
            ctx.fillRect(0, i, w, 4);
        }
    });
};

export const generateChassisTexture = (color: string) => {
    return createPixelTexture(64, 64, (ctx, w, h) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, w, h);

        // Panel lines / Bolts
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, 0, w, 2); // Top border
        ctx.fillRect(0, h - 2, w, 2); // Bottom border
        ctx.fillRect(0, 0, 2, h); // Left
        ctx.fillRect(w - 2, 0, 2, h); // Right

        // Rivets
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(4, 4, 4, 4);
        ctx.fillRect(w - 8, 4, 4, 4);
        ctx.fillRect(4, h - 8, 4, 4);
        ctx.fillRect(w - 8, h - 8, 4, 4);
    });
};
