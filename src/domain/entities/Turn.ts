import { TurnOutcome, TurnValidationStatus } from '@/domain/value-objects/enums.ts';
import type { MatchPlayer, TurnValidationError } from '@/domain/value-objects/enums.ts';
import type { IdentifierGateway, InventoryTile, PlayfieldCell, TurnValidationResult } from '@/domain/value-objects/types.ts';

export default class Turn {
  get cells(): ReadonlyArray<PlayfieldCell> | undefined {
    return this.validationResult.status === TurnValidationStatus.Valid ? this.validationResult.cells : undefined;
  }

  get error(): TurnValidationError | undefined {
    return this.validationResult.status === TurnValidationStatus.Invalid ? this.validationResult.error : undefined;
  }

  get isValid(): boolean {
    return this.validationResult.status === TurnValidationStatus.Valid;
  }

  get score(): number | undefined {
    return this.validationResult.status === TurnValidationStatus.Valid ? this.validationResult.score : undefined;
  }

  get tilesView(): ReadonlyArray<InventoryTile> {
    return this.tiles;
  }

  get wasPassed(): boolean {
    return this.outcome === TurnOutcome.Passed;
  }

  get words(): ReadonlyArray<string> | undefined {
    return this.validationResult.status === TurnValidationStatus.Valid ? this.validationResult.words : undefined;
  }

  private constructor(
    readonly id: string,
    readonly player: MatchPlayer,
    private readonly tiles: Array<InventoryTile>,
    private validationResult: TurnValidationResult = { status: TurnValidationStatus.Unvalidated },
    private outcome: TurnOutcome = TurnOutcome.Pending,
  ) {}

  static clone(source: Turn): Turn {
    return new Turn(source.id, source.player, [...source.tiles], { ...source.validationResult }, source.outcome);
  }

  static create({ identifier, player }: { identifier: IdentifierGateway; player: MatchPlayer }): Turn {
    const id = identifier.create();
    return new Turn(id, player, []);
  }

  addTile(tile: InventoryTile): void {
    this.ensureOutcomePending();
    if (this.tiles.includes(tile)) throw new Error(`tile ${tile} is already in current turn`);
    this.tiles.push(tile);
  }

  pass(): void {
    this.ensureOutcomePending();
    this.outcome = TurnOutcome.Passed;
  }

  removeTile(tile: InventoryTile): void {
    this.ensureOutcomePending();
    const index = this.tiles.indexOf(tile);
    if (index === -1) throw new ReferenceError(`tile ${tile} is not in current turn`);
    this.tiles.splice(index, 1);
  }

  reset(): void {
    this.ensureOutcomePending();
    this.tiles.length = 0;
    this.validationResult = { status: TurnValidationStatus.Unvalidated };
  }

  save(): void {
    this.ensureOutcomePending();
    this.outcome = TurnOutcome.Saved;
  }

  setValidationResult(result: TurnValidationResult): void {
    this.ensureOutcomePending();
    this.validationResult = result;
  }

  private ensureOutcomePending(): void {
    if (this.outcome !== TurnOutcome.Pending) throw new Error(`cannot mutate completed turn with outcome ${this.outcome}`);
  }
}
