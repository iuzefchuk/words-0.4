import { TurnStatus, TurnValidity } from '@/domain/value-objects/enums.ts';
import type { MatchPlayer, TurnValidationError } from '@/domain/value-objects/enums.ts';
import type {
  IdentifierGateway,
  PlayfieldLinkId,
  TurnComputation,
  TurnEvaluation,
} from '@/domain/value-objects/types.ts';

type ValidationState =
  | { error: TurnValidationError; status: TurnValidity.Invalid }
  | { status: TurnValidity.Unknown }
  | { status: TurnValidity.Valid };

export default class Turn {
  get error(): TurnValidationError | undefined {
    return this.validation.status === TurnValidity.Invalid ? this.validation.error : undefined;
  }

  get hasStatusPass(): boolean {
    return this.status === TurnStatus.Passed;
  }

  get isValid(): boolean {
    return this.validation.status === TurnValidity.Valid;
  }

  get references(): ReadonlyArray<PlayfieldLinkId> {
    return this.linkIds;
  }

  get score(): number | undefined {
    return this.computation?.score;
  }

  get words(): ReadonlyArray<string> | undefined {
    return this.computation?.words;
  }

  private computation: null | TurnComputation = null;

  private validation: ValidationState = { status: TurnValidity.Unknown };

  private constructor(
    readonly id: string,
    readonly player: MatchPlayer,
    private readonly linkIds: Array<PlayfieldLinkId>,
    private status: TurnStatus,
  ) {}

  static clone(source: Turn): Turn {
    return new Turn(source.id, source.player, [], TurnStatus.Current);
  }

  static create({ identifier, player }: { identifier: IdentifierGateway; player: MatchPlayer }): Turn {
    return new Turn(identifier.create(), player, [], TurnStatus.Current);
  }

  addReference(linkId: PlayfieldLinkId): void {
    this.ensureMutability();
    if (this.linkIds.includes(linkId)) throw new Error(`link ${linkId} is already in current turn`);
    this.linkIds.push(linkId);
  }

  removeReference(linkId: PlayfieldLinkId): void {
    this.ensureMutability();
    const index = this.linkIds.indexOf(linkId);
    if (index === -1) throw new ReferenceError(`link ${linkId} is not in current turn`);
    this.linkIds.splice(index, 1);
  }

  setEvaluation(result: TurnEvaluation): void {
    this.ensureMutability();
    if (result.status === TurnValidity.Valid) {
      this.validation = { status: TurnValidity.Valid };
      this.computation = result.computation;
    } else if (result.status === TurnValidity.Invalid) {
      this.validation = { error: result.error, status: TurnValidity.Invalid };
      this.computation = null;
    } else {
      this.validation = { status: TurnValidity.Unknown };
      this.computation = null;
    }
  }

  setStatusPass(): void {
    this.ensureMutability();
    this.status = TurnStatus.Passed;
  }

  setStatusSave(): void {
    this.ensureMutability();
    this.status = TurnStatus.Saved;
  }

  private ensureMutability(): void {
    if (this.status !== TurnStatus.Current) throw new Error(`cannot mutate completed turn with status ${this.status}`);
  }
}
