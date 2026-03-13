class MazeGenerator {
    constructor(gridObject) {
        this.g = gridObject;
    }

    async generate(algorithm) {
        if (this.g.isAnimating) return;
        this.g.isAnimating = true;

        // CRITICAL: use force=true so these don't skip due to isAnimating flag
        this.g.clearBoard(true);

        try {
            if (algorithm !== 'recursive-division') {
                this.g.fillGrid(true); // force-fill entire grid with walls
            }

            const generators = {
                'dfs': this.dfs.bind(this),
                'kruskal': this.kruskal.bind(this),
                'prim': this.prim.bind(this),
                'wilson': this.wilson.bind(this),
                'aldous-broder': this.aldousBroder.bind(this),
                'recursive-division': this.recursiveDivision.bind(this),
            };

            const fn = generators[algorithm];
            if (fn) await fn();
        } catch (err) {
            console.error('Maze generator error:', err);
        } finally {
            this.g.isAnimating = false;
        }
    }

    // Step-2 neighbors for carving (all cells are on odd coordinates)
    getMazeNeighbors(r, c) {
        const neighbors = [];
        if (r > 1)                   neighbors.push({ r: r - 2, c,     dr: -1, dc:  0 });
        if (r < this.g.rows - 2)     neighbors.push({ r: r + 2, c,     dr:  1, dc:  0 });
        if (c > 1)                   neighbors.push({ r,        c: c - 2, dr:  0, dc: -1 });
        if (c < this.g.cols - 2)     neighbors.push({ r,        c: c + 2, dr:  0, dc:  1 });
        return neighbors;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /* ─── Depth-First Search (Recursive Backtracker) ─── */
    async dfs() {
        const visited = new Set();
        const removedWalls = [];
        const stack = [{ r: 1, c: 1 }];
        visited.add('1,1');
        removedWalls.push({ r: 1, c: 1 });

        while (stack.length > 0) {
            const cur = stack[stack.length - 1];
            const neighbors = this.getMazeNeighbors(cur.r, cur.c)
                .filter(n => !visited.has(`${n.r},${n.c}`));

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                removedWalls.push({ r: cur.r + next.dr, c: cur.c + next.dc });
                removedWalls.push({ r: next.r, c: next.c });
                visited.add(`${next.r},${next.c}`);
                stack.push(next);
            } else {
                stack.pop();
            }
        }
        await this.g.animateWallRemoval(removedWalls);
    }

    /* ─── Kruskal's Algorithm ─── */
    async kruskal() {
        const removedWalls = [];
        const parent = new Map();
        const edges = [];

        for (let r = 1; r < this.g.rows; r += 2) {
            for (let c = 1; c < this.g.cols; c += 2) {
                parent.set(`${r},${c}`, `${r},${c}`);
                removedWalls.push({ r, c });
                if (r < this.g.rows - 2) edges.push({ r1: r, c1: c, r2: r + 2, c2: c, wr: r + 1, wc: c });
                if (c < this.g.cols - 2) edges.push({ r1: r, c1: c, r2: r, c2: c + 2, wr: r, wc: c + 1 });
            }
        }

        const find = (k) => {
            if (parent.get(k) !== k) parent.set(k, find(parent.get(k)));
            return parent.get(k);
        };
        const union = (a, b) => parent.set(find(a), find(b));

        this.shuffleArray(edges);
        for (const e of edges) {
            const a = `${e.r1},${e.c1}`, b = `${e.r2},${e.c2}`;
            if (find(a) !== find(b)) {
                union(a, b);
                removedWalls.push({ r: e.wr, c: e.wc });
            }
        }
        await this.g.animateWallRemoval(removedWalls);
    }

    /* ─── Prim's Algorithm ─── */
    async prim() {
        const visited = new Set();
        const removedWalls = [];
        const frontier = [];

        const start = { r: 1, c: 1 };
        visited.add(`${start.r},${start.c}`);
        removedWalls.push(start);

        const addFrontier = (r, c) => {
            for (const n of this.getMazeNeighbors(r, c)) {
                if (!visited.has(`${n.r},${n.c}`)) {
                    frontier.push({ from: { r, c }, to: n, wall: { r: r + n.dr, c: c + n.dc } });
                }
            }
        };
        addFrontier(start.r, start.c);

        while (frontier.length > 0) {
            const idx = Math.floor(Math.random() * frontier.length);
            const edge = frontier.splice(idx, 1)[0];
            if (!visited.has(`${edge.to.r},${edge.to.c}`)) {
                visited.add(`${edge.to.r},${edge.to.c}`);
                removedWalls.push(edge.wall);
                removedWalls.push({ r: edge.to.r, c: edge.to.c });
                addFrontier(edge.to.r, edge.to.c);
            }
        }
        await this.g.animateWallRemoval(removedWalls);
    }

    /* ─── Wilson's Algorithm ─── */
    async wilson() {
        const unvisited = new Set();
        const removedWalls = [];

        for (let r = 1; r < this.g.rows; r += 2)
            for (let c = 1; c < this.g.cols; c += 2) {
                unvisited.add(`${r},${c}`);
                removedWalls.push({ r, c });
            }

        // Mark first cell as visited (in maze)
        const firstKey = unvisited.values().next().value;
        unvisited.delete(firstKey);

        while (unvisited.size > 0) {
            const arr = Array.from(unvisited);
            let curStr = arr[Math.floor(Math.random() * arr.length)];
            let [cr, cc] = curStr.split(',').map(Number);
            const path = {};

            while (unvisited.has(`${cr},${cc}`)) {
                const neighbors = this.getMazeNeighbors(cr, cc);
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                path[`${cr},${cc}`] = next;
                cr = next.r;
                cc = next.c;
            }

            // Retrace path
            let [wr, wc] = curStr.split(',').map(Number);
            while (unvisited.has(`${wr},${wc}`)) {
                const next = path[`${wr},${wc}`];
                removedWalls.push({ r: wr + next.dr, c: wc + next.dc });
                unvisited.delete(`${wr},${wc}`);
                wr = next.r; wc = next.c;
            }
        }
        await this.g.animateWallRemoval(removedWalls);
    }

    /* ─── Aldous-Broder ─── */
    async aldousBroder() {
        const unvisited = new Set();
        const removedWalls = [];

        for (let r = 1; r < this.g.rows; r += 2)
            for (let c = 1; c < this.g.cols; c += 2) {
                unvisited.add(`${r},${c}`);
                removedWalls.push({ r, c });
            }

        let cr = 1, cc = 1;
        unvisited.delete(`${cr},${cc}`);

        while (unvisited.size > 0) {
            const neighbors = this.getMazeNeighbors(cr, cc);
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            if (unvisited.has(`${next.r},${next.c}`)) {
                unvisited.delete(`${next.r},${next.c}`);
                removedWalls.push({ r: cr + next.dr, c: cc + next.dc });
            }
            cr = next.r; cc = next.c;
        }
        await this.g.animateWallRemoval(removedWalls);
    }

    /* ─── Recursive Division ─── */
    async recursiveDivision() {
        const wallsToAdd = [];

        // Boundary walls
        for (let r = 0; r < this.g.rows; r++) {
            wallsToAdd.push({ r, c: 0 });
            wallsToAdd.push({ r, c: this.g.cols - 1 });
        }
        for (let c = 0; c < this.g.cols; c++) {
            wallsToAdd.push({ r: 0, c });
            wallsToAdd.push({ r: this.g.rows - 1, c });
        }

        const divide = (r, c, h, w) => {
            if (h <= 2 || w <= 2) return;
            const horizontal = h > w ? true : w > h ? false : Math.random() < 0.5;

            if (horizontal) {
                const wallR = r + 1 + Math.floor(Math.random() * Math.floor((h - 2) / 2)) * 2;
                const holeC = c + Math.floor(Math.random() * Math.floor(w / 2)) * 2 + 1;
                for (let i = c; i < c + w; i++) {
                    if (i !== holeC) wallsToAdd.push({ r: wallR, c: i });
                }
                divide(r, c, wallR - r, w);
                divide(wallR + 1, c, h - (wallR - r + 1), w);
            } else {
                const wallC = c + 1 + Math.floor(Math.random() * Math.floor((w - 2) / 2)) * 2;
                const holeR = r + Math.floor(Math.random() * Math.floor(h / 2)) * 2 + 1;
                for (let i = r; i < r + h; i++) {
                    if (i !== holeR) wallsToAdd.push({ r: i, c: wallC });
                }
                divide(r, c, h, wallC - c);
                divide(r, wallC + 1, h, w - (wallC - c + 1));
            }
        };

        divide(1, 1, this.g.rows - 2, this.g.cols - 2);
        this.g.clearBoard(true);
        await this.g.animateNodes(wallsToAdd, 'wall');
    }
}
