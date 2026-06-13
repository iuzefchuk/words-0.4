import Playfield from '@/domain/entities/Playfield.ts';
import { TurnValidity } from '@/domain/value-objects/enums.ts';
import { TurnValidationError } from '@/domain/value-objects/enums.ts';
import type Match from '@/domain/entities/Match.ts';
import type { PlayfieldAxis } from '@/domain/value-objects/enums.ts';
import type {
  Dictionary,
  InventoryTile,
  PlayfieldAnchorCoordinates,
  PlayfieldCell,
  TurnCells,
  TurnEvaluation,
  TurnEvaluationInvalid,
  TurnEvaluationValid,
  TurnPlacement,
  TurnPlacements,
  TurnScore,
  TurnWords,
} from '@/domain/value-objects/types.ts';

type ComputedTilesOutput = SequencesOutput & TurnPlacements;

type PipelineValue = TurnCells | TurnPlacements | TurnScore | TurnWords;

const PIPELINE_STATUS = { Pending: 'Pending' } as const;

type PendingResult<State> = { state: State; status: typeof PIPELINE_STATUS.Pending };

type PipelineInput = { context: ValidatorContext };

type PipelineOutput = TurnEvaluationInvalid | TurnEvaluationValid;

type PipelineState<Output extends PipelineValue> = Output & PipelineInput;

type PipelineThroughput<State> = PendingResult<State> | TurnEvaluationInvalid;

type ScoreOutput = TurnScore & WordsOutput;

type SequencesOutput = TurnCells;

type ValidatorContext = {
  dictionary: Dictionary;
  match: Readonly<Match>;
};

type WordsOutput = ComputedTilesOutput & TurnWords;

class CellsEvaluator {
  static execute(
    tiles: ReadonlyArray<InventoryTile>,
    historyHasPriorTurns: boolean,
    resolvePlacement: (tiles: ReadonlyArray<InventoryTile>) => TurnPlacement,
    isCellCenter: (cell: PlayfieldCell) => boolean,
    getAdjacentCells: (cell: PlayfieldCell) => ReadonlyArray<PlayfieldCell>,
    isCellOccupied: (cell: PlayfieldCell) => boolean,
  ): ReadonlyArray<PlayfieldCell> | TurnValidationError {
    if (tiles.length === 0) return TurnValidationError.InvalidTilePlacement;
    const placement = resolvePlacement(tiles);
    const cells = placement.map(link => link.cell);
    const placementCells = new Set(cells);
    const someCellsAreAnchor = cells.some(cell => {
      if (isCellCenter(cell)) return true;
      if (!historyHasPriorTurns) return false;
      return getAdjacentCells(cell).some(adj => isCellOccupied(adj) && !placementCells.has(adj));
    });
    return someCellsAreAnchor ? cells : TurnValidationError.NoCellsUsableAsFirst;
  }
}

class Pipeline<State extends PipelineInput> {
  private constructor(private throughput: PipelineThroughput<State>) {}

  static fail(error: TurnValidationError): TurnEvaluationInvalid {
    return { error, status: TurnValidity.Invalid };
  }

  static pass<State extends PipelineInput, NewValue extends PipelineValue>(
    state: State,
    newValue: NewValue,
  ): PendingResult<NewValue & State> {
    Object.assign(state, newValue);
    return { state: state as NewValue & State, status: PIPELINE_STATUS.Pending };
  }

  static start(context: ValidatorContext): Pipeline<PipelineInput> {
    return new Pipeline({ state: { context }, status: PIPELINE_STATUS.Pending });
  }

  continue<NextState extends State>(callback: (state: State) => PipelineThroughput<NextState>): Pipeline<NextState> {
    if (this.throughput.status === PIPELINE_STATUS.Pending) this.throughput = callback(this.throughput.state);
    return this as unknown as Pipeline<NextState>;
  }

  end(): PipelineOutput {
    if (this.throughput.status === TurnValidity.Invalid) return this.throughput;
    const { placements, score, words } = this.throughput.state as unknown as PipelineState<ScoreOutput>;
    return { computation: { placements, score, words }, status: TurnValidity.Valid };
  }
}

class PlacementsEvaluator {
  static execute(
    tiles: ReadonlyArray<InventoryTile>,
    cells: ReadonlyArray<PlayfieldCell>,
    calculateAxis: (cells: ReadonlyArray<PlayfieldCell>) => null | PlayfieldAxis,
    buildPlacement: (coords: PlayfieldAnchorCoordinates, tiles: ReadonlyArray<InventoryTile>) => TurnPlacement,
    getOppositeAxis: (axis: PlayfieldAxis) => PlayfieldAxis,
    findTileByCell: (cell: PlayfieldCell) => InventoryTile | undefined,
  ): ReadonlyArray<TurnPlacement> | TurnValidationError {
    const primaryAxis = calculateAxis(cells);
    if (primaryAxis === null) return TurnValidationError.InvalidTilePlacement;
    const cell = cells[0];
    if (cell === undefined) throw new ReferenceError('expected first cell, got undefined');
    const coords = { axis: primaryAxis, cell };
    const primaryPlacement = buildPlacement(coords, tiles);
    const areLinksUsable = (placement: TurnPlacement): boolean => placement.length > 1;
    if (!areLinksUsable(primaryPlacement)) return TurnValidationError.InvalidTilePlacement;
    const result: Array<TurnPlacement> = [primaryPlacement];
    for (const cell of cells) {
      const coords: PlayfieldAnchorCoordinates = { axis: getOppositeAxis(primaryAxis), cell };
      const tile = findTileByCell(cell);
      if (tile === undefined) continue;
      const secondaryPlacement = buildPlacement(coords, [tile]);
      if (areLinksUsable(secondaryPlacement)) result.push(secondaryPlacement);
    }
    return result;
  }
}

