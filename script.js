let tileGIFs = {};
let board = [];
const size = 4;

document.addEventListener('DOMContentLoaded', () => {
  const uploader = document.getElementById('gifUploader');
  const startBtn = document.querySelector('button');
  const grid = document.getElementById('grid');
  const gameOverScreen = document.getElementById('gameOver');

  let totalFiles = 0;
  let loadedFiles = 0;

  uploader.addEventListener('change', (e) => {
    tileGIFs = {};
    totalFiles = e.target.files.length;
    loadedFiles = 0;
    startBtn.disabled = true;

    [...e.target.files].forEach((file, i) => {
      if (!file.type.startsWith('image/')) return;

      const value = 2 ** (i + 1); // 2, 4, 8, etc.
      const reader = new FileReader();
      reader.onload = () => {
        tileGIFs[value] = reader.result;
        loadedFiles++;
        if (loadedFiles === totalFiles) {
          startBtn.disabled = false;
        }
      };
      reader.readAsDataURL(file);
    });
  });

  window.startGame = () => {
    if (Object.keys(tileGIFs).length === 0) {
      alert("Please upload images before starting.");
      return;
    }

    board = Array(size).fill().map(() => Array(size).fill(0));
    addRandomTile();
    addRandomTile();
    gameOverScreen.classList.add('hidden');
    renderBoard();
  };

  function addRandomTile() {
    const empty = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function renderBoard() {
    grid.innerHTML = '';
    board.forEach(row => {
      row.forEach(val => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.setAttribute('data-value', val || '');

        if (val && tileGIFs[val]) {
          const img = document.createElement('img');
          img.src = tileGIFs[val];
          tile.appendChild(img);
        } else if (val) {
          tile.textContent = val;
        }

        grid.appendChild(tile);
      });
    });
  }

  function move(dir) {
    let changed = false;
    const combine = row => {
      row = row.filter(n => n);
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
          row[i] *= 2;
          row[i + 1] = 0;
          changed = true;
        }
      }
      return row.filter(n => n);
    };

    const rotate = b => b[0].map((_, i) => b.map(r => r[i]));
    const reverse = b => b.map(r => [...r].reverse());

    let temp = board.map(r => [...r]);
    if (dir === 'up') {
      temp = rotate(temp);
      temp = temp.map(r => combine(r));
      temp = temp.map(r => [...r, ...Array(size - r.length).fill(0)]);
      temp = rotate(rotate(rotate(temp)));
    } else if (dir === 'down') {
      temp = rotate(temp);
      temp = reverse(temp).map(r => combine(r));
      temp = temp.map(r => [...r, ...Array(size - r.length).fill(0)]);
      temp = reverse(temp);
      temp = rotate(rotate(rotate(temp)));
    } else if (dir === 'left') {
      temp = temp.map(r => {
        const merged = combine(r);
        return [...merged, ...Array(size - merged.length).fill(0)];
      });
    } else if (dir === 'right') {
      temp = temp.map(r => {
        const merged = combine(r.reverse());
        return [...Array(size - merged.length).fill(0), ...merged.reverse()];
      });
    }

    if (JSON.stringify(board) !== JSON.stringify(temp)) {
      board = temp;
      addRandomTile();
      renderBoard();
      if (checkGameOver()) {
        gameOverScreen.classList.remove('hidden');
      }
    }
  }

  function checkGameOver() {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = board[r][c];
        if (val === 0) return false;
        if (c < size - 1 && board[r][c] === board[r][c + 1]) return false;
        if (r < size - 1 && board[r][c] === board[r + 1][c]) return false;
      }
    }
    return true;
  }

  document.addEventListener('keydown', e => {
    const keys = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right'
    };
    if (keys[e.key]) {
      move(keys[e.key]);
    }
  });

  // ✨ SWIPE FIX — contained within grid and blocks scroll
  let touchStartX, touchStartY;

  grid.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: false });

  grid.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;

    const threshold = 30;
    let moved = false;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) {
        move('right');
        moved = true;
      } else if (dx < -threshold) {
        move('left');
        moved = true;
      }
    } else {
      if (dy > threshold) {
        move('down');
        moved = true;
      } else if (dy < -threshold) {
        move('up');
        moved = true;
      }
    }

    if (moved) {
      e.preventDefault(); // 🔒 blocks scroll + refresh
    }
  }, { passive: false });
});
