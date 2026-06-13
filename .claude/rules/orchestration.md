# Readable Orchestration

Applies everywhere business logic is assembled: coordinators, Inngest consumers, providers, hooks, containers, services. Language-agnostic — examples below are Python, but the rules apply equally to TypeScript.

---

## The Core Idea

Top-level orchestration functions should read like a numbered list of steps. You should be able to scan the function body and understand the entire process without reading any implementation details.

**Give every meaningful operation a name.** If an operation involves multiple things — a DB call plus a transformation, two repository calls together, a lookup with a fallback — wrap it in a function whose name describes the **outcome**, not the mechanics.

---

## The Test

> Can you describe what the function does by reading only the function body, without looking at any implementation?

If yes, it is clean. If no, extract until it passes.

---

## Bad vs Good

### Bad: everything inline

```python
# Anti-pattern: business logic tangled with orchestration.
# You have to read SQL, loops, discount math, and email config
# to understand what this function does.

async def process_order(order: IncomingOrder) -> OrderResult:
    buyer = await db.execute(
        select(buyers).where(buyers.c.external_id == order.buyer_id).limit(1)
    )
    if not buyer:
        buyer = await db.execute(
            select(buyers).where(buyers.c.email == order.email).limit(1)
        )
        if not buyer:
            raise ValueError(f"Buyer not found: {order.buyer_id}")

    items = []
    for line in order.lines:
        product = await db.execute(
            select(products).where(products.c.sku == line.sku).limit(1)
        )
        if not product:
            raise ValueError(f"Product not found: {line.sku}")
        if product.stock_count < line.quantity:
            raise ValueError(f"Insufficient stock: {line.sku}")
        items.append({**product, "quantity": line.quantity})

    subtotal_cents = sum(item["price_cents"] * item["quantity"] for item in items)
    discount_percent = 0
    if buyer.tier == "gold":
        discount_percent = 10
    if buyer.tier == "platinum":
        discount_percent = 20
    if subtotal_cents > 50000:
        discount_percent += 5
    discount_cents = round(subtotal_cents * (discount_percent / 100))
    total_cents = subtotal_cents - discount_cents

    for item in items:
        await db.execute(
            update(products)
            .where(products.c.id == item["id"])
            .values(stock_count=products.c.stock_count - item["quantity"])
        )

    saved_order = await db.execute(
        insert(orders)
        .values(buyer_id=buyer.id, total_cents=total_cents, status="confirmed")
        .returning(orders.c.id)
    )

    await email_client.send(
        to=buyer.email,
        template="order-confirmation",
        data={"order_id": saved_order.id, "total": total_cents},
    )

    follow_up_date = (datetime.utcnow() + timedelta(days=3)).isoformat()
    await task_queue.enqueue(
        {"type": "order-followup", "order_id": saved_order.id, "scheduled_for": follow_up_date}
    )

    return OrderResult(order_id=saved_order.id, total_cents=total_cents)
```

80+ lines. You have to read SQL, loops, and discount math to understand the process.

---

### Good: named functions tell the story

```python
# Clean version: the orchestration reads like a numbered plan.
# Each line maps to one business operation.

async def process_order(order: IncomingOrder) -> OrderResult:
    """Orchestrate the full order processing flow."""
    # 1. Resolve the buyer by external ID with email fallback
    buyer = await buyer_service.find_by_external_id_or_email(order.buyer_id, order.email)

    # 2. Validate stock levels for each line item and reserve atomically
    items = await inventory_service.verify_and_reserve(order.lines)

    # 3. Apply tier-based and volume-based discounts to get final pricing
    pricing = pricing_service.calculate_with_discount(items, buyer.tier)

    # 4. Persist the confirmed order record
    saved_order = await order_repository.create(buyer.id, pricing)

    # 5. Send the buyer an order confirmation email
    await notification_service.send_order_confirmation(buyer.email, saved_order)

    # 6. Queue a follow-up task 3 days out
    await scheduler_service.schedule_follow_up(saved_order.id, days_from_now=3)

    return OrderResult(order_id=saved_order.id, total_cents=pricing.total_cents)
```

