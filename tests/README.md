# HOW TO UNIT TEST

Two patterns depending on the class under test:

- **Stateless services** — methods (usually static) that take arguments and return values. No instance state.
- **Stateful classes** — instances whose behavior depends on state built up over method calls.

Thrown-error cases and mutation-testing validation apply to both patterns and are covered at the bottom.

## Stateless services

Follow these steps when writing unit tests for a stateless service.

### 1. Identify entities

**Entities are method arguments. Nothing else.** Walk through each public method and list its parameters — those are your entities, and they are the _only_ things that become `*Cases` records.

Example — `BonusService` exposes one public method:

```ts
static createDistribution(type: Type, randomizer?: () => number): BonusDistribution
```

Entities: `type`, `randomizer`. That's the complete list.

If the service exposed `getTotal(order)`, `applyCoupon(order, coupon)`, and `validate(amount)`, the entities would be `order`, `coupon`, and `amount`.

#### What is NOT an entity

These all get mistaken for entities. Don't build Cases records for any of them:

- **Return values.** `BonusDistribution` is produced, not consumed. No `BonusDistributionCases`.
- **Types nested inside return values.** `Cell` appears as a key in the returned map, but it isn't a method argument, so it's not an entity. No `CellCases`. When a test needs to iterate over output cells, compute that iteration inside the factory and carry it as a case field (see [Carry data, not assertions](#carry-data-not-assertions)) — don't invent a fake entity to drive `describe.each`.
- **Private constants, cached state, and other source-internal details.** They're implementation, not testing surface.
- **Test groupings.** "Matching pair", "D4-symmetric preset", "excludes center cell" name which test group a case serves — they're _scopes_, not entities. They become `<Scope>` suffixes on a real entity (step 2), not separate entities.

**Rule of thumb:** if the coverage instinct says "iterate every cell" or "iterate every key of the returned map", translate that instinct into a factory-built field the test loops over (e.g. `symmetryPairs`, `centerCell`) — not into a `*Cases` record. Only method arguments ever become their own Cases.

### 2. Define case types — one per describe block

Name case types `<Entity><Scope>Cases`:

- **`<Entity>`** comes first so related cases cluster alphabetically (e.g. `TypeSingleCases`, `TypePairCases`, `TypePresetCases`, `TypeRandomCases` all sort under `Type*`).
- **`<Scope>`** tells which describe block consumes the case. It's never a new entity — it's just a label for a test group against the same `<Entity>`. Omit it when an entity has a single describe block. Common scopes:
  - `Single` — one case per value of the entity, for tests that hold for every value (invariants).
  - `Pair` — one case per pair of values, for cross-comparison tests.
  - A specific value — one case for tests unique to that value (e.g. `TypePresetCases` only runs for `Type.Preset`).

**Each case record holds only the fields the tests in its describe block consume.** Don't add optional fields "just in case" — that forces every test to destructure data it doesn't use.

Example from `BonusService.test.ts`:

```ts
type TypeSingleCases = {                // invariants shared across every type
  readonly centerCell: Cell;
  readonly type: Type;
};

type TypePairCases = {                  // cross-type comparisons
  readonly randomizer: () => number;
  readonly referenceDistribution: BonusDistribution;
  readonly referenceType: Type;
  readonly variableType: Type;
};

type TypePresetCases = {                // Preset-specific behaviour
  readonly anotherInvocation: BonusDistribution;
  readonly symmetryPairs: ReadonlyArray<readonly [Cell, Cell, Cell, Cell]>;
  readonly type: Type;
};

type TypeRandomCases = {                // Random-specific behaviour
  readonly anotherInvocation: BonusDistribution;
  readonly differentInvocation: BonusDistribution;
  readonly randomizer: () => number;
  readonly type: Type;
};
```

Same entity (`Type`), four distinct scopes, four case records — each narrow to its describe block.

### 3. Build the `<Filename>Cases`

Create a `<Filename>Cases` class with one public factory per cases type: `for<Entity><Scope>()`, returning `ReadonlyArray<<Entity><Scope>Cases>`. Prefix private helpers with `build` and name them in technical/data-structure vocabulary — never the tested code's domain terms (e.g. `buildIndexMatrix` not `buildGrid`, `getOrthogonalNeighbors` not `getAdjacentCells`):

```ts
class BonusServiceCases {
  static forTypeSingle(): ReadonlyArray<TypeSingleCases> { ... }
  static forTypePair(): ReadonlyArray<TypePairCases> { ... }
  static forTypePreset(): ReadonlyArray<TypePresetCases> { ... }
  static forTypeRandom(): ReadonlyArray<TypeRandomCases> { ... }

  private static buildSymmetryQuadruples(): ReadonlyArray<readonly [Cell, Cell, Cell, Cell]> { ... }
}
```

#### Carry data, not assertions

Case fields are **values** a test feeds into a standard matcher:

```ts
expect(serviceCall(...)).matcher(caseField)
```

Do **not** embed assertion closures like `{ check: (d) => expect(d.size).toBeGreaterThan(0) }`. Closures hide what's being tested and route failures to the factory file, not the describe block.

Name each field after the noun the method returns, not after the method itself — in `OrderCases`, an `order` field for the entity, a `total` field for `getTotal(order)`, an `items` field for `listItems(order)`.

**Invariant tests** (symmetry, ordering, bookkeeping over many elements) often have no scalar expected value. Pre-compute the data the invariant iterates over and carry it as a field; the test walks the field and asserts each step with a standard matcher:

```ts
type TypePresetCases = {
  readonly symmetryQuadruples: ReadonlyArray<readonly [Cell, Cell, Cell, Cell]>;
  readonly type: Type;
};

// factory helper — one quadruple (origin, hMirror, vMirror, dMirror) per cell
private static buildSymmetryQuadruples(): ReadonlyArray<readonly [Cell, Cell, Cell, Cell]> { ... }

// test — iterate the field, assert each step
test('distribution is D4-symmetric', () => {
  const distribution = BonusService.createDistribution(type);
  for (const [origin, horizontal, vertical, diagonal] of symmetryQuadruples) {
    const originBonus = distribution.get(origin);
    expect(distribution.get(horizontal)).toBe(originBonus);
    expect(distribution.get(vertical)).toBe(originBonus);
    expect(distribution.get(diagonal)).toBe(originBonus);
  }
});
```

The factory owns WHAT to check; the test owns HOW to assert.

#### Avoid branching in test bodies

If a test body would read `if (x) expect(a).toEqual(b); else expect(a).not.toEqual(b);`, restructure. Two options:

**Option A — split into two factories, one per assertion shape.** Each factory's test has a single concrete matcher call:

```ts
static forTypeMatchingPair(): ReadonlyArray<...> { ... }   // test: expect(a).toEqual(b)
static forTypeDifferingPair(): ReadonlyArray<...> { ... }  // test: expect(a).not.toEqual(b)
```

**Option B — one factory, one expected field per test.** Prefer this when the tests share inputs and differ only in the assertion direction:

```ts
type TypeRandomCases = {
  readonly anotherInvocation: BonusDistribution;    // same randomizer — expect match
  readonly differentInvocation: BonusDistribution;  // off-randomizer — expect differ
  readonly randomizer: () => number;
  readonly type: Type;
};

test('same randomizer returns same distribution', () => {
  expect(BonusService.createDistribution(type, randomizer)).toEqual(anotherInvocation);
});
test('different randomizer returns different distribution', () => {
  expect(BonusService.createDistribution(type, randomizer)).not.toEqual(differentInvocation);
});
```

#### Reuse fixtures for complex entities

When an entity is a rich type (a class instance, a domain object with its own invariants) rather than a primitive or enum, check `/tests/fixtures/` first — if a builder already produces an instance matching the state you need, reuse it in the Cases record instead of constructing one inline:

```ts
// tests/fixtures/OrderFixtures.ts already exposes OrderFixtures.buildEmpty, OrderFixtures.buildWithItems, ...
static forOrder(): ReadonlyArray<OrderCases> {
  return [
    { items: [], order: OrderFixtures.buildEmpty(), total: 0 },
    { items: [item1, item2], order: OrderFixtures.buildWithItems([item1, item2]), total: 20 },
    { items: maxedItems, order: OrderFixtures.buildMaxedOut(), total: 1000 },
  ];
}
```

Only build an entity inline when no fixture fits; in that case add a new builder under `/tests/fixtures/<entity>.ts` so the next test can reuse it.

#### Coverage

Cases must be as extensive as possible. For bounded entities (integers, enums, indices), iterate every value in the valid range — boundaries AND every value in between, not just hand-picked edge cases. For unbounded entities (objects, strings, collections), cover every equivalence class — empty, single, many, boundary states — plus any known edge cases.

#### Skip methods with no logic of their own

If a method's body is just a single-constant comparison (e.g. `value === DEFAULT_VALUE`) or a tiny enum mapping (e.g. `status === Status.Active ? Status.Inactive : Status.Active`), skip it. Any test's expected value can only restate the method's body — the test verifies nothing.

If this leaves an entity with no methods left to test, drop that entity's Cases type and factory entirely (even though the entity appeared in step 1's list).

#### Do not duplicate the tested logic

The factory must not reimplement the formula it is testing, or the test becomes tautological.

For example, if a method computes `Math.floor(itemIndex / PAGE_SIZE)` to return a page number, do not recompute the same formula in the factory — derive expected values from an alternate representation (e.g. a pre-built list of pages where the page number is the array index).

**Exception — invariant tests.** When the test verifies a property (symmetry, ordering, closure) rather than a specific scalar return, encoding that property in the factory is fine: the property IS the specification, not a reimplementation of the method's formula. `buildSymmetryQuadruples` encodes D4 reflection math because D4 symmetry is exactly what the test is ABOUT.

#### Vitest features

Make extensive use of vitest functionality (mocking, snapshots) when it makes the tests better — never just for the sake of using it.

### 4. Write the tests

Use `describe.each` for every factory. The label carries the case identity (e.g. `'for $type'`, `'for $referenceType vs $variableType'`); individual test names state the action (`'distribution excludes center cell'`). Together they pinpoint which case and which method failed.

```ts
describe('BonusService', () => {
  describe.each(BonusServiceCases.forTypeSingle())('for $type', ({ centerCell, type }) => {
    test('distribution excludes center cell', () => {
      expect(BonusService.createDistribution(type).has(centerCell)).toBe(false);
    });
  });

  describe.each(BonusServiceCases.forTypePreset())('for $type', ({ anotherInvocation, symmetryPairs, type }) => {
    test('always returns same distribution', () => {
      expect(BonusService.createDistribution(type)).toEqual(anotherInvocation);
    });

    test('distribution is D4-symmetric', () => {
      const distribution = BonusService.createDistribution(type);
      for (const [origin, horizontal, vertical, diagonal] of symmetryPairs) {
        const originBonus = distribution.get(origin);
        expect(distribution.get(horizontal)).toBe(originBonus);
        expect(distribution.get(vertical)).toBe(originBonus);
        expect(distribution.get(diagonal)).toBe(originBonus);
      }
    });
  });
});
```

Keep test bodies minimal — one matcher per test, consuming the fields from the case. All the logic lives in `<Filename>Cases`. Use vitest hooks (`beforeAll`, `beforeEach`, etc.) only when they make tests better — inline is usually fine since factory-computed values are memoized across the describe.

**Overlapping describe labels are fine.** When two factories iterate the same entity (e.g. `forTypeSingle` and `forTypePreset` both render `'for Preset'`), Vitest emits them as separate blocks side by side; the inner test names disambiguate.

#### Mocking

Mock only at external or unstable boundaries — I/O, network, database, filesystem, system clock, randomness, third-party services. Do **not** mock internal collaborators: if the class under test depends on another pure service in the same domain, let the real one run so the test exercises integrated behavior. Mocking internal code replaces the thing you want to verify with a stand-in that always agrees with your assumptions — the test becomes a mirror of the mock, not of reality.

#### Exceptions

For scenarios that don't fit the entity model (multi-step behavior, one-off integration-like checks), write a standalone `test(...)` block outside any `describe.each` and add a short comment explaining why the factory doesn't apply. Error paths have their own pattern — see [Thrown errors](#thrown-errors) below.

## Stateful classes

Stateful classes hold state across method calls. The flow above still applies — identify entities, define Cases types, build the `<Filename>Cases`, write `describe.each` tests — with the modifications below. The coverage, skip-trivial, duplication, carry-data, avoid-branching, and mocking rules all carry over unchanged.

### 1. Identify entities — also include construction

Method arguments are entities as before. **Additionally**, treat the constructor's arguments as a _construction_ entity — the inputs that produce an instance. Cover every equivalence class of construction input (valid, invalid, edge-of-range) the same way you cover method arguments.

### 2. Build (or reuse) fixtures for every meaningful state

**Before writing a new fixture, check `/tests/fixtures/` — if a builder already covers the state you need, reuse it.** Only add a new builder when no existing one fits; every new fixture goes under `/tests/fixtures/<entity>.ts`.

Fixtures are named functions that return pre-constructed instances in distinct, meaningful states:

```ts
// tests/fixtures/cart.ts
export default class CartFixtures {
  static buildEmpty(): Cart {
    return new Cart();
  }

  static buildWithItems(items: ReadonlyArray<Item> = [defaultItem]): Cart {
    const cart = new Cart();
    items.forEach(item => cart.add(item));
    return cart;
  }

  static buildMaxedOut(): Cart {
    /* ... */
  }

  static buildWithDiscount(discount = 0.1): Cart {
    /* ... */
  }
}
```

Aim to cover every state the class can meaningfully be in — empty, single-element, many-elements, at capacity, after a mutation, post-error-recovery, and so on. **Build each fixture entirely through the class's public API**, never by poking private fields; otherwise the fixture starts lying about what's reachable in production.

Cases records then carry a **fixture builder** (not a pre-built instance — every test must get a fresh one) alongside the action under test and the expected post-state values named after the query methods:

```ts
type CartCases = {
  readonly action: (cart: Cart) => void;
  readonly buildCart: () => Cart;
  readonly itemCount: number; // expected result of cart.getItemCount() after action
  readonly name: string;
  readonly total: number;     // expected result of cart.getTotal() after action
};
```

### 3. Build from the fixture, assert through the public API

Call the fixture builder inside `beforeEach` — never share instances across cases:

```ts
describe.each(<Filename>Cases.forCart())('$name', ({ action, buildCart, itemCount, total }) => {
  let cart: Cart;
  beforeEach(() => {
    cart = buildCart();
  });

  test('updates total', () => {
    action(cart);
    expect(cart.getTotal()).toBe(total);
  });

  test('updates item count', () => {
    action(cart);
    expect(cart.getItemCount()).toBe(itemCount);
  });
});
```

Verify state **only** through the class's public query methods — never by inspecting private fields. Reaching into internals couples the test to the implementation and breaks on every refactor. If the class exposes only mutations with no way to read state back, add public queries first — a class with no observable state isn't really testable.

## Thrown errors

Some methods throw instead of returning. Cover them with a dedicated factory scoped as `Error`, alongside the normal cases:

```ts
type OrderErrorCases = {
  readonly error: new (...args: Array<unknown>) => Error;
  readonly input: Order;
  readonly message?: string | RegExp;
};

class <Filename>Cases {
  static forOrderError(): ReadonlyArray<OrderErrorCases> {
    return [
      { error: ValidationError, input: malformedOrder, message: /missing total/ },
      // ...
    ];
  }
}

describe.each(<Filename>Cases.forOrderError())(
  'for malformed order $input.id',
  ({ error, input, message }) => {
    test('throws', () => {
      const act = () => service.validate(input);
      expect(act).toThrow(error);
      if (message !== undefined) expect(act).toThrow(message);
    });
  },
);
```

**Guidelines:**

- **Match on the error _class_, not the full message.** Messages rot under refactors; class contracts don't. Use the optional `message` field only for a short, load-bearing substring or regex — never the full text.
- **For async throws**, assert with `await expect(service.foo(input)).rejects.toThrow(error)`.
- **The skip-trivial rule still applies.** An unconditional `throw new Error('...')` with no branching isn't worth testing — only throws guarded by a real condition (input validation, invariant check) deserve coverage.

## Validate

Applies to tests for **both stateless services and stateful classes**.

To verify your tests actually catch bugs — not just that they pass — run **mutation testing** with Stryker: `npx stryker run`. Stryker automatically modifies the source in small ways (flips operators, inverts conditions, swaps constants, removes calls) and re-runs the suite against each mutation.

- A mutant **killed** by the tests → your suite caught the change (good).
- A mutant that **survives** → tests still pass despite the code being wrong → a gap in your suite.

Surviving mutants point at exactly which lines your tests don't verify. Add cases until they're killed.
