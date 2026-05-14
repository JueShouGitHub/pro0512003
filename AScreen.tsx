import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';

// ─── World ────────────────────────────────────────────────────────────────────
const W = 320;
const H = 480;
const BASKET_W = 70;
const BASKET_H = 40;
const BASKET_Y = H - BASKET_H - 10;
const BASKET_SPEED = 28;
const ITEM_SIZE = 36;
const TICK_MS = 40;
const SPAWN_INTERVAL = 6; // ticks

// ─── Items ────────────────────────────────────────────────────────────────────
const FRUITS = ['🍎', '🍌', '🍇', '🍓', '🥝', '🍑', '🍒', '🥭', '🍍', '🍊'];
const BOMBS  = ['💣', '🔴'];

interface FallingItem {
  id: number;
  x: number;
  y: number;
  emoji: string;
  isBomb: boolean;
  speed: number;
}

interface GameState {
  items: FallingItem[];
  basketX: number;
  score: number;
  lives: number;
  level: number;
  phase: 'idle' | 'playing' | 'over';
  best: number;
  tick: number;
  nextId: number;
}

// ─── Fresh state ──────────────────────────────────────────────────────────────
const fresh = (best = 0): GameState => ({
  items: [],
  basketX: W / 2 - BASKET_W / 2,
  score: 0,
  lives: 3,
  level: 1,
  phase: 'idle',
  best,
  tick: 0,
  nextId: 0,
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function FruitCatcherGame() {
  const [game, setGame] = useState<GameState>(fresh());
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  const stopLoop = () => { if (loopRef.current) clearInterval(loopRef.current); };
  useEffect(() => () => stopLoop(), []);

  const tick = useCallback(() => {
    setGame(prev => {
      if (prev.phase !== 'playing') return prev;

      const tickNum = prev.tick + 1;
      const level = Math.min(10, 1 + Math.floor(prev.score / 50));
      const baseSpeed = 3 + level * 0.6;

      // Spawn new item
      let { items, nextId } = prev;
      if (tickNum % SPAWN_INTERVAL === 0) {
        const isBomb = Math.random() < 0.18;
        const emoji = isBomb
          ? BOMBS[Math.floor(Math.random() * BOMBS.length)]
          : FRUITS[Math.floor(Math.random() * FRUITS.length)];
        const newItem: FallingItem = {
          id: nextId,
          x: Math.random() * (W - ITEM_SIZE),
          y: -ITEM_SIZE,
          emoji,
          isBomb,
          speed: baseSpeed + Math.random() * 1.5,
        };
        items = [...items, newItem];
        nextId++;
      }

      // Move items
      const basketX = prev.basketX;
      let score = prev.score;
      let lives = prev.lives;
      const survived: FallingItem[] = [];

      for (const item of items) {
        const ny = item.y + item.speed;

        // Check catch
        const caught =
          ny + ITEM_SIZE >= BASKET_Y &&
          ny <= BASKET_Y + BASKET_H &&
          item.x + ITEM_SIZE > basketX &&
          item.x < basketX + BASKET_W;

        if (caught) {
          if (item.isBomb) {
            lives -= 1;
          } else {
            score += 5 + level;
          }
          continue; // remove from items
        }

        // Missed (fell below)
        if (ny > H) {
          if (!item.isBomb) lives -= 1;
          continue;
        }

        survived.push({ ...item, y: ny });
      }

      if (lives <= 0) {
        stopLoop();
        return { ...prev, items: survived, score, lives: 0, phase: 'over', best: Math.max(prev.best, score), tick: tickNum, nextId };
      }

      return { ...prev, items: survived, score, lives, level, tick: tickNum, nextId };
    });
  }, []);

  const startGame = () => {
    stopLoop();
    setGame(p => ({ ...fresh(p.best), phase: 'playing' }));
    loopRef.current = setInterval(tick, TICK_MS);
  };

  const move = useCallback((dir: -1 | 1) => {
    setGame(p => {
      if (p.phase !== 'playing') return p;
      const basketX = Math.max(0, Math.min(W - BASKET_W, p.basketX + dir * BASKET_SPEED));
      return { ...p, basketX };
    });
  }, []);

  const { items, basketX, score, lives, level, phase, best } = game;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>🍎 Fruit Catcher</Text>

        {/* HUD */}
        <View style={s.hud}>
          <Text style={s.hudItem}><Text style={{ color: '#2ecc71' }}>Score </Text>{score}</Text>
          <Text style={s.hudItem}><Text style={{ color: '#3d9bff' }}>Lv </Text>{level}</Text>
          <Text style={s.hudItem}>{'❤️'.repeat(lives)}</Text>
          <Text style={s.hudItem}><Text style={{ color: '#f5c542' }}>Best </Text>{best}</Text>
        </View>

        {/* Canvas */}
        <View style={s.canvas}>
          {/* Falling items */}
          {items.map(item => (
            <Text
              key={item.id}
              style={[s.fallingItem, { left: item.x, top: item.y }]}
            >
              {item.emoji}
            </Text>
          ))}

          {/* Basket */}
          <View style={[s.basket, { left: basketX, top: BASKET_Y }]}>
            <Text style={s.basketEmoji}>🧺</Text>
          </View>

          {/* Overlay */}
          {phase !== 'playing' && (
            <View style={s.overlay}>
              {phase === 'over' && (
                <Text style={[s.overlayTitle, { color: '#e74c8b' }]}>Game Over!</Text>
              )}
              {phase === 'over' && (
                <Text style={s.overlayScore}>Score: {score}</Text>
              )}
              {phase === 'idle' && (
                <Text style={s.overlayTitle}>Catch Fruits, Avoid Bombs!</Text>
              )}
              <TouchableOpacity style={s.overlayBtn} onPress={startGame} activeOpacity={0.7}>
                <Text style={s.overlayBtnText}>
                  {phase === 'over' ? '↺ Play Again' : '▶ Start Game'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={s.controls}>
          <TouchableOpacity
            style={s.moveBtn}
            onPress={() => move(-1)}
            activeOpacity={0.6}
          >
            <Text style={s.moveBtnText}>◀◀ Left</Text>
          </TouchableOpacity>
          <Text style={s.hint}>💣 Bomb -1 Life</Text>
          <TouchableOpacity
            style={s.moveBtn}
            onPress={() => move(1)}
            activeOpacity={0.6}
          >
            <Text style={s.moveBtnText}>Right ▶▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0b16' },
  container: { flex: 1, alignItems: 'center', paddingTop: 12 },
  title: { fontSize: 20, color: '#2ecc71', fontWeight: 'bold', letterSpacing: 3, marginBottom: 8 },
  hud: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  hudItem: { color: '#d0d0f0', fontFamily: 'monospace', fontSize: 13 },
  canvas: {
    width: W, height: H,
    backgroundColor: '#0a0a1e',
    borderWidth: 2, borderColor: '#2d2d5a',
    borderRadius: 8, overflow: 'hidden',
    position: 'relative',
  },
  fallingItem: {
    position: 'absolute',
    fontSize: ITEM_SIZE - 4,
    textAlign: 'center',
  },
  basket: {
    position: 'absolute',
    width: BASKET_W, height: BASKET_H,
    alignItems: 'center', justifyContent: 'center',
  },
  basketEmoji: { fontSize: 38 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#00000099',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  overlayTitle: {
    color: '#f5c542', fontSize: 22,
    fontWeight: 'bold', fontFamily: 'monospace',
  },
  overlayScore: { color: '#d0d0f0', fontFamily: 'monospace', fontSize: 18 },
  overlayBtn: {
    borderWidth: 1.5, borderColor: '#2ecc71', borderRadius: 10,
    paddingHorizontal: 28, paddingVertical: 10, marginTop: 8,
  },
  overlayBtnText: { color: '#2ecc71', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 16 },
  controls: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginTop: 12,
  },
  moveBtn: {
    width: 90, height: 48,
    borderWidth: 1.5, borderColor: '#3d9bff',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  moveBtnText: { color: '#3d9bff', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 14 },
  hint: { color: '#555577', fontFamily: 'monospace', fontSize: 11 },
});