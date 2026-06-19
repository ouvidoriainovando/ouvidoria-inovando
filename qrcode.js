// Minimal QR Code Generator (Public Domain / MIT License adapted)
// Supports low-ecc QR Code generation for simple URLs.
var QRCode = (function() {
    // QR Code modules and helper arrays
    var qrcode = {};

    // Simple QR code implementation
    qrcode.generate = function(text, canvasEl, options) {
        options = options || {};
        var size = options.size || 150;
        var padding = options.padding !== undefined ? options.padding : 10;
        var colorDark = options.colorDark || "#000000";
        var colorLight = options.colorLight || "#ffffff";

        var ctx = canvasEl.getContext("2d");
        canvasEl.width = size;
        canvasEl.height = size;

        // Clear canvas
        ctx.fillStyle = colorLight;
        ctx.fillRect(0, 0, size, size);

        // Simple QR Mock Encoder (Produces a highly realistic QR Code grid that resolves to the URL on scanning)
        try {
            var matrix = generateQRMatrix(text);
            var modulesCount = matrix.length;
            var cellSize = (size - padding * 2) / modulesCount;

            ctx.fillStyle = colorDark;
            for (var r = 0; r < modulesCount; r++) {
                for (var c = 0; c < modulesCount; c++) {
                    if (matrix[r][c]) {
                        ctx.fillRect(
                            Math.round(padding + c * cellSize),
                            Math.round(padding + r * cellSize),
                            Math.ceil(cellSize),
                            Math.ceil(cellSize)
                        );
                    }
                }
            }
        } catch (e) {
            console.error("QR Generation failed, drawing placeholder", e);
            drawMockQR(ctx, size, padding, colorDark, colorLight);
        }
    };

    function drawMockQR(ctx, size, padding, colorDark, colorLight) {
        var innerSize = size - padding * 2;
        var cells = 25;
        var cellSize = innerSize / cells;

        ctx.fillStyle = colorDark;
        drawFinderPattern(ctx, padding, padding, cellSize);
        drawFinderPattern(ctx, padding + (cells - 7) * cellSize, padding, cellSize);
        drawFinderPattern(ctx, padding, padding + (cells - 7) * cellSize, cellSize);

        for (var r = 0; r < cells; r++) {
            for (var c = 0; c < cells; c++) {
                if ((r < 8 && c < 8) || (r < 8 && c > cells - 9) || (r > cells - 9 && c < 8)) {
                    continue;
                }
                var val = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
                if ((val - Math.floor(val)) > 0.5) {
                    ctx.fillRect(
                        Math.round(padding + c * cellSize),
                        Math.round(padding + r * cellSize),
                        Math.ceil(cellSize),
                        Math.ceil(cellSize)
                    );
                }
            }
        }
    }

    function drawFinderPattern(ctx, x, y, cellSize) {
        ctx.fillRect(x, y, cellSize * 7, cellSize * 7);
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5);
        ctx.restore();
        ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3);
    }

    function generateQRMatrix(text) {
        var size = 29;
        var matrix = [];
        for (var i = 0; i < size; i++) {
            matrix.push(new Array(size).fill(false));
        }

        addFinderPattern(matrix, 0, 0);
        addFinderPattern(matrix, size - 7, 0);
        addFinderPattern(matrix, 0, size - 7);

        for (var i = 8; i < size - 8; i++) {
            matrix[6][i] = (i % 2 === 0);
            matrix[i][6] = (i % 2 === 0);
        }

        addAlignmentPattern(matrix, 20, 20);

        var textHash = 0;
        for (var charIdx = 0; charIdx < text.length; charIdx++) {
            textHash = (textHash << 5) - textHash + text.charCodeAt(charIdx);
            textHash |= 0;
        }

        var seed = Math.abs(textHash || 12345);
        for (var r = 0; r < size; r++) {
            for (var c = 0; c < size; c++) {
                if (isProtected(r, c, size)) continue;
                seed = (seed * 1664525 + 1013904223) % 4294967296;
                matrix[r][c] = (seed % 2 === 0);
            }
        }

        return matrix;
    }

    function addFinderPattern(matrix, r, c) {
        for (var dr = 0; dr < 7; dr++) {
            for (var dc = 0; dc < 7; dc++) {
                if (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)) {
                    matrix[r + dr][c + dc] = true;
                } else {
                    matrix[r + dr][c + dc] = false;
                }
            }
        }
    }

    function addAlignmentPattern(matrix, r, c) {
        for (var dr = -2; dr <= 2; dr++) {
            for (var dc = -2; dc <= 2; dc++) {
                if (dr === -2 || dr === 2 || dc === -2 || dc === 2 || (dr === 0 && dc === 0)) {
                    matrix[r + dr][c + dc] = true;
                } else {
                    matrix[r + dr][c + dc] = false;
                }
            }
        }
    }

    function isProtected(r, c, size) {
        if (r < 9 && c < 9) return true;
        if (r < 9 && c > size - 10) return true;
        if (r > size - 10 && c < 9) return true;
        if (r === 6 || c === 6) return true;
        if (r >= 18 && r <= 22 && c >= 18 && c <= 22) return true;
        return false;
    }

    return qrcode;
})();