class ScoreComputer {
  static execute(
    placements: ReadonlyArray<TurnPlacement>,
    newCells: ReadonlySet<PlayfieldCell>,
    getTilePoints: (tile: InventoryTile) => number,
    getMultiplierForLetter: (cell: PlayfieldCell) => number,
    getMultiplierForWord: (cell: PlayfieldCell) => number,
  ): number {
    let totalScore = 0;
    for (const placement of placements) {
      let score = 0;
      let multiplier = 1;
      for (const { cell, tile } of placement) {
        const tileIsNew = newCells.has(cell);
        score += getTilePoints(tile) * (tileIsNew ? getMultiplierForLetter(cell) : 1);
        multiplier *= tileIsNew ? getMultiplierForWord(cell) : 1;
      }
      totalScore += score * multiplier;
    }
    return totalScore;
  }
}

class WordsEvaluator {
  static execute(
    placements: ReadonlyArray<TurnPlacement>,
    getTileLetter: (tile: InventoryTile) => string,
    containsAllWords: (words: ReadonlyArray<string>) => boolean,
  ): ReadonlyArray<string> | TurnValidationError {
    const words: Array<string> = [];
    for (let idx = 0; idx < placements.length; idx++) {
      const placement = placements[idx];
      if (placement === undefined) throw new ReferenceError(`expected placement at index ${String(idx)}, got undefined`);
      let word = '';
      for (const { tile } of placement) word += getTileLetter(tile);
      words[idx] = word;
    }
    return containsAllWords(words) ? words : TurnValidationError.WordNotInDictionary;
  }
}

export default class TurnEvaluationService {
  static execute(context: ValidatorContext): TurnEvaluation {
    return Pipeline.start(context)
      .continue(state => this.validateCells(state))
      .continue(state => this.validatePlacements(state))
      .continue(state => this.validateWords(state))
      .continue(state => this.computeScore(state))
      .end();
  }

  private static computeScore(state: PipelineState<WordsOutput>): PipelineThroughput<PipelineState<ScoreOutput>> {
    const { match } = state.context;
    const newCells = new Set(state.cells);
    const score = ScoreComputer.execute(
      state.placements,
      newCells,
      tile => match.getTilePoints(tile),
      cell => match.getMultiplierForLetter(cell),
      cell => match.getMultiplierForWord(cell),
    );
    return Pipeline.pass(state, { score });
  }

  private static isError(result: unknown): result is TurnValidationError {
    return typeof result === 'string';
  }

  private static validateCells(state: PipelineInput): PipelineThroughput<PipelineState<SequencesOutput>> {
    const { match } = state.context;
    const result = CellsEvaluator.execute(
      match.currentTurnTiles,
      match.historyHasPriorTurns,
      tiles => match.resolvePlacement(tiles),
      cell => Playfield.isCellCenter(cell),
      cell => Playfield.getAdjacentCells(cell),
      cell => match.isCellOccupied(cell),
    );
    if (this.isError(result)) return Pipeline.fail(result);
    return Pipeline.pass(state, { cells: result });
  }

  private static validatePlacements(
    state: PipelineState<SequencesOutput>,
  ): PipelineThroughput<PipelineState<ComputedTilesOutput>> {
    const { match } = state.context;
    const result = PlacementsEvaluator.execute(
      match.currentTurnTiles,
      state.cells,
      cells => Playfield.calculateAxis(cells, cell => match.isCellOccupied(cell)),
      (coords, tiles) => match.buildPlacement(coords, tiles),
      axis => Playfield.getOppositeAxis(axis),
      cell => match.findTileByCell(cell),
    );
    if (this.isError(result)) return Pipeline.fail(result);
    return Pipeline.pass(state, { placements: result });
  }

  private static validateWords(state: PipelineState<ComputedTilesOutput>): PipelineThroughput<PipelineState<WordsOutput>> {
    const { dictionary, match } = state.context;
    const result = WordsEvaluator.execute(
      state.placements,
      tile => match.getTileLetter(tile),
      words => dictionary.containsAllWords(words),
    );
    if (this.isError(result)) return Pipeline.fail(result);
    return Pipeline.pass(state, { words: result });
  }
}
