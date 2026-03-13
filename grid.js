class Grid {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.cells = [];
        this.rows = 0;
        this.cols = 0;

        // State
        this.startNode = null;
        this.endNode = null;
        this.isDrawing = false;
        this.drawingMode = null;
        this.isAnimating = false;

        // Speed mapping in ms
        this.speeds = { slow: 40, normal: 8, fast: 0 };
        this.currentSpeed = this.speeds.normal;

        // Stats callbacks
        this.onStatsUpdate = null;

        this.init();
        window.addEventListener('resize', this.debounce(() => this.init(), 250));
    }

    init() {
        if (this.isAnimating) return;
        this.container.innerHTML = '';
        this.cells = [];

        const rect = this.container.getBoundingClientRect();
        const cellSize = 24;
        this.cols = Math.floor(rect.width / cellSize);
        this.rows = Math.floor(rect.height / cellSize);

        // Ensure odd dimensions for perfect maze generation
        if (this.cols % 2 === 0) this.cols--;
        if (this.rows % 2 === 0) this.rows--;
        this.cols = Math.max(11, this.cols);
        this.rows = Math.max(11, this.rows);

        const gridElement = document.createElement('div');
        gridElement.className = 'grid';
        gridElement.style.gridTemplateColumns = `repeat(${this.cols}, var(--cell-size))`;
        gridElement.style.gridTemplateRows = `repeat(${this.rows}, var(--cell-size))`;

        // Place start/end on valid odd coordinates
        let startRow = 1, startCol = 1;
        let endRow = this.rows % 2 === 0 ? this.rows - 2 : this.rows - 2;
        let endCol = this.cols % 2 === 0 ? this.cols - 2 : this.cols - 2;
        // Force odd
        if (endRow % 2 === 0) endRow--;
        if (endCol % 2 === 0) endCol--;

        this.startNode = { r: startRow, c: startCol };
        this.endNode = { r: endRow, c: endCol };

        for (let r = 0; r < this.rows; r++) {
            this.cells[r] = [];
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${r}-${c}`;
                cell.dataset.r = r;
                cell.dataset.c = c;

                cell.addEventListener('mousedown', (e) => this.handleMouseDown(r, c, e));
                cell.addEventListener('mouseenter', (e) => this.handleMouseEnter(r, c, e));

                gridElement.appendChild(cell);
                this.cells[r][c] = {
                    element: cell,
                    r, c,
                    isWall: false,
                    isStart: (r === startRow && c === startCol),
                    isEnd: (r === endRow && c === endCol),
                    isVisited: false,
                    isPath: false,
                    weight: 1
                };
            }
        }

        document.addEventListener('mouseup', () => {
            this.isDrawing = false;
            this.drawingMode = null;
        });

        this.container.appendChild(gridElement);
        this.updateNodeClasses();
    }

    updateNodeClasses() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const node = this.cells[r][c];
                node.element.className = 'cell';
                if (node.isWall) node.element.classList.add('wall');
                if (node.isStart) node.element.classList.add('start');
                if (node.isEnd) node.element.classList.add('end');
                if (node.isVisited && !node.isStart && !node.isEnd) node.element.classList.add('visited');
                if (node.isPath && !node.isStart && !node.isEnd) node.element.classList.add('path');
            }
        }
    }

    handleMouseDown(r, c, e) {
        if (this.isAnimating) return;
        e.preventDefault();
        const node = this.cells[r][c];
        this.isDrawing = true;
        if (node.isStart) {
            this.drawingMode = 'start';
        } else if (node.isEnd) {
            this.drawingMode = 'end';
        } else if (node.isWall) {
            this.drawingMode = 'erase';
            this.toggleWall(r, c, false);
        } else {
            this.drawingMode = 'wall';
            this.toggleWall(r, c, true);
        }
    }

    handleMouseEnter(r, c, e) {
        if (!this.isDrawing || this.isAnimating) return;
        const node = this.cells[r][c];
        if (this.drawingMode === 'start' && !node.isEnd) {
            this.cells[this.startNode.r][this.startNode.c].isStart = false;
            this.cells[this.startNode.r][this.startNode.c].element.classList.remove('start');
            node.isStart = true;
            node.element.classList.add('start');
            this.startNode = { r, c };
        } else if (this.drawingMode === 'end' && !node.isStart) {
            this.cells[this.endNode.r][this.endNode.c].isEnd = false;
            this.cells[this.endNode.r][this.endNode.c].element.classList.remove('end');
            node.isEnd = true;
            node.element.classList.add('end');
            this.endNode = { r, c };
        } else if (this.drawingMode === 'wall' && !node.isStart && !node.isEnd) {
            this.toggleWall(r, c, true);
        } else if (this.drawingMode === 'erase' && !node.isStart && !node.isEnd) {
            this.toggleWall(r, c, false);
        }
    }

    toggleWall(r, c, isWall) {
        const node = this.cells[r][c];
        node.isWall = isWall;
        if (isWall) {
            node.element.classList.add('wall');
            node.element.classList.remove('visited', 'path');
            node.isVisited = false;
            node.isPath = false;
        } else {
            node.element.classList.remove('wall');
        }
    }

    // force=true bypasses isAnimating guard (used by maze generators internally)
    clearBoard(force = false) {
        if (this.isAnimating && !force) return;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const node = this.cells[r][c];
                node.isWall = false;
                node.isVisited = false;
                node.isPath = false;
            }
        }
        this.updateNodeClasses();
    }

    clearPath(force = false) {
        if (this.isAnimating && !force) return;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const node = this.cells[r][c];
                node.isVisited = false;
                node.isPath = false;
                node.element.classList.remove('visited', 'path');
            }
        }
    }

    // force=true bypasses isAnimating guard
    fillGrid(force = false) {
        if (this.isAnimating && !force) return;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const node = this.cells[r][c];
                if (!node.isStart && !node.isEnd) {
                    node.isWall = true;
                    node.element.classList.add('wall');
                    node.element.classList.remove('visited', 'path');
                    node.isVisited = false;
                    node.isPath = false;
                }
            }
        }
    }

    async animateNodes(nodesToAnimate, className) {
        let count = 0;
        for (let i = 0; i < nodesToAnimate.length; i++) {
            const node = nodesToAnimate[i];
            const cellNode = this.cells[node.r][node.c];
            if (!cellNode.isStart && !cellNode.isEnd) {
                cellNode.element.classList.add(className);
                if (className === 'visited') { cellNode.isVisited = true; count++; }
                if (className === 'path') { cellNode.isPath = true; count++; }
                if (className === 'wall') { cellNode.isWall = true; }
            }
            if (this.currentSpeed > 0 && i % Math.max(1, Math.floor(8 / (this.currentSpeed || 1))) === 0) {
                await new Promise(resolve => setTimeout(resolve, this.currentSpeed));
            }
        }
        return count;
    }

    async animateWallRemoval(wallsToRemove) {
        for (let i = 0; i < wallsToRemove.length; i++) {
            const node = wallsToRemove[i];
            const cellNode = this.cells[node.r][node.c];
            if (!cellNode.isStart && !cellNode.isEnd) {
                cellNode.isWall = false;
                cellNode.element.classList.remove('wall');
                cellNode.element.classList.add('carved');
                setTimeout(() => cellNode.element.classList.remove('carved'), 400);
            }
            if (this.currentSpeed > 0 && i % Math.max(1, Math.floor(4 / (this.currentSpeed || 1))) === 0) {
                await new Promise(resolve => setTimeout(resolve, this.currentSpeed));
            }
        }
    }

    setSpeed(speedVal) {
        this.currentSpeed = this.speeds[speedVal] !== undefined ? this.speeds[speedVal] : this.speeds.normal;
    }

    debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    getNeighbors(r, c) {
        const neighbors = [];
        if (r > 0) neighbors.push({ r: r - 1, c });
        if (r < this.rows - 1) neighbors.push({ r: r + 1, c });
        if (c > 0) neighbors.push({ r, c: c - 1 });
        if (c < this.cols - 1) neighbors.push({ r, c: c + 1 });
        return neighbors;
    }
}