Read it out loud: find buyer → verify inventory → calculate price → create order → send confirmation → schedule follow-up. You understand the whole process in 5 seconds.

---

## Where the Complexity Goes

Each named function hides real work. That is the point.

```python
# buyer_service.find_by_external_id_or_email
# Tries external_id first, falls back to email. Raises BuyerNotFoundError.

# inventory_service.verify_and_reserve
# Checks stock for each line item. Reserves atomically. Raises InsufficientStockError.

# pricing_service.calculate_with_discount
# Applies tier-based and volume-based discounts.
# Returns PricingResult(subtotal_cents, discount_cents, total_cents).

# order_repository.create
# Inserts the order row. Returns the saved OrderRecord.

# notification_service.send_order_confirmation
# Formats and sends the email. Logs internally.

# scheduler_service.schedule_follow_up
# Calculates the target date. Enqueues the task.
```

Each one is testable in isolation, named for the outcome, and owns one concern.

---

## Rules of Thumb

### 1. Name functions for outcomes, not mechanics

```python
# Bad — describes mechanics
query_buyer_table(external_id)
loop_items_check_stock_decrement(lines)

# Good — describes outcome
find_by_external_id_or_email(external_id, email)
verify_and_reserve(lines)
```

### 2. One thought per line in the orchestration layer

Each line in a coordinator, consumer, or service orchestrator maps to one step. If a line needs a comment to explain *what* it does, rename the function.

Comments in orchestration functions explain *why*, not *what*.

### 3. Inline conditionals are a sign something should be extracted

`if/else` branches in the glue layer are business logic pretending to be orchestration.

```python
# Bad — glue layer knows about tier rules
discount_percent = 0
if buyer.tier == "gold":
    discount_percent = 10
if buyer.tier == "platinum":
    discount_percent = 20

# Good — service owns the rules
pricing = pricing_service.calculate_with_discount(items, buyer.tier)
```

The orchestration function should not know what "gold" or "platinum" mean.

### 4. Push logging into the function that does the work

Logging in the glue layer adds noise. The function that did the work knows the most about what happened.

```python
# Bad — logging clutters orchestration
buyer = await buyer_service.find_by_external_id_or_email(order.buyer_id, order.email)
logger.info(f"Resolved buyer {buyer.id}")
items = await inventory_service.verify_and_reserve(order.lines)
logger.info(f"Reserved {len(items)} items")

# Good — each service logs internally, orchestration stays clean
buyer = await buyer_service.find_by_external_id_or_email(order.buyer_id, order.email)
items = await inventory_service.verify_and_reserve(order.lines)
```

### 5. Extract "compute + format" into private helpers

Any calculation inline in an orchestration function is a candidate for extraction.

```python
# Bad — date math inline
follow_up_date = (datetime.utcnow() + timedelta(days=3)).isoformat()
await task_queue.enqueue({"scheduled_for": follow_up_date, ...})

# Good — named helper hides the math
await scheduler_service.schedule_follow_up(order_id, days_from_now=3)
```

### 6. Keep the orchestration function short

If the glue function exceeds ~15 lines, extract until it does.

### 7. Services combine things

A service method is not always just a thin repo wrapper. It earns its existence when it:
- Combines multiple repository calls
- Applies business rules
- Bridges two domains (e.g. fallback strategy)
- Wraps infrastructure (email client, task queue)
- Encapsulates date/time logic

A thin wrapper (`return repo.insert(data)`) is still fine. The value shows up when non-trivial logic gets hidden behind a descriptive name.

---

## The "New Hire" Test

Read your orchestration function out loud as if explaining the process to someone on day one.

If you find yourself saying "and then we do this complicated thing where…" — that is a function waiting to be extracted.

If every line maps to a plain English sentence, you are done.

---

## Testing Payoff

When each operation is its own function, tests become simple and focused.

```python
def test_calculate_with_discount_gold_tier():
    """Gold tier receives a 10% discount."""
    items = [LineItem(price_cents=1000, quantity=2)]
    result = pricing_service.calculate_with_discount(items, tier="gold")
    assert result.discount_cents == 200
    assert result.total_cents == 1800
```

No DB setup. No mocks for services you do not care about. Each unit is tested against its own contract.
