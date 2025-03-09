document.addEventListener('DOMContentLoaded', () => {
    const gridSize = 4;
    const gameContainer = document.querySelector('.game-container');
    const tileContainer = document.querySelector('.tile-container');
    const scoreDisplay = document.getElementById('score');
    const bestScoreDisplay = document.getElementById('best-score');
    const newGameButton = document.getElementById('new-game-button');
    const gameMessage = document.querySelector('.game-message');
    const retryButton = document.querySelector('.retry-button');

    let grid = [];
    let score = 0;
    let bestScore = 0;
    let gameOver = false;
    let gameWon = false;
    let touchStartX = 0;
    let touchStartY = 0;

    // 初始化游戏
    function initGame() {
        grid = createEmptyGrid();
        score = 0;
        gameOver = false;
        gameWon = false;
        
        // 加载最高分
        if (localStorage.getItem('bestScore')) {
            bestScore = parseInt(localStorage.getItem('bestScore'));
            bestScoreDisplay.textContent = bestScore;
        }

        // 清空游戏消息
        gameMessage.classList.remove('game-won', 'game-over');
        gameMessage.style.display = 'none';
        gameMessage.querySelector('p').textContent = '';
        
        // 清空方块容器
        tileContainer.innerHTML = '';
        
        // 更新分数显示
        updateScore();
        
        // 添加两个初始方块
        addRandomTile();
        addRandomTile();
    }

    // 创建空的游戏网格
    function createEmptyGrid() {
        const grid = [];
        for (let i = 0; i < gridSize; i++) {
            grid[i] = [];
            for (let j = 0; j < gridSize; j++) {
                grid[i][j] = 0;
            }
        }
        return grid;
    }

    // 添加随机方块
    function addRandomTile() {
        const emptyCells = [];
        
        // 找出所有空单元格
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] === 0) {
                    emptyCells.push({row: i, col: j});
                }
            }
        }
        
        // 如果没有空单元格，返回
        if (emptyCells.length === 0) return;
        
        // 随机选择一个空单元格
        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        
        // 90%概率生成2，10%概率生成4
        const value = Math.random() < 0.9 ? 2 : 4;
        
        // 在网格中设置值
        grid[cell.row][cell.col] = value;
        
        // 创建方块元素
        const tile = document.createElement('div');
        tile.className = `tile tile-${value}`;
        tile.textContent = value;
        tile.style.left = `${cell.col * 100 + cell.col * 15}px`;
        tile.style.top = `${cell.row * 100 + cell.row * 15}px`;
        
        // 添加到页面
        tileContainer.appendChild(tile);
        
        // 添加出现动画
        setTimeout(() => {
            tile.style.transform = 'scale(1)';
        }, 100);
    }

    // 绘制网格
    function renderGrid() {
        // 清空方块容器
        tileContainer.innerHTML = '';
        
        // 根据网格状态创建方块
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] !== 0) {
                    const value = grid[i][j];
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${value}`;
                    tile.textContent = value;
                    tile.style.left = `${j * 100 + j * 15}px`;
                    tile.style.top = `${i * 100 + i * 15}px`;
                    tileContainer.appendChild(tile);
                }
            }
        }
        
        // 根据屏幕尺寸调整方块大小
        if (window.innerWidth <= 520) {
            const tiles = document.querySelectorAll('.tile');
            tiles.forEach(tile => {
                const row = parseInt(tile.style.top) / 115;
                const col = parseInt(tile.style.left) / 115;
                tile.style.left = `${col * 60 + col * 10}px`;
                tile.style.top = `${row * 60 + row * 10}px`;
            });
        }
    }

    // 更新分数
    function updateScore() {
        scoreDisplay.textContent = score;
        
        if (score > bestScore) {
            bestScore = score;
            bestScoreDisplay.textContent = bestScore;
            localStorage.setItem('bestScore', bestScore);
        }
    }

    // 移动方块
    function moveTiles(direction) {
        let moved = false;
        
        // 创建网格副本用于比较
        const previousGrid = JSON.parse(JSON.stringify(grid));
        
        // 根据方向移动方块
        switch (direction) {
            case 'up':
                for (let j = 0; j < gridSize; j++) {
                    const column = [];
                    for (let i = 0; i < gridSize; i++) {
                        column.push(grid[i][j]);
                    }
                    const result = mergeLine(column);
                    for (let i = 0; i < gridSize; i++) {
                        grid[i][j] = result[i];
                    }
                }
                break;
            case 'right':
                for (let i = 0; i < gridSize; i++) {
                    const row = grid[i].slice().reverse();
                    const result = mergeLine(row).reverse();
                    grid[i] = result;
                }
                break;
            case 'down':
                for (let j = 0; j < gridSize; j++) {
                    const column = [];
                    for (let i = 0; i < gridSize; i++) {
                        column.push(grid[i][j]);
                    }
                    const result = mergeLine(column.reverse()).reverse();
                    for (let i = 0; i < gridSize; i++) {
                        grid[i][j] = result[i];
                    }
                }
                break;
            case 'left':
                for (let i = 0; i < gridSize; i++) {
                    const result = mergeLine(grid[i]);
                    grid[i] = result;
                }
                break;
        }
        
        // 检查是否有移动
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] !== previousGrid[i][j]) {
                    moved = true;
                    break;
                }
            }
            if (moved) break;
        }
        
        // 如果有移动，则添加新方块并重新渲染
        if (moved) {
            addRandomTile();
            renderGrid();
            updateScore();
            checkGameStatus();
        }
        
        return moved;
    }

    // 合并行或列
    function mergeLine(line) {
        // 移除所有零
        const nonZeros = line.filter(tile => tile !== 0);
        const merged = [];
        
        // 合并相邻相同的方块
        for (let i = 0; i < nonZeros.length; i++) {
            if (i < nonZeros.length - 1 && nonZeros[i] === nonZeros[i + 1]) {
                const mergedValue = nonZeros[i] * 2;
                merged.push(mergedValue);
                score += mergedValue;
                i++; // 跳过下一个方块
            } else {
                merged.push(nonZeros[i]);
            }
        }
        
        // 填充剩余的零
        const zeros = Array(gridSize - merged.length).fill(0);
        return merged.concat(zeros);
    }

    // 检查游戏状态
    function checkGameStatus() {
        // 检查是否达到2048
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] === 2048 && !gameWon) {
                    gameWon = true;
                    showGameMessage('你赢了!');
                    return;
                }
            }
        }
        
        // 检查是否还有空间
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] === 0) {
                    return; // 仍有空间
                }
            }
        }
        
        // 检查是否还能移动（水平和垂直方向）
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize - 1; j++) {
                if (grid[i][j] === grid[i][j + 1]) {
                    return; // 可以水平合并
                }
            }
        }
        
        for (let j = 0; j < gridSize; j++) {
            for (let i = 0; i < gridSize - 1; i++) {
                if (grid[i][j] === grid[i + 1][j]) {
                    return; // 可以垂直合并
                }
            }
        }
        
        // 游戏结束
        gameOver = true;
        showGameMessage('游戏结束!');
    }

    // 显示游戏消息
    function showGameMessage(message) {
        gameMessage.querySelector('p').textContent = message;
        
        if (message === '你赢了!') {
            gameMessage.classList.add('game-won');
        } else {
            gameMessage.classList.add('game-over');
        }
        
        gameMessage.style.display = 'flex';
    }

    // 键盘事件处理
    function handleKeyDown(event) {
        if (gameOver) return;
        
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                moveTiles('up');
                break;
            case 'ArrowRight':
                event.preventDefault();
                moveTiles('right');
                break;
            case 'ArrowDown':
                event.preventDefault();
                moveTiles('down');
                break;
            case 'ArrowLeft':
                event.preventDefault();
                moveTiles('left');
                break;
        }
    }

    // 触摸事件处理
    function handleTouchStart(event) {
        if (gameOver) return;
        
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }

    function handleTouchMove(event) {
        event.preventDefault();
    }

    function handleTouchEnd(event) {
        if (gameOver) return;
        
        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // 需要一个最小的滑动距离
        const minSwipeDistance = 30;
        
        if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) {
            return;
        }
        
        // 水平方向滑动比垂直方向更明显
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) {
                moveTiles('right');
            } else {
                moveTiles('left');
            }
        } else {
            if (dy > 0) {
                moveTiles('down');
            } else {
                moveTiles('up');
            }
        }
    }

    // 添加事件监听器
    document.addEventListener('keydown', handleKeyDown);
    gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameContainer.addEventListener('touchend', handleTouchEnd);
    newGameButton.addEventListener('click', initGame);
    retryButton.addEventListener('click', initGame);

    // 调整方块大小
    window.addEventListener('resize', renderGrid);
    
    // 初始化游戏
    initGame();
});