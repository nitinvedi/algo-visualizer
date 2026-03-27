# Amaze — Maze Generation & Solving Visualizer

Website: https://nitinvedi.github.io/algo-visualizer/

An interactive web-based visualizer for maze generation and pathfinding algorithms, built with vanilla HTML, CSS, and JavaScript.

## ✨ Features
- **6 Maze Generation Algorithms:** DFS, Kruskal's, Prim's, Wilson's, Aldous-Broder, Recursive Division
- **5 Pathfinding Algorithms:** BFS, Bidirectional BFS, Greedy Best-First, Dijkstra's, A*
- **Live Stats Panel:** Nodes visited, path length, and solve time
- **Algorithm Info Panel:** Real-time descriptions and Big-O complexity for every algorithm
- **4 Themes:** Dark, Cyberpunk, Matrix, Light
- **Interactive Grid:** Drag to draw/erase walls, drag start/end nodes

## 🚀 Run Locally

```bash
# Using http-server (recommended)
npx http-server .

# Then open: http://localhost:8080
```

## 🌐 Deploy to GitHub Pages

1. **Create a GitHub repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Amaze visualizer"
   git remote add origin https://github.com/YOUR_USERNAME/amaze.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repo → **Settings** → **Pages**
   - Under *Source*, select **Deploy from a branch**
   - Select **main** branch, **/ (root)** folder
   - Click **Save**

3. **Access your live site**
   - Wait ~60 seconds, then visit:
   ```
   https://YOUR_USERNAME.github.io/amaze/
   ```

## 🌐 Deploy to Vercel (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel

# Your site will be live at: https://amaze.vercel.app (or similar)
```

## 📁 Project Structure

```
algo-visualizer/
├── index.html          # Main HTML layout
├── style.css           # All themes & animations
├── grid.js             # Grid class (cell management, animations)
├── maze-generators.js  # All 6 maze algorithms
├── pathfinders.js      # All 5 pathfinding algorithms
└── script.js           # Event handling, stats, themes, algo info
```

## 🧠 Algorithm Complexity Reference

| Algorithm          | Type     | Time       | Space  | Optimal |
|--------------------|----------|------------|--------|---------|
| DFS                | Maze     | O(V+E)     | O(V)   | —       |
| Kruskal's          | Maze     | O(E log V) | O(V)   | —       |
| Prim's             | Maze     | O(E log V) | O(V)   | —       |
| Wilson's           | Maze     | O(V²)      | O(V)   | —       |
| Aldous-Broder      | Maze     | O(V log V) | O(V)   | —       |
| Recursive Division | Maze     | O(V)       | O(log V)| —      |
| BFS                | Solver   | O(V+E)     | O(V)   | ✅ Yes  |
| Bidirectional BFS  | Solver   | O(b^(d/2)) | O(b^d/2)| ✅ Yes |
| Greedy Best-First  | Solver   | O(E log V) | O(V)   | ❌ No   |
| Dijkstra's         | Solver   | O(E log V) | O(V)   | ✅ Yes  |
| A\*                | Solver   | O(E log V) | O(V)   | ✅ Yes  |
