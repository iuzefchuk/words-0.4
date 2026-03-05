import type { Locals as T } from '@/domain/Turn/types.d.ts';
import { AxisCalculator } from '@/domain/Layout/calculation/AxisCalculator.js';
import { PlacementBuilder } from '@/domain/Turn/construction/PlacementBuilder.js';
import { ValidationType } from '@/domain/Turn/enums.js';
import { AnchorCellFinder } from '@/domain/Turn/search/AnchorCellFinder.js';

type Dependencies = { layout: Layout; dictionary: Dictionary; inventory: Inventory; turnManager: TurnManager };
type BaseContext = { initialPlacement: Placement; dependencies: Dependencies };
type SequencesContext = BaseContext & { sequences: { cell: ReadonlyArray<CellIndex>; tile: ReadonlyArray<TileId> } };
type PlacementsContext = SequencesContext & { placements: ReadonlyArray<Placement> };
type WordsContext = PlacementsContext & { words: ReadonlyArray<string> };
type ScoreContext = WordsContext & { score: number };

type PipelineResult<Context> = ValidPipelineResult<Context> | InvalidPipelineResult;
type ValidPipelineResult<Context> = { isValid: true; ctx: Context };
type InvalidPipelineResult = { isValid: false; error: ValidationErrors };

export enum ValidationErrors {
  InvalidTilePlacement = 'error_tile_1',
  InvalidCellPlacement = 'error_cell_2',
  NoCellsUsableAsFirst = 'error_cell_3',
  WordNotInDictionary = 'error_tile_4',
}

export class TurnValidator {
  static execute(
    initialPlacement: Placement,
    layout: Layout,
    dictionary: Dictionary,
    inventory: Inventory,
    turnManager: TurnManager,
  ): T.ValidationResult {
    const initialContext = { initialPlacement, dependencies: { layout, dictionary, inventory, turnManager } };
    const { result } = this.Pipeline.initialize(initialContext)
      .addStep(this.computeSequences)
      .addStep(this.computePlacements)
      .addStep(this.computeWords)
      .addStep(this.computeScore);
    return result.isValid
      ? {
          type: ValidationType.Valid,
          sequences: result.ctx.sequences,
          score: result.ctx.score,
          words: result.ctx.words,
        }
      : {
          type: ValidationType.Invalid,
          error: result.error,
        };
  }

  private static Pipeline = class Pipeline<Context> {
    private constructor(public result: PipelineResult<Context>) {}

    static initialize<Context extends BaseContext>(ctx: Context): Pipeline<Context> {
      return new Pipeline({ isValid: true, ctx });
    }

    static createValidPipelineResult<Ctx>(ctx: Ctx): ValidPipelineResult<Ctx> {
      return { isValid: true, ctx };
    }

    static createInvalidPipelineResult(error: ValidationErrors): InvalidPipelineResult {
      return { isValid: false, error };
    }

    addStep<NextContext extends Context>(
      computer: (ctx: Context) => PipelineResult<NextContext>,
    ): Pipeline<NextContext> {
      if (this.result.isValid) this.result = computer(this.result.ctx) as PipelineResult<NextContext>;
      return this as unknown as Pipeline<NextContext>;
    }
  };

  private static passComputer<OldContext extends object, NextContext extends object>(
    oldCtx: OldContext,
    nextCtx: NextContext,
  ): ValidPipelineResult<OldContext & NextContext> {
    Object.assign(oldCtx, nextCtx);
    return this.Pipeline.createValidPipelineResult(oldCtx as OldContext & NextContext);
  }

  private static failComputer(error: ValidationErrors): InvalidPipelineResult {
    return this.Pipeline.createInvalidPipelineResult(error);
  }

  private static computeSequences(ctx: BaseContext): PipelineResult<SequencesContext> {
    const { layout, turnManager } = ctx.dependencies;
    const tiles = ctx.initialPlacement.map(placement => placement.tile);
    if (tiles.length === 0) return this.failComputer(ValidationErrors.InvalidTilePlacement);
    const cells = ctx.initialPlacement.map(placement => placement.cell);
    if (cells.length === 0) return this.failComputer(ValidationErrors.InvalidCellPlacement);
    const anchorCells = new Set(new AnchorCellFinder(layout, turnManager).execute());
    const someCellsAreAnchor = cells.filter(item => anchorCells.has(item));
    if (!someCellsAreAnchor) return this.failComputer(ValidationErrors.NoCellsUsableAsFirst);
    return this.passComputer(ctx, { sequences: { cell: cells, tile: tiles } });
  }

  private static computePlacements(ctx: SequencesContext): PipelineResult<PlacementsContext> {
    const { layout, turnManager } = ctx.dependencies;
    const tileSequence = ctx.sequences.tile;
    const axisCalculator = new AxisCalculator(layout, turnManager);
    const primaryAxis = axisCalculator.execute(ctx.sequences.cell);
    const placementBuilder = new PlacementBuilder(layout, turnManager);
    const primaryPlacement = placementBuilder.execute({
      coords: { axis: primaryAxis, index: ctx.sequences.cell[0] },
      tileSequence,
    });
    const isPlacementUsable = (placement: Placement): boolean => placement.length > 1;
    if (!isPlacementUsable(primaryPlacement)) return this.failComputer(ValidationErrors.InvalidTilePlacement);
    const placements: Array<Placement> = [primaryPlacement];
    for (const cell of ctx.sequences.cell) {
      const placement = placementBuilder.execute({
        coords: { axis: layout.getOppositeAxis(primaryAxis), index: cell },
        tileSequence,
      });
      if (isPlacementUsable(placement)) placements.push(placement);
    }
    return placements.length > 0
      ? this.passComputer(ctx, { placements })
      : this.failComputer(ValidationErrors.InvalidTilePlacement);
  }

  private static computeWords(ctx: PlacementsContext): PipelineResult<WordsContext> {
    const { dictionary, inventory } = ctx.dependencies;
    const words: Array<string> = [];
    for (let i = 0; i < ctx.placements.length; i++) {
      const placement = ctx.placements[i];
      let word = '';
      for (let j = 0; j < placement.length; j++) word += inventory.getTileLetter(placement[j].tile);
      words[i] = word;
    }
    return dictionary.hasWords(words)
      ? this.passComputer(ctx, { words })
      : this.failComputer(ValidationErrors.WordNotInDictionary);
  }

  private static computeScore(ctx: WordsContext): PipelineResult<ScoreContext> {
    const { layout, inventory } = ctx.dependencies;
    let totalScore = 0;
    for (const placement of ctx.placements) {
      let placementScore = 0;
      let placementMultiplier = 1;
      for (const { cell, tile } of placement) {
        placementScore += inventory.getTilePoints(tile) * layout.getLetterMultiplier(cell);
        placementMultiplier *= layout.getWordMultiplier(cell);
      }
      totalScore += placementScore * placementMultiplier;
    }
    return this.passComputer(ctx, { score: totalScore });
  }
}
