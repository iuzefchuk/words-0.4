import type Inventory from '@/domain/entities/Inventory.ts';
import type Match from '@/domain/entities/Match.ts';
import type Playfield from '@/domain/entities/Playfield.ts';
import type CrossCheckTable from '@/domain/value-objects/classes/CrossCheckTable.ts';
import type {
  InventoryLetter,
  MatchDifficulty,
  MatchPlayer,
  MatchResult,
  MatchType,
  PlayfieldAxis,
  PlayfieldBonus,
  TimelineEventType,
  TurnValidationError,
  TurnValidationStatus,
} from '@/domain/value-objects/enums.ts';

export type Dictionary = {
  containsAllWords(words: ReadonlyArray<string>): boolean;
};

export type DictionaryGraph = {
  forEachNodeChild(
    node: DictionaryNode,
    callback: (letter: InventoryLetter, childNode: DictionaryNode, letterIndex: number) => void,
  ): void;
  getNode(word: string, startNode?: DictionaryNode): DictionaryNode | null;
  isNodeFinal(node: DictionaryNode): boolean;
  readonly rootNode: DictionaryNode;
} & Dictionary;

export type DictionaryNode = Brand<number, 'DictionaryNode'>;

export type Gateways = {
  identifier: IdentifierGateway;
  randomizer: RandomizerGateway;
};

export type IdentifierGateway = {
  create(): string;
};

export type InventoryProjection = {
  areTilesEqual(firstTile: InventoryTile, secondTile: InventoryTile): boolean;
  getLetterPoints(letter: InventoryLetter): number;
  getTileLetter(tile: InventoryTile): InventoryLetter;
  getTilesFor(player: MatchPlayer): ReadonlyArray<InventoryTile>;
  hasTilesFor(player: MatchPlayer): boolean;
  readonly tilesPerPlayer: number;
  readonly unusedTilesCount: number;
};

export type InventoryTile = Brand<string, 'Tile'>;

export type InventoryTileCollection = ReadonlyMap<InventoryLetter, ReadonlyArray<InventoryTile>>;

export type MatchProjection = {
  readonly currentPlayer: MatchPlayer;
  readonly currentTurnCells: ReadonlyArray<PlayfieldCell> | undefined;
  readonly currentTurnError: TurnValidationError | undefined;
  readonly currentTurnIsValid: boolean;
  readonly currentTurnScore: number | undefined;
  readonly currentTurnTiles: ReadonlyArray<InventoryTile>;
  readonly currentTurnWords: ReadonlyArray<string> | undefined;
  readonly difficulty: MatchDifficulty;
  getResultFor(player: MatchPlayer): MatchResult;
  getScoreFor(player: MatchPlayer): number;
  readonly historyHasPriorTurns: boolean;
  readonly isFinished: boolean;
  readonly nextPlayer: MatchPlayer;
  readonly previousTurnTiles: ReadonlyArray<InventoryTile> | undefined;
  readonly settings: Readonly<MatchSettings>;
  readonly type: MatchType;
  willPlayerPassBeResign(player: MatchPlayer): boolean;
};

export type MatchSettings = {
  difficulty: MatchDifficulty;
  type: MatchType;
};

export type MatchTerminationDecision = { terminate: false } | { terminate: true; winner: MatchPlayer | null };

export type PlayfieldAnchorCoordinates = { readonly axis: PlayfieldAxis; readonly cell: PlayfieldCell };

export type PlayfieldBonusDistribution = ReadonlyMap<PlayfieldCell, PlayfieldBonus>;

export type PlayfieldCell = Brand<number, 'Cell'>;

export type PlayfieldLink = { readonly cell: PlayfieldCell; readonly tile: InventoryTile };

export type PlayfieldPlacement = ReadonlyArray<PlayfieldLink>;

export type PlayfieldProjection = {
  readonly cells: ReadonlyArray<PlayfieldCell>;
  readonly cellsPerAxis: number;
  findCellByTile(tile: InventoryTile): PlayfieldCell | undefined;
  findTileByCell(cell: PlayfieldCell): InventoryTile | undefined;
  getAdjacentCells(cell: PlayfieldCell): ReadonlyArray<PlayfieldCell>;
  getBonus(cell: PlayfieldCell): null | PlayfieldBonus;
  getCellPositionInColumn(cell: PlayfieldCell): number;
  getCellPositionInRow(cell: PlayfieldCell): number;
  isCellCenter(cell: PlayfieldCell): boolean;
  isTilePlaced(tile: InventoryTile): boolean;
};

export type RandomizerGateway = {
  createFunctionFromSeed(seed: number): () => number;
  createNewSeed(): number;
};

export type TimelineEvent =
  | { cell: PlayfieldCell; tile: InventoryTile; type: TimelineEventType.TilePlaced }
  | { cell: PlayfieldCell; tile: InventoryTile; type: TimelineEventType.TileUndoPlaced }
  | { difficulty: MatchDifficulty; type: TimelineEventType.MatchDifficultyChanged }
  | { matchType: MatchType; seed: number; type: TimelineEventType.MatchTypeChanged }
  | { player: MatchPlayer; score: number; type: TimelineEventType.TurnSaved; words: ReadonlyArray<string> }
  | { player: MatchPlayer; type: TimelineEventType.TurnPassed }
  | { result: TurnValidationResult; type: TimelineEventType.TurnValidationSet }
  | { seed: number; settings: MatchSettings; type: TimelineEventType.MatchStarted }
  | { type: TimelineEventType.MatchFinished; winner: MatchPlayer | null };

export type TurnComputedCells = { cells: ReadonlyArray<PlayfieldCell> };

export type TurnComputedPlacements = { placements: ReadonlyArray<PlayfieldPlacement> };

export type TurnComputedScore = { score: number };

export type TurnComputedValue = TurnComputedCells | TurnComputedPlacements | TurnComputedScore | TurnComputedWords;

export type TurnComputedWords = { words: ReadonlyArray<string> };

export type TurnGenerationContext = {
  crossCheckTable: CrossCheckTable;
  dictionary: DictionaryGraph;
} & TurnGenerationContextData;

export type TurnGenerationContextData = { readonly inventory: Inventory; readonly match: Match; readonly playfield: Playfield };

export type TurnGenerationPartition = { length: number; offset: number };

export type TurnGenerationResult = {
  cells: ReadonlyArray<PlayfieldCell>;
  tiles: ReadonlyArray<InventoryTile>;
  validationResult: TurnValidationValidResult;
};

export type TurnValidationInvalidResult = { error: TurnValidationError; status: TurnValidationStatus.Invalid };

export type TurnValidationResult = TurnValidationInvalidResult | TurnValidationUnvalidatedResult | TurnValidationValidResult;

export type TurnValidationUnvalidatedResult = { status: TurnValidationStatus.Unvalidated };

export type TurnValidationValidResult = { status: TurnValidationStatus.Valid } & TurnComputedCells &
  TurnComputedPlacements &
  TurnComputedScore &
  TurnComputedWords;
