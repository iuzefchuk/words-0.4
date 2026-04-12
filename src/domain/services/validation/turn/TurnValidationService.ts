import { ValidationError } from '@/domain/models/turns/enums.ts';
import { ValidationResult } from '@/domain/models/turns/types.ts';
import ScoringService from '@/domain/services/scoring/ScoringService.ts';
import CellsValidationService from '@/domain/services/validation/cells/service.ts';
import PlacementsValidationService from '@/domain/services/validation/placements/PlacementsValidationService.ts';
import Pipeline from '@/domain/services/validation/turn/pipeline/service.ts';
import {
  ComputedTilesOutput,
  PipelineInput,
  PipelineState,
  PipelineThroughput,
  ScoreOutput,
  SequencesOutput,
  ValidatorContext,
  WordsOutput,
} from '@/domain/services/validation/turn/types.ts';
import WordsValidationService from '@/domain/services/validation/words/WordsValidationService.ts';

export default class TurnValidationService {
  static execute(context: ValidatorContext): ValidationResult {
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

  private static isError<T>(result: T | ValidationError): result is ValidationError {
    return typeof result === 'string';
  }

  private static validateCells(state: PipelineInput): PipelineThroughput<PipelineState<SequencesOutput>> {
    const { board, turns } = state.context;
    const result = CellsValidationService.execute(
      turns.currentTurnTiles,
      turns.historyHasPriorTurns,
      tiles => board.resolvePlacement(tiles),
      cell => board.isCellCenter(cell),
      cell => board.calculateAdjacentCells(cell),
      cell => board.isCellOccupied(cell),
    );
    if (this.isError(result)) return Pipeline.fail(result);
    return Pipeline.pass(state, { cells: result });
  }

  private static validatePlacements(state: PipelineState<SequencesOutput>): PipelineThroughput<PipelineState<ComputedTilesOutput>> {
    const { board, turns } = state.context;
    const result = PlacementsValidationService.execute(
      turns.currentTurnTiles,
      state.cells,
      cells => board.calculateAxis(cells),
      (coords, tiles) => board.createPlacement(coords, tiles),
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
