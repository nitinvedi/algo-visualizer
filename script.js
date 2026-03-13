document.addEventListener('DOMContentLoaded', () => {
    // ── Init core objects ──
    const grid      = new Grid('grid');
    const mazeGen   = new MazeGenerator(grid);
    const pathFinder = new PathFinder(grid);

    // ── Algorithm info database ──
    const ALGO_INFO = {
        // ── Maze generators ──
        'dfs': {
            icon: '🌀', title: 'Depth-First Search',
            description: 'Uses a stack to carve paths deep into the maze before backtracking. Produces long, winding corridors with a single solution — a classic "river" maze.',
            time: 'O(V + E)', space: 'O(V)', optimal: '—', complete: 'Yes',
            tip: '🎯 Great for mazes with long passages and dramatic twists.'
        },
        'kruskal': {
            icon: '🌐', title: "Kruskal's Algorithm",
            description: 'Randomly selects edges (walls) and removes them if the two cells belong to different sets, using Union-Find. Produces a uniform random spanning tree.',
            time: 'O(E log V)', space: 'O(V)', optimal: '—', complete: 'Yes',
            tip: '🌐 Produces highly varied, textured mazes with no obvious bias.'
        },
        'prim': {
            icon: '🌿', title: "Prim's Algorithm",
            description: 'Grows the maze outward from a start cell by randomly picking frontier edges. The result is a spanning tree that radiates outward from the origin.',
            time: 'O(E log V)', space: 'O(V)', optimal: '—', complete: 'Yes',
            tip: '🌿 Cells near the start tend to have more branches than cells far away.'
        },
        'wilson': {
            icon: '🚶', title: "Wilson's Algorithm",
            description: 'Performs loop-erased random walks until the path hits the existing maze, then adds it. Produces a perfectly uniform random spanning tree (UST).',
            time: 'O(V²)', space: 'O(V)', optimal: '—', complete: 'Yes',
            tip: '🎲 Slowest to generate, but produces statistically perfect mazes.'
        },
        'aldous-broder': {
            icon: '🎲', title: 'Aldous-Broder',
            description: 'Performs a pure random walk and carves out cells as it encounters unvisited ones. Also produces a uniform spanning tree, but is slower than Wilson\'s.',
            time: 'O(V log V)', space: 'O(V)', optimal: '—', complete: 'Yes',
            tip: '⚠️ Can be very slow on large grids due to random wandering.'
        },
        'recursive-division': {
            icon: '📐', title: 'Recursive Division',
            description: 'Starts with an open grid and adds walls, recursively dividing chambers with passages. Produces highly rectangular, room-like mazes.',
            time: 'O(V)', space: 'O(log V)', optimal: '—', complete: 'Yes',
            tip: '🏛️ Produces very structured mazes — great for dungeon-like layouts.'
        },

        // ── Path solvers ──
        'bfs': {
            icon: '🔵', title: 'Breadth-First Search',
            description: 'Explores neighbors level by level using a queue. Guaranteed to find the shortest path in an unweighted grid.',
            time: 'O(V + E)', space: 'O(V)', optimal: 'Yes', complete: 'Yes',
            tip: '✅ Gold standard for shortest-path on unweighted graphs.'
        },
        'bidirectional-bfs': {
            icon: '↔️', title: 'Bidirectional BFS',
            description: 'Simultaneously runs BFS from start and end. When the two frontiers meet, the path is combined. Visits far fewer nodes than standard BFS.',
            time: 'O(b^(d/2))', space: 'O(b^(d/2))', optimal: 'Yes', complete: 'Yes',
            tip: '🚀 Much faster than BFS in practice — watch the two fronts collide!'
        },
        'greedy': {
            icon: '⚡', title: 'Greedy Best-First',
            description: 'Always expands the node closest to the goal (by Manhattan distance). Very fast but NOT guaranteed to find the shortest path.',
            time: 'O(E log V)', space: 'O(V)', optimal: 'No', complete: 'No',
            tip: '⚡ Fastest search but can be fooled by dead-ends.'
        },
        'dijkstra': {
            icon: '🗺️', title: "Dijkstra's Algorithm",
            description: 'Visits nodes in order of their accumulated cost from the start. Equivalent to BFS on an unweighted graph. Guaranteed optimal.',
            time: 'O(E log V)', space: 'O(V)', optimal: 'Yes', complete: 'Yes',
            tip: '🗺️ On an unweighted grid it behaves identically to BFS.'
        },
        'astar': {
            icon: '⭐', title: 'A* Search',
            description: 'Combines Dijkstra\'s cost-based search with Greedy\'s heuristic. Uses f = g + h to pick the most promising node. Optimal and highly efficient.',
            time: 'O(E log V)', space: 'O(V)', optimal: 'Yes', complete: 'Yes',
            tip: '⭐ Best overall solver — fast AND guarantees shortest path.'
        },
    };

    // ── DOM references ──
    const btnGenerate  = document.getElementById('generate-maze-btn');
    const btnSolve     = document.getElementById('solve-maze-btn');
    const btnClearPath = document.getElementById('clear-path-btn');
    const btnClearBrd  = document.getElementById('clear-board-btn');
    const selMazeAlgo  = document.getElementById('maze-algorithm');
    const selPathAlgo  = document.getElementById('path-algorithm');
    const selSpeed     = document.getElementById('speed-selector');

    // Stats
    const statVisited = document.getElementById('stat-visited');
    const statPath    = document.getElementById('stat-path');
    const statTime    = document.getElementById('stat-time');
    const statAlgo    = document.getElementById('stat-algo');

    // Algo info panel
    const algoIcon        = document.getElementById('algo-icon');
    const algoTitle       = document.getElementById('algo-title');
    const algoDesc        = document.getElementById('algo-description');
    const algoTimeC       = document.getElementById('algo-time-complexity');
    const algoSpaceC      = document.getElementById('algo-space-complexity');
    const algoOptimal     = document.getElementById('algo-optimal');
    const algoComplete    = document.getElementById('algo-complete');
    const algoTip         = document.getElementById('algo-tip');

    // ── Utility: set controls disabled ──
    function setControlsDisabled(disabled) {
        [btnGenerate, btnSolve, btnClearPath, btnClearBrd,
         selMazeAlgo, selPathAlgo, selSpeed].forEach(el => el.disabled = disabled);
    }

    // ── Update algo info panel ──
    function updateAlgoInfo(key) {
        const info = ALGO_INFO[key];
        if (!info) return;
        algoIcon.textContent       = info.icon;
        algoTitle.textContent      = info.title;
        algoDesc.textContent       = info.description;
        algoTimeC.textContent      = info.time;
        algoSpaceC.textContent     = info.space;
        algoOptimal.textContent    = info.optimal;
        algoComplete.textContent   = info.complete;
        algoTip.textContent        = info.tip || '';

        // Animate panel update
        const panel = document.getElementById('algo-info');
        panel.classList.add('panel-flash');
        setTimeout(() => panel.classList.remove('panel-flash'), 400);
    }

    // ── Animate stat value with counter ──
    function animateStat(el, target, suffix = '') {
        const start = 0;
        const duration = 600;
        const t0 = performance.now();
        const step = () => {
            const p = Math.min((performance.now() - t0) / duration, 1);
            el.textContent = Math.round(start + (target - start) * p) + suffix;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    function updateStats(stats, algoName) {
        animateStat(statVisited, stats.visited);
        animateStat(statPath, stats.pathLength);
        animateStat(statTime, stats.timeMs, 'ms');
        statAlgo.textContent = algoName;
        document.getElementById('stats-panel').classList.add('stats-updated');
        setTimeout(() => document.getElementById('stats-panel').classList.remove('stats-updated'), 600);
    }

    // ── Event: Generate Maze ──
    btnGenerate.addEventListener('click', async () => {
        if (grid.isAnimating) return;
        const algo = selMazeAlgo.value;
        updateAlgoInfo(algo);
        setControlsDisabled(true);
        try {
            await mazeGen.generate(algo);
        } catch (e) {
            console.error(e);
        } finally {
            setControlsDisabled(false);
        }
    });

    // ── Event: Solve ──
    btnSolve.addEventListener('click', async () => {
        if (grid.isAnimating) return;
        const algo = selPathAlgo.value;
        updateAlgoInfo(algo);
        setControlsDisabled(true);
        try {
            const stats = await pathFinder.solve(algo);
            if (stats) {
                const algoName = ALGO_INFO[algo]?.title || algo;
                updateStats(stats, algoName);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setControlsDisabled(false);
        }
    });

    // ── Event: Clear Path ──
    btnClearPath.addEventListener('click', () => {
        if (!grid.isAnimating) {
            grid.clearPath();
            [statVisited, statPath, statTime, statAlgo].forEach(el => el.textContent = '—');
        }
    });

    // ── Event: Clear Board ──
    btnClearBrd.addEventListener('click', () => {
        if (!grid.isAnimating) {
            grid.clearBoard();
            [statVisited, statPath, statTime, statAlgo].forEach(el => el.textContent = '—');
        }
    });

    // ── Event: Speed ──
    selSpeed.addEventListener('change', e => grid.setSpeed(e.target.value));

    // ── Event: Algo selects → update info panel ──
    selMazeAlgo.addEventListener('change', e => updateAlgoInfo(e.target.value));
    selPathAlgo.addEventListener('change', e => updateAlgoInfo(e.target.value));

    // ── Themes ──
    const themeButtons = document.querySelectorAll('.theme-btn');
    const THEME_KEY = 'amaze-theme';

    function applyTheme(theme) {
        document.body.className = theme;
        themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
        localStorage.setItem(THEME_KEY, theme);
    }

    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });

    // Restore saved theme
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) applyTheme(savedTheme);

    // ── Initial info panel ──
    updateAlgoInfo('dfs');
});
