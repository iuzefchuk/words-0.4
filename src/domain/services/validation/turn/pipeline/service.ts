import { ValidationError, ValidationStatus } from '@/domain/models/turns/enums.ts';
import { ComputedValue, InvalidResult, ValidResult } from '@/domain/models/turns/types.ts';
import {
  PendingResult,
  PipelineInput,
  PipelineOutput,
  PipelineState,
  PipelineThroughput,
  ScoreOutput,
  ValidatorContext,
} from '@/domain/services/validation/turn/types.ts';

export default class Pipeline<State extends PipelineInput> {
  private constructor(private throughput: PipelineThroughput<State>) {}

  static fail(error: ValidationError): InvalidResult {
    return { error, status: ValidationStatus.Invalid };
  }

  static pass<State extends PipelineInput, NewValue extends ComputedValue>(state: State, newValue: NewValue): PendingResult<NewValue & State> {
    Object.assign(state, newValue);
    return { state: state as NewValue & State, status: ValidationStatus.Pending };
  }

  static start(context: ValidatorContext): Pipeline<PipelineInput> {
    return new Pipeline({ state: { context }, status: ValidationStatus.Pending });
  }

  continue<NextState extends State>(callback: (state: State) => PipelineThroughput<NextState>): Pipeline<NextState> {
    if (this.throughput.status === ValidationStatus.Pending) this.throughput = callback(this.throughput.state);
    return this as unknown as Pipeline<NextState>;
  }

  end(): PipelineOutput {
    if (this.throughput.status === ValidationStatus.Invalid) return this.throughput;
    const { cells, placements, score, words } = this.throughput.state as unknown as PipelineState<ScoreOutput>;
    if (score === undefined) throw new Error('Can`t end pipeline until it`s completed');
    return { cells, placements, score, status: ValidationStatus.Valid, words } as ValidResult;
  }
}
