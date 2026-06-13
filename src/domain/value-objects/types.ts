import type Match from '@/domain/entities/Match.ts';
import type CrossCheckTable from '@/domain/value-objects/classes/CrossCheckTable.ts';
import type {
  InventoryLetter,
  MatchDifficulty,
  MatchPlayer,
  MatchResult,
  MatchType,
  PlayfieldAxis,
  PlayfieldBonus,
  TurnValidationError,
  TurnValidity,
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

export type InventoryTile = Brand<string, 'Tile'>;

export type InventoryTileCollection = ReadonlyMap<InventoryLetter, ReadonlyArray<InventoryTile>>;

export type MatchProjection = {
  areTilesEqual(firstTile: InventoryTile, secondTile: InventoryTile): boolean;
  readonly currentPlayer: MatchPlayer;
  readonly currentTurnError: TurnValidationError | undefined;
  readonly currentTurnIsValid: boolean;
  readonly currentTurnScore: number | undefined;
  readonly currentTurnTiles: ReadonlyArray<InventoryTile>;
  readonly currentTurnWords: ReadonlyArray<string> | undefined;
  findCellByTile(tile: InventoryTile): PlayfieldCell | undefined;
  findTileByCell(cell: PlayfieldCell): InventoryTile | undefined;
  getCellBonus(cell: PlayfieldCell): null | PlayfieldBonus;
  getLetterPoints(letter: InventoryLetter): number;
  getResultFor(player: MatchPlayer): MatchResult;
  getScoreFor(player: MatchPlayer): number;
  getTileLetter(tile: InventoryTile): InventoryLetter;
  getTilesFor(player: MatchPlayer): ReadonlyArray<InventoryTile>;
  hasTilesFor(player: MatchPlayer): boolean;
  readonly historyHasPriorTurns: boolean;
  readonly isFinished: boolean;
  isTilePlaced(tile: InventoryTile): boolean;
  readonly nextPlayer: MatchPlayer;
  readonly playfieldCells: ReadonlyArray<PlayfieldCell>;
  readonly playfieldCellsPerAxis: number;
  readonly previousTurnTiles: ReadonlyArray<InventoryTile> | undefined;
  readonly settings: Readonly<MatchSettings>;
  readonly tilesPerPlayer: number;
  readonly unusedTilesCount: number;
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

export type PlayfieldLinkId = Brand<string, 'PlayfieldLinkId'>;


export type RandomizerGateway = {
  createFunctionFromSeed(seed: number): () => number;
  createNewSeed(): number;
};

export type TurnCells = { cells: ReadonlyArray<PlayfieldCell> };

export type TurnComputation = TurnPlacements & TurnScore & TurnWords;

export type TurnEvaluation = { status: TurnValidity.Unknown } | TurnEvaluationInvalid | TurnEvaluationValid;

export type TurnEvaluationInvalid = { error: TurnValidationError; status: TurnValidity.Invalid };

export type TurnEvaluationValid = { computation: TurnComputation; status: TurnValidity.Valid };

export type TurnGenerationContext = {
  crossCheckTable: CrossCheckTable;
  dictionary: DictionaryGraph;
} & TurnGenerationContextData;

export type TurnGenerationContextData = { readonly match: Match };

export type TurnGenerationPartition = { length: number; offset: number };

export type TurnGenerationResult = {
  evaluation: TurnEvaluationValid;
  placement: TurnPlacement;
};

export type TurnLink = { readonly cell: PlayfieldCell; readonly tile: InventoryTile };

export type TurnPlacement = ReadonlyArray<TurnLink>;

export type TurnPlacements = { placements: ReadonlyArray<TurnPlacement> };

export type TurnScore = { score: number };

export type TurnWords = { words: ReadonlyArray<string> };
