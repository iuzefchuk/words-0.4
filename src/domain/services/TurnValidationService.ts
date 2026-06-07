import CellsValidationService from '@/domain/services/CellsValidationService.ts';
import PlacementsValidationService from '@/domain/services/PlacementsValidationService.ts';
import ScoringService from '@/domain/services/ScoringService.ts';
import WordsValidationService from '@/domain/services/WordsValidationService.ts';
import { TurnValidationStatus } from '@/domain/value-objects/enums.ts';
import type Board from '@/domain/entities/Board.ts';
import type Inventory from '@/domain/entities/Inventory.ts';
import type Match from '@/domain/entities/Match.ts';
import type { TurnValidationError } from '@/domain/value-objects/enums.ts';
import type {
  Dictionary,
  TurnComputedCells,
  TurnComputedPlacements,
  TurnComputedScore,
  TurnComputedValue,
  TurnComputedWords,
  TurnValidationInvalidResult,
  TurnValidationResult,
  TurnValidationValidResult,
} from '@/domain/value-objects/types.ts';

type ComputedTilesOutput = SequencesOutput & TurnComputedPlacements;

type PendingResult<State> = { state: State; status: TurnValidationStatus.Pending };

type PipelineInput = { context: ValidatorContext };

type PipelineOutput = TurnValidationInvalidResult | TurnValidationValidResult;

type PipelineState<Output extends TurnComputedValue> = Output & PipelineInput;

type PipelineThroughput<State> = PendingResult<State> | TurnValidationInvalidResult;

type ScoreOutput = TurnComputedScore & WordsOutput;

type SequencesOutput = TurnComputedCells;

type ValidatorContext = {
  board: Readonly<Board>;
  dictionary: Dictionary;
  inventory: Readonly<Inventory>;
  match: Readonly<Match>;
};

type WordsOutput = ComputedTilesOutput & TurnComputedWords;

class Pipeline<State extends PipelineInput> {
  private constructor(private throughput: PipelineThroughput<State>) {}

  static fail(error: TurnValidationError): TurnValidationInvalidResult {
    return { error, status: TurnValidationStatus.Invalid };
  }

  static pass<State extends PipelineInput, NewValue extends TurnComputedValue>(
    state: State,
    newValue: NewValue,
  ): PendingResult<NewValue & State> {
    Object.assign(state, newValue);
    return { state: state as NewValue & State, status: TurnValidationStatus.Pending };
  }

  static start(context: ValidatorContext): Pipeline<PipelineInput> {
    return new Pipeline({ state: { context }, status: TurnValidationStatus.Pending });
  }

  continue<NextState extends State>(callback: (state: State) => PipelineThroughput<NextState>): Pipeline<NextState> {
    if (this.throughput.status === TurnValidationStatus.Pending) this.throughput = callback(this.throughput.state);
    return this as unknown as Pipeline<NextState>;
  }

  end(): PipelineOutput {
    if (this.throughput.status === TurnValidationStatus.Invalid) return this.throughput;
    const { cells, placements, score, words } = this.throughput.state as unknown as PipelineState<ScoreOutput>;
    return { cells, placements, score, status: TurnValidationStatus.Valid, words };
  }
}

export default class TurnValidationService {
  static execute(context: ValidatorContext): TurnValidationResult {
    return Pipeline.start(context)
      .continue(state => this.validateCells(state))
      .continue(state => this.validatePlacements(state))
      .continue(state => this.validateWords(state))
      .continue(state => this.computeScore(state))
      .end();
  }

  private static computeScore(state: PipelineState<WordsOutput>): PipelineThroughput<PipelineState<ScoreOutput>> {
    const { board, inventory } = state.context;
    const newCells = new Set(state.cells);
    const score = ScoringService.execute(
      state.placements,
      newCells,
      tile => inventory.getTilePoints(tile),
      cell => board.getMultiplierForLetter(cell),
      cell => board.getMultiplierForWord(cell),
    );
    return Pipeline.pass(state, { score });
  }

  private static isError(result: unknown): result is TurnValidationError {
    return typeof result === 'string';
  }

  private static validateCells(state: PipelineInput): PipelineThroughput<PipelineState<SequencesOutput>> {
    const { board, match } = state.context;
    const result = CellsValidationService.execute(
      match.currentTurnTiles,
      match.historyHasPriorTurns,
      tiles => board.resolvePlacement(tiles),
      cell => board.isCellCenter(cell),
      cell => board.getAdjacentCells(cell),
      cell => board.isCellOccupied(cell),
    );
    if (this.isError(result)) return Pipeline.fail(result);
    return Pipeline.pass(state, { cells: result });
  }

  private static validatePlacements(
    state: PipelineState<SequencesOutput>,
  ): PipelineThroughput<PipelineState<ComputedTilesOutput>> {
    const { board, match } = state.context;
    const result = PlacementsValidationService.execute(
      match.currentTurnTiles,
      state.cells,
      cells => board.calculateAxis(cells),
      (coords, tiles) => board.buildPlacement(coords, tiles),
      axis => board.getOppositeAxis(axis),
      cell => board.findTileByCell(cell),
    );
    if (this.isError(result)) return Pipeline.fail(result);
    return Pipeline.pass(state, { placements: result });
  }

  private static validateWords(state: PipelineState<ComputedTilesOutput>): PipelineThroughput<PipelineState<WordsOutput>> {
    const { dictionary, inventory } = state.context;
    const result = WordsValidationService.execute(
      state.placements,
      tile => inventory.getTileLetter(tile),
      words => dictionary.containsAllWords(words),
    );
    if (this.isError(result)) return Pipeline.fail(result);
    return Pipeline.pass(state, { words: result });
  }
}
