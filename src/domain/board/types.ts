export enum Bonus {
  DoubleWord = 'DoubleWord',
  TripleWord = 'TripleWord',
  DoubleLetter = 'DoubleLetter',
  TripleLetter = 'TripleLetter',
}

export enum Axis {
  X = 'X',
  Y = 'Y',
}

export type CellIndex = number;

export type AnchorCoordinates = { readonly axis: Axis; readonly cell: CellIndex };

export type Board = import('@/domain/board/Board.ts').default;
