export enum AppBootProgress {
  Started = 25,
  DictionaryFetched = 50,
  DictionaryParsed = 75,
  Finished = 100,
}

export {
  DomainPlayfieldBonus,
  DomainInventoryLetter,
  DomainMatchDifficulty,
  DomainMatchPlayer,
  DomainMatchResult,
  DomainMatchType,
  DomainTimelineEventType,
} from '@/domain/published/enums.ts';
