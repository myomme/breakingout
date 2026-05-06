export class HistoryStack {
  constructor(initialState) {
    this.undoStack = [clone(initialState)];
    this.redoStack = [];
  }

  push(state) {
    this.undoStack.push(clone(state));
    this.redoStack = [];
  }

  undo(currentState) {
    if (this.undoStack.length <= 1) {
      return currentState;
    }

    const current = this.undoStack.pop();
    this.redoStack.push(current);
    return clone(this.undoStack[this.undoStack.length - 1]);
  }

  redo(currentState) {
    if (this.redoStack.length === 0) {
      return currentState;
    }

    const next = this.redoStack.pop();
    this.undoStack.push(clone(next));
    return clone(next);
  }

  reset(state) {
    this.undoStack = [clone(state)];
    this.redoStack = [];
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
