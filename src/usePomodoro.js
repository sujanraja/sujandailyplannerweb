// src/usePomodoro.js - FINAL VERSION (NO AUDIO, AUTO BROWSER OPEN)

import { useRef, useState, useEffect } from 'react';

export const usePomodoro = (setTasks) => {
  const pomodoroRefs = useRef({});
  const [pomodoroState, setPomodoroState] = useState({});

  // ===== TIMINGS =====
  const PROD_WORK_MS = 1 * 60 * 1000;
  const PROD_REST_MS = 1 * 60 * 1000;

  const WORK_TEST_MS = null; 
  const REST_TEST_MS = null;

  const getWorkMs = () => WORK_TEST_MS || PROD_WORK_MS;
  const getRestMs = () => REST_TEST_MS || PROD_REST_MS;

  // ===== HELPERS =====
  const calculateRemaining = (startTime, duration) =>
    Math.max(0, duration - (Date.now() - startTime));

  // 🔔 WINDOWS NOTIFICATION
  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        silent: true
      });
    }
  };

  // 🌐 OPEN BROWSER TAB
  const openBrowserTab = () => {
    window.open('https://sujanraja.github.io/sujandailyplannerfinal/','PomodoroTab');
  };

  // =========================
  // ===== WORK SESSION =====
  // =========================
  const startPomodoro = (task) => {
    const id = task.id;
    const durationMinutes = Number(task.duration) || 0;
    const totalCycles = Math.max(1, Math.ceil(durationMinutes / 30));
    const workMs = getWorkMs();

    clearInterval(pomodoroRefs.current[id]?.interval);

    const startTime = Date.now();

    setPomodoroState((p) => ({
      ...p,
      [id]: {
        running: true,
        phase: 'work',
        currentCycle: 1,
        totalCycles,
        startTime,
        duration: workMs,
        remainingMs: workMs,
      },
    }));

    pomodoroRefs.current[id] = {
      interval: setInterval(() => {
        setPomodoroState((prev) => {
          const s = prev[id];
          if (!s || !s.running) return prev;

          const remaining = calculateRemaining(s.startTime, s.duration);

          if (remaining <= 0) {
            clearInterval(pomodoroRefs.current[id].interval);

            showNotification(
              '🎯 Focus Session Complete!',
              'Time for a break. Great work!'
            );

            openBrowserTab();

            return {
              ...prev,
              [id]: { ...s, running: false, phase: 'restReady', remainingMs: 0 },
            };
          }

          return { ...prev, [id]: { ...s, remainingMs: remaining } };
        });
      }, 1000),
    };
  };

  // =========================
  // ===== REST SESSION =====
  // =========================
  const startRest = (task) => {
    const id = task.id;
    const restMs = getRestMs();
    const startTime = Date.now();

    setPomodoroState((p) => ({
      ...p,
      [id]: {
        ...p[id],
        running: true,
        phase: 'rest',
        startTime,
        duration: restMs,
        remainingMs: restMs,
      },
    }));

    pomodoroRefs.current[id] = {
      interval: setInterval(() => {
        setPomodoroState((prev) => {
          const s = prev[id];
          if (!s || !s.running) return prev;

          const remaining = calculateRemaining(s.startTime, s.duration);

          if (remaining <= 0) {
            clearInterval(pomodoroRefs.current[id].interval);

            showNotification(
              '☕ Break Time Over!',
              'Ready to focus again?'
            );

            openBrowserTab();

            const nextCycle = s.currentCycle + 1;
            const done = nextCycle > s.totalCycles;

            return {
              ...prev,
              [id]: {
                ...s,
                running: false,
                phase: done ? 'done' : 'nextReady',
                currentCycle: done ? s.currentCycle : nextCycle,
                remainingMs: 0,
              },
            };
          }

          return { ...prev, [id]: { ...s, remainingMs: remaining } };
        });
      }, 1000),
    };
  };

  // =========================
  // ===== NEXT CYCLE =====
  // =========================
  const nextCycleStart = (task) => {
    const id = task.id;
    const workMs = getWorkMs();
    const startTime = Date.now();

    setPomodoroState((p) => ({
      ...p,
      [id]: {
        ...p[id],
        running: true,
        phase: 'work',
        startTime,
        duration: workMs,
        remainingMs: workMs,
      },
    }));

    pomodoroRefs.current[id] = {
      interval: setInterval(() => {
        setPomodoroState((prev) => {
          const s = prev[id];
          if (!s || !s.running) return prev;

          const remaining = calculateRemaining(s.startTime, s.duration);

          if (remaining <= 0) {
            clearInterval(pomodoroRefs.current[id].interval);

            showNotification(
              '🎯 Focus Session Complete!',
              'Cycle finished!'
            );

            openBrowserTab();

            if (s.currentCycle >= s.totalCycles) {
              setTasks((t) =>
                t.map((x) =>
                  x.id === id ? { ...x, completed: true } : x
                )
              );

              showNotification(
                '🎉 All Cycles Complete!',
                'Great job! Task completed successfully.'
              );

              return {
                ...prev,
                [id]: { ...s, phase: 'done', running: false },
              };
            }

            return {
              ...prev,
              [id]: { ...s, phase: 'restReady', running: false },
            };
          }

          return { ...prev, [id]: { ...s, remainingMs: remaining } };
        });
      }, 1000),
    };
  };

  const stopPomodoro = (id) => {
    clearInterval(pomodoroRefs.current[id]?.interval);
    setPomodoroState((p) => ({
      ...p,
      [id]: { ...p[id], running: false },
    }));
  };

  const resetPomodoro = (id) => {
    clearInterval(pomodoroRefs.current[id]?.interval);
    setPomodoroState((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
  };

  const forceRestartPomodoro = (id) => {
    clearInterval(pomodoroRefs.current[id]?.interval);
    setPomodoroState((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
  };

  useEffect(() => () => {
    Object.values(pomodoroRefs.current).forEach((r) =>
      clearInterval(r.interval)
    );
  }, []);

  const msToMMSS = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(
      s % 60
    ).padStart(2, '0')}`;
  };

  return {
    pomodoroState,
    startPomodoro,
    startRest,
    nextCycleStart,
    stopPomodoro,
    resetPomodoro,
    forceRestartPomodoro,
    msToMMSS,
  };
};
