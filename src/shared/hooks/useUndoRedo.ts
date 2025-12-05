import { useState, useCallback, useRef } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * Custom hook for undo/redo functionality
 * 
 * @param initialState - Initial state value
 * @param maxHistorySize - Maximum number of history entries (default: 50)
 * @returns Object with state, setState, undo, redo, canUndo, canRedo, and clearHistory
 */
export function useUndoRedo<T>(
  initialState: T,
  maxHistorySize: number = 50
) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback(
    (newState: T | ((prev: T) => T), recordHistory: boolean = true) => {
      if (!recordHistory) {
        // Direct update without recording history (used for undo/redo)
        setHistory(prev => ({
          ...prev,
          present: typeof newState === 'function' ? (newState as (prev: T) => T)(prev.present) : newState,
        }));
        return;
      }

      setHistory(prev => {
        const nextPresent = typeof newState === 'function' 
          ? (newState as (prev: T) => T)(prev.present) 
          : newState;

        // Don't record if state hasn't changed
        if (nextPresent === prev.present) {
          return prev;
        }

        const newPast = [...prev.past, prev.present];
        // Limit history size
        const trimmedPast = newPast.slice(-maxHistorySize);

        return {
          past: trimmedPast,
          present: nextPresent,
          future: [], // Clear future when new change is made
        };
      });
    },
    [maxHistorySize]
  );

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory(prev => ({
      past: [],
      present: prev.present,
      future: [],
    }));
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
}

