require('mocha');
const assert = require('assert');
const {anchor, Slot, Tab, None, Canvas, painters, generators, Puzzle} = require('../src/index');

// @ts-ignore
HTMLImageElement = function(){};

describe("Canvas", () => {
  const painter = new painters.Dummy();

  it("can create a single-piece puzzle", () => {
    const canvas = new Canvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'black',
      painter: painter
    })

    canvas.sketchPiece({
      structure: {right: Tab, down: Tab, left: Slot},
      metadata: {
        id: 'a',
        currentPosition: {x: 50, y: 50},
        color: 'red'
      }
    });

    canvas.draw();

    assert.equal(canvas['__nullLayer__'].figures, 1);
    assert.equal(canvas['__nullLayer__'].drawn, true);

    assert.equal(!!canvas.figures[1], false);
    assert.equal(!!canvas.figures['a'], true);

    assert.equal(canvas.puzzle.pieces.length, 1);
    assert.deepEqual(canvas.puzzle.head.centralAnchor, {x: 50, y: 50});

  })

  it("can create a single-piece puzzle with no current nor target positions", () => {
    const canvas = new Canvas('canvas', {
      width: 800, height: 800,
      painter: painter
    })

    canvas.sketchPiece({
      structure: '----',
      metadata: { id: 'a' }
    });

    canvas.draw();

    const head = canvas.puzzle.head;

    assert.deepEqual(head.metadata.targetPosition, {x: 0, y: 0});
    assert.deepEqual(head.metadata.currentPosition, head.metadata.targetPosition);
    assert.notEqual(head.metadata.currentPosition, head.metadata.targetPosition);
  })

  it("can create a single-piece puzzle with no current but target positions", () => {
    const canvas = new Canvas('canvas', {
      width: 800, height: 800,
      painter: painter
    })

    canvas.sketchPiece({
      structure: '----',
      metadata: {
        id: 'a',
        targetPosition: {x: 10, y: 15 }
      }
    });

    canvas.draw();

    const head = canvas.puzzle.head;

    assert.deepEqual(head.metadata.targetPosition, {x: 10, y: 15});
    assert.deepEqual(head.metadata.currentPosition, head.metadata.targetPosition);
    assert.notEqual(head.metadata.currentPosition, head.metadata.targetPosition);
  })


  it("can create a single-piece puzzle with strings", () => {
    const canvas = new Canvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'black',
      painter: painter
    })

    canvas.sketchPiece({
      structure: "STS-",
      metadata: {
        id: 'a',
        currentPosition: {x: 50, y: 50},
        color: 'red'
      }
    });

    canvas.draw();

    assert.equal(canvas['__nullLayer__'].figures, 1);
    assert.equal(canvas['__nullLayer__'].drawn, true);

    assert.equal(!!canvas.figures[1], false);
    assert.equal(!!canvas.figures['a'], true);

    const [piece] = canvas.puzzle.pieces;

    assert.equal(piece.right, Slot);
    assert.equal(piece.down, Tab);
    assert.equal(piece.left, Slot);
    assert.equal(piece.up, None);

  })


  it("can create an autogenerated puzzle", () => {
    const canvas = new Canvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'red',
      painter: painter
    });

    canvas.autogenerate({
      verticalPiecesCount: 4,
      horizontalPiecesCount: 4,
      insertsGenerator: generators.flipflop,
    });
    canvas.shuffle(0.7);
    canvas.draw();

    assert.equal(canvas['__nullLayer__'].figures, 16);
    assert.equal(canvas['__nullLayer__'].drawn, true);

    assert.equal(!!canvas.figures[0], false);
    assert.equal(!!canvas.figures[1], true);
    assert.equal(!!canvas.figures[16], true);
    assert.equal(!!canvas.figures[17], false);

    assert.equal(canvas.puzzle.pieces.length, 16);
  })

  it("can clear canvas", () => {
    const canvas = new Canvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'red',
      painter: painter
    });

    canvas.autogenerate();
    canvas.draw();
    canvas.clear();

    assert.equal(canvas._painter, painter);
    assert.equal(canvas._puzzle, null);
    assert.equal(canvas.puzzle.pieces.length, 0);
    assert.deepEqual(canvas.figures, {});
  })

  it("can sketch a whole puzzle", () => {
    const canvas = new Canvas('canvas', {
      width: 800, height: 800,
      painter: painter
    });
    const puzzle = new Puzzle({pieceSize: 13, proximity: 7});
    puzzle
      .newPiece({right: Tab})
      .placeAt(anchor(0, 0));
    puzzle
      .newPiece({left: Slot, right: Tab})
      .placeAt(anchor(3, 0));

    canvas.renderPuzzle(puzzle);
    canvas.draw();

    assert.equal(canvas['__nullLayer__'].figures, 2);
    assert.equal(canvas['__nullLayer__'].drawn, true);

    assert.equal(canvas.pieceSize, 26);
    assert.equal(canvas.proximity, 14);
  })


  it("can create an autogenerated puzzle with metadata list", () => {
    const canvas = new Canvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'red',
      painter: painter
    });

    canvas.autogenerate({
      verticalPiecesCount: 2,
      horizontalPiecesCount: 2,
      metadata: [{label:{text: 'a'}}, {label:{text: 'b'}}, {label:{text: 'c'}}, {label:{text: 'd'}}]
    });
    canvas.draw();

    assert.equal(canvas.puzzle.pieces[0].metadata.label.text, 'a');
    assert.equal(canvas.puzzle.pieces[1].metadata.label.text, 'b');
    assert.equal(canvas.puzzle.pieces[2].metadata.label.text, 'c');
    assert.equal(canvas.puzzle.pieces[3].metadata.label.text, 'd');
  })


  it("can listen to connect events with figures", (done) => {
    const canvas = new Canvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'red',
      painter: painter
    });

    canvas.autogenerate({
      verticalPiecesCount: 2,
      horizontalPiecesCount: 2,
      insertsGenerator: generators.flipflop
    });
    canvas.draw();

    assert.equal(canvas['__nullLayer__'].figures, 4);
    assert.equal(canvas['__nullLayer__'].drawn, true);

    const [first, second] = canvas.puzzle.pieces;

    canvas.onConnect((piece, figure, target, targetFigure) => {
      assert.equal(canvas.getFigure(piece), figure);
      assert.equal(first, piece);

      assert.equal(canvas.getFigure(target), targetFigure);
      assert.equal(second, target);
      done();
    })

    first.disconnect();
    first.connectHorizontallyWith(second);
  })

  it("can listen to disconnect events with figures", (done) => {
    const canvas = new Canvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'red',
      painter: painter
    });

    canvas.autogenerate({
      verticalPiecesCount: 1,
      horizontalPiecesCount: 2,
      insertsGenerator: generators.flipflop
    });
    canvas.draw();

    assert.equal(canvas['__nullLayer__'].figures, 2);
    assert.equal(canvas['__nullLayer__'].drawn, true);

    const [first, second] = canvas.puzzle.pieces;

    canvas.onDisconnect((piece, figure) => {
      assert.equal(canvas.getFigure(piece), figure);
      assert.equal(first, piece);
      done();
    })

    first.connectHorizontallyWith(second);
    first.disconnect();
  })

  it("can listen to multiple disconnect events with figures", (done) => {
    const canvas = new Canvas('canvas', {
      width: 800, height: 800,
      pieceSize: 100, proximity: 20,
      borderFill: 10, strokeWidth: 2,
      lineSoftness: 0.12, strokeColor: 'red',
      painter: painter
    });

    canvas.autogenerate({
      verticalPiecesCount: 3,
      horizontalPiecesCount: 3,
      insertsGenerator: generators.flipflop
    });
    canvas.draw();

    assert.equal(canvas['__nullLayer__'].figures, 9);
    assert.equal(canvas['__nullLayer__'].drawn, true);

    const center = canvas.puzzle.pieces[4];

    let count = 0;
    canvas.onDisconnect(() => {
      count++;
      if (count === 4) {
        done();
      }
    })
    center.disconnect();
  })
});
