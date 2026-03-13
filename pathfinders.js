class PathFinder {
    constructor(gridObject) {
        this.g = gridObject;
        this.lastStats = { visited: 0, pathLength: 0, timeMs: 0 };
    }

    async solve(algorithm) {
        if (this.g.isAnimating) return null;
        this.g.isAnimating = true;
        this.g.clearPath(true);

        const t0 = performance.now();
        let result = { visitedNodesInOrder: [], nodesInShortestPathOrder: [] };

        try {
            const solvers = {
                'bfs': this.bfs.bind(this),
                'bidirectional-bfs': this.bidirectionalBfs.bind(this),
                'greedy': this.greedy.bind(this),
                'dijkstra': this.dijkstra.bind(this),
                'astar': this.astar.bind(this),
            };
            const fn = solvers[algorithm];
            if (fn) result = await fn();

            if (result.visitedNodesInOrder.length > 0)
                await this.g.animateNodes(result.visitedNodesInOrder, 'visited');
            if (result.nodesInShortestPathOrder.length > 0)
                await this.g.animateNodes(result.nodesInShortestPathOrder, 'path');
        } catch (err) {
            console.error('Pathfinder error:', err);
        } finally {
            this.g.isAnimating = false;
        }

        this.lastStats = {
            visited: result.visitedNodesInOrder.length,
            pathLength: result.nodesInShortestPathOrder.length,
            timeMs: Math.round(performance.now() - t0),
        };
        return this.lastStats;
    }

    manhattan(a, b) {
        return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
    }

    getNeighbors(node) {
        const { r, c } = node;
        const result = [];
        if (r > 0)              result.push(this.g.cells[r - 1][c]);
        if (r < this.g.rows-1)  result.push(this.g.cells[r + 1][c]);
        if (c > 0)              result.push(this.g.cells[r][c - 1]);
        if (c < this.g.cols-1)  result.push(this.g.cells[r][c + 1]);
        return result.filter(n => !n.isWall || n.isEnd);
    }

    reconstructPath(endNode, cameFrom) {
        const path = [];
        let cur = `${endNode.r},${endNode.c}`;
        while (cameFrom.has(cur)) {
            const prev = cameFrom.get(cur);
            path.unshift(prev);
            cur = `${prev.r},${prev.c}`;
        }
        if (path.length > 0) path.shift(); // remove start
        return path;
    }

    /* ─── BFS ─── */
    async bfs() {
        const start = this.g.cells[this.g.startNode.r][this.g.startNode.c];
        const end   = this.g.cells[this.g.endNode.r][this.g.endNode.c];
        const visited = new Set([`${start.r},${start.c}`]);
        const cameFrom = new Map();
        const queue = [start];
        const visitedOrder = [];

        while (queue.length > 0) {
            const cur = queue.shift();
            if (cur.r === end.r && cur.c === end.c)
                return { visitedNodesInOrder: visitedOrder, nodesInShortestPathOrder: this.reconstructPath(end, cameFrom) };
            if (cur !== start && cur !== end) visitedOrder.push({ r: cur.r, c: cur.c });

            for (const nb of this.getNeighbors(cur)) {
                const k = `${nb.r},${nb.c}`;
                if (!visited.has(k)) {
                    visited.add(k);
                    cameFrom.set(k, { r: cur.r, c: cur.c });
                    queue.push(nb);
                }
            }
        }
        return { visitedNodesInOrder: visitedOrder, nodesInShortestPathOrder: [] };
    }

    /* ─── Bidirectional BFS ─── */
    async bidirectionalBfs() {
        const start = this.g.cells[this.g.startNode.r][this.g.startNode.c];
        const end   = this.g.cells[this.g.endNode.r][this.g.endNode.c];
        const visitedOrder = [];

        const visitedS = new Set([`${start.r},${start.c}`]);
        const visitedE = new Set([`${end.r},${end.c}`]);
        const parentS = new Map(), parentE = new Map();
        let qS = [start], qE = [end];
        let meetNode = null;

        while (qS.length > 0 && qE.length > 0 && !meetNode) {
            const cs = qS.shift();
            const ks = `${cs.r},${cs.c}`;
            if (cs !== start && cs !== end) visitedOrder.push({ r: cs.r, c: cs.c });
            if (visitedE.has(ks)) { meetNode = cs; break; }
            for (const nb of this.getNeighbors(cs)) {
                const k = `${nb.r},${nb.c}`;
                if (!visitedS.has(k)) { visitedS.add(k); parentS.set(k, { r: cs.r, c: cs.c }); qS.push(nb); }
            }

            const ce = qE.shift();
            const ke = `${ce.r},${ce.c}`;
            if (ce !== start && ce !== end) visitedOrder.push({ r: ce.r, c: ce.c });
            if (visitedS.has(ke)) { meetNode = ce; break; }
            for (const nb of this.getNeighbors(ce)) {
                const k = `${nb.r},${nb.c}`;
                if (!visitedE.has(k)) { visitedE.add(k); parentE.set(k, { r: ce.r, c: ce.c }); qE.push(nb); }
            }
        }

        if (meetNode) {
            const pathS = this.reconstructPath(meetNode, parentS);
            const pathE = this.reconstructPath(meetNode, parentE).reverse();
            const full = [...pathS, { r: meetNode.r, c: meetNode.c }, ...pathE]
                .filter(n => !(n.r === start.r && n.c === start.c) && !(n.r === end.r && n.c === end.c));
            return { visitedNodesInOrder: visitedOrder, nodesInShortestPathOrder: full };
        }
        return { visitedNodesInOrder: visitedOrder, nodesInShortestPathOrder: [] };
    }

    /* ─── Shared heuristic search (Dijkstra / Greedy / A*) ─── */
    async heuristicSearch(isAStar, isGreedy) {
        const start = this.g.cells[this.g.startNode.r][this.g.startNode.c];
        const end   = this.g.cells[this.g.endNode.r][this.g.endNode.c];
        const visitedOrder = [];
        const dists = new Map([[`${start.r},${start.c}`, 0]]);
        const cameFrom = new Map();
        const open = [{ node: start, dist: 0, f: 0 }];

        while (open.length > 0) {
            open.sort((a, b) => a.f - b.f);
            const { node: cur } = open.shift();
            const ck = `${cur.r},${cur.c}`;

            if (cur.r === end.r && cur.c === end.c)
                return { visitedNodesInOrder: visitedOrder, nodesInShortestPathOrder: this.reconstructPath(end, cameFrom) };
            if (cur !== start) visitedOrder.push({ r: cur.r, c: cur.c });

            for (const nb of this.getNeighbors(cur)) {
                const nk = `${nb.r},${nb.c}`;
                const g = dists.get(ck) + 1;
                if (!dists.has(nk) || g < dists.get(nk)) {
                    dists.set(nk, g);
                    cameFrom.set(nk, { r: cur.r, c: cur.c });
                    const h = this.manhattan({ r: nb.r, c: nb.c }, { r: end.r, c: end.c });
                    const f = isGreedy ? h : isAStar ? g + h : g;
                    const ex = open.find(x => x.node === nb);
                    if (ex) { ex.f = f; ex.dist = g; }
                    else open.push({ node: nb, dist: g, f });
                }
            }
        }
        return { visitedNodesInOrder: visitedOrder, nodesInShortestPathOrder: [] };
    }

    async dijkstra() { return this.heuristicSearch(false, false); }
    async greedy()   { return this.heuristicSearch(false, true);  }
    async astar()    { return this.heuristicSearch(true,  false); }
}
