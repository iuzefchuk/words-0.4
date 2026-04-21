HOW TO UNIT TEST
================

Follow these steps when writing unit tests for a class/service.

## 1. Identify entities

Read the file that is being tested and identify the entities. To do so, look at the methods of the class and the arguments they accept — those arguments are your entities.
For example, if the service under test exposes `getTotal(order)`, `applyCoupon(order, coupon)`, and `validate(amount)`, the entities are `order`, `coupon`, and `amount`.

## 2. Define case types

Define one type per entity at the top of the test file. Name them with the plural suffix `Cases` (e.g. `OrderCases`, `CouponCases`, `AmountCases`). You can skip the exact field values until step 3.

## 3. Build the `CasesFactory`

Create a `CasesFactory` class with one public method per entity (`create<Entity>Cases()`). Use as many private helper methods as you need.
Each Cases record contains the entity itself plus one expected value per method where the entity appears as an argument. Name each expected-value field after the noun the method returns, not after the method itself — e.g. in `OrderCases`, an `order` field for the entity, a `total` field for `getTotal(order)`, an `items` field for `listItems(order)`.

### Coverage

Cases must be as extensive as possible. For bounded entities (integers, enums, indices), iterate every value in the valid range — boundaries AND every value in between, not just hand-picked edge cases. For unbounded entities (objects, strings, collections), cover every equivalence class — empty, single, many, boundary states — plus any known edge cases.

### Skip methods with no logic of their own

If a method's body is just a single-constant comparison (e.g. `value === DEFAULT_VALUE`) or a tiny enum mapping (e.g. `status === Status.Active ? Status.Inactive : Status.Active`), skip it. Any test's expected value can only restate the method's body — the test verifies nothing.
If this leaves an entity with no methods left to test, drop that entity's Cases type and factory method entirely (even though the entity appeared in step 1's list).

### Do not duplicate the tested logic

The factory must not reimplement the formula it is testing, or the test becomes tautological.
For example, if a method computes `Math.floor(itemIndex / PAGE_SIZE)` to return a page number, do not recompute the same formula in the factory — derive expected values from an alternate representation (e.g. a pre-built list of pages where the page number is the array index). Prefix helpers and locals that build the alternate representation with `Alt` (e.g. `buildAltGrid`, `altPages`) so the alternate model is visually distinct from the tested code's vocabulary.

### Vitest features

Make extensive use of vitest functionality (mocking, snapshots) when it makes the tests better — never just for the sake of using it.

## 4. Write the tests

Use `describe.each` for every entity to run tests on every case. The `describe.each` label carries the case identity (e.g. `'for order $order.id'`), so individual test names only need to name the action under test (e.g. `'calculates total'`). Together they must pinpoint which case and which method failed.
Keep test descriptions minimal; all the logic lives in `CasesFactory`.
Again, use vitest functionality (`beforeAll`, `afterAll`, `beforeEach`, `afterEach`, snapshots) only when it makes the tests better.

### Mocking

Mock only at external or unstable boundaries — I/O, network, database, filesystem, system clock, randomness, third-party services. Do **not** mock internal collaborators: if the class under test depends on another pure service in the same domain, let the real one run so the test exercises integrated behavior. Mocking internal code replaces the thing you want to verify with a stand-in that always agrees with your assumptions — the test becomes a mirror of the mock, not of reality.

### Exceptions

For scenarios that don't fit the entity model (error paths, multi-step behavior, one-off integration-like checks), write a standalone `test(...)` block outside any `describe.each` and add a short comment explaining why the factory doesn't apply.

## 5. Validate

To verify your tests actually catch bugs — not just that they pass — run **mutation testing** with Stryker: `npm run mutate`. Stryker automatically modifies the source in small ways (flips operators, inverts conditions, swaps constants, removes calls) and re-runs the suite against each mutation.

- A mutant **killed** by the tests → your suite caught the change (good).
- A mutant that **survives** → tests still pass despite the code being wrong → a gap in your suite.

Surviving mutants point at exactly which lines your tests don't verify. Add cases until they're killed.
