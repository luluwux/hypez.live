const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            // Exclude directories we don't want to touch
            if (f !== 'node_modules' && f !== '.next' && f !== 'dist' && f !== 'coverage' && f !== '.turbo' && f !== '.git') {
                walkDir(dirPath, callback);
            }
        } else {
            if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')) {
                callback(dirPath);
            }
        }
    });
}

const rootDir = path.resolve(__dirname, '..');
console.log('Cleaning comments in:', rootDir);

let cleanedCount = 0;

walkDir(rootDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Match decorative comments like:
    // // ─── Helpers ────────────────────────────────────────────────────────────────
    // // ─── Setup Panel Güncelleme ──────────────────────────────────────────────────
    // Or other similar dividers
    const decorativeRegex = /^\s*\/\/\s*(───|─|={3,}|-{3,}).*$\r?\n?/gm;
    
    if (decorativeRegex.test(content)) {
        content = content.replace(decorativeRegex, '');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Cleaned: ${path.relative(rootDir, filePath)}`);
        cleanedCount++;
    }
});

console.log(`Completed. Cleaned ${cleanedCount} files.`);
