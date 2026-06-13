# Backend Rules — apps/api (Python / FastAPI)

The codebase is actively being refactored. Ignore legacy code that violates these rules. Write all new code to this standard.

---

## Layer Map (read this first)

```
HTTP Request
    ↓
Controller          # Validates shape, delegates. No logic.
    ↓
Coordinator         # Synchronous orchestration before HTTP response.
    ↓
Provider(s)         # Atomic business logic. Calls repositories + other providers.
    ↓
Repository          # One external call. Returns raw response. No logic.
    ↓
Producer            # Emits Inngest event. Hands off to async world.
         ↓
    Inngest Consumer # Durable saga. Wraps providers in step.run().
```

Providers are shared by coordinators and Inngest consumers. A provider does not know who calls it.

---

## 1. Domain Structure

All domains live inside `services/`. Every domain follows this exact layout — no exceptions:

```
services/{domain}/
  controllers/
  repository/
  schemas/
  services/
    producers/
    consumers/
    coordinators/
    providers/
```

Domain folder names use `snake_case` and match the Inngest event service prefix.

---

## 2. Layer Rules

### Controllers
- Accept an HTTP request, validate input shape via a Pydantic schema, call **one** coordinator or provider, return an HTTP response.
- No `if` branching on business logic.
- No direct repository calls.
- No exception handling beyond HTTP response shaping.

```python
@router.post("/swings", response_model=SwingResponse)
async def create_swing(
    body: CreateSwingRequest,
    coordinator: SwingCoordinator = Depends(get_swing_coordinator),
) -> SwingResponse:
    return await coordinator.create(body)
```

### Repositories
- One job: call the external service (Supabase, Clerk, Stripe, OpenAI, etc.) and return the response.
- No transformation. No logic. No branching.
- Return types must be Pydantic models — never raw dicts.

```python
async def fetch_swing(self, swing_id: str) -> SwingRecord:
    result = await self._client.table("swings").select("*").eq("id", swing_id).single().execute()
    return SwingRecord.model_validate(result.data)
```

### Providers
- The atom of business logic. One focused responsibility per provider.
- May call repositories and other providers.
- Must be callable from both a coordinator and an Inngest `step.run()` without modification.
- All arguments and return values must be typed Pydantic models or primitives.

```python
async def analyze_swing_trajectory(self, swing: SwingRecord) -> TrajectoryResult:
    ...
```

### Coordinators
- Synchronous orchestration layer. Runs inside the HTTP request/response cycle.
- Reads like a numbered recipe — call providers in sequence, then emit events and return.
- Must not contain business logic.
- Must not call repositories directly — go through providers.
- Never put `step.run()` calls here.

```python
async def create(self, body: CreateSwingRequest) -> SwingResponse:
    swing = await self.swing_provider.create(body)
    analysis = await self.analysis_provider.prepare(swing)
    await self.swing_producer.emit_created(swing)
    return SwingResponse.from_domain(swing)
```

### Producers
- Call `inngest_client.send_event(...)`. That is all.
- No logic. No transformation. One method per event type.

```python
async def emit_created(self, swing: SwingRecord) -> None:
    await inngest_client.send_event(
        inngest.Event(name="swing/swing.created", data={"swing_id": swing.id})
    )
```

### Consumers (Inngest functions)
- Register one `@inngest_client.create_function(...)` handler per event.
- Every provider call must be wrapped in `step.run()`. No exceptions.
- No business logic inside the consumer itself — call providers only.
- Steps are checkpoints: if a step fails, only that step retries.

```python
@inngest_client.create_function(
    fn_id="analyze-swing",
    trigger=inngest.TriggerEvent(event="swing/swing.created"),
)
async def analyze_swing(ctx: inngest.Context, step: inngest.Step) -> None:
    swing = await step.run("fetch-swing", lambda: swing_provider.fetch(ctx.event.data["swing_id"]))
    result = await step.run("run-analysis", lambda: analysis_provider.run(swing))
    await step.run("save-result", lambda: analysis_provider.save(result))
```

---

## 3. Coordinator vs Inngest — Decision Rule

Ask one question: **does the result need to be in the HTTP response?**

| Condition | Use |
|---|---|
| Result must be in the HTTP response | Coordinator |
| Work can happen after the response | Inngest |
| Work needs retry logic | Inngest |
| Work can sleep or span time | Inngest |
| Work must not fail the HTTP response | Inngest |

Never put `step.run()` inside a coordinator. Never call providers inside a consumer without `step.run()`.

---

## 4. Inngest Event Naming

Format: `{domain}/{resource}.{action}`

- Domain prefix matches the `services/{domain}` folder name exactly.
- Resource is the noun (snake_case).
- Action is past tense snake_case.
- No PII in the event name — PII belongs in `data` only.

```
swing/swing.created
identity_access/user.coach_assigned
coaching/session.completed
```

---

## 5. FastAPI Conventions

### Routers
- One router per domain. Registered in the top-level app factory.
- Prefix matches the domain name: `/swings`, `/users`, `/sessions`.

### Dependency Injection
- Use FastAPI `Depends()` to inject coordinators, providers, and repositories into controllers.
- Do not instantiate services inside controllers.
- Keep dependency factories in a `dependencies.py` file at the domain or app level.

### Lifespan
- Database connection pools, Inngest setup, and other startup/shutdown concerns belong in the FastAPI `lifespan` context manager.
- Do not use deprecated `@app.on_event("startup")`.

```python
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    await db.connect()
    yield
    await db.disconnect()
```

### Response Models
- Always declare `response_model` on route decorators.
- Return Pydantic models — never raw dicts.

### HTTP Status Codes
- `201` for resource creation. `204` for no-content responses. `200` for everything else.
- Raise `HTTPException` with appropriate codes for error cases in controllers only.

---

## 6. Python Conventions

### Imports
- All imports go at the **top of the file**. No imports inside functions, methods, or classes.
- Order: standard library → third-party → internal. One blank line between each group.

```python
import asyncio
from contextlib import asynccontextmanager

from fastapi import Depends, HTTPException
from pydantic import BaseModel

from services.swing.schemas.swing_schema import SwingRecord
from services.swing.repository.swing_repository import SwingRepository
```

### Naming
- `snake_case` for all files, folders, functions, variables, and module names.
- `PascalCase` for classes and Pydantic models.
- `UPPER_SNAKE_CASE` for constants.

### Type Annotations
- Required on all function signatures — parameters and return types.
- Use `Optional[T]` or `T | None` for nullable values.
- No `Any` unless genuinely unavoidable and documented.

### Pydantic
- All data crossing layer boundaries must be a Pydantic model — never a raw `dict`.
- Use `model_validate()` to construct from external data.
- Separate request schemas (inbound), response schemas (outbound), and domain models (internal).

### Strings
- f-strings for all string formatting. No `%` formatting or `.format()`.

### Async
- All I/O-bound work (DB calls, HTTP calls, Inngest events) must be `async`.
- Do not mix sync and async in the same call chain without explicit handling.

---

## 7. Docstrings

All public functions, methods, and classes require a docstring. Use **Google style**.

### Functions and Methods

```python
async def analyze_swing(self, swing: SwingRecord) -> TrajectoryResult:
    """Analyze the trajectory of a recorded swing.

    Args:
        swing: The swing record containing raw sensor data.

    Returns:
        A TrajectoryResult with computed path and club head speed.

    Raises:
        ValueError: If the swing record contains no sensor frames.
    """
```

### Classes

```python
class SwingProvider:
    """Handles all business logic for swing creation and analysis.

    This provider is the single source of truth for swing-related operations.
    It is called by both coordinators (synchronous path) and Inngest consumers
    (async durable path).
    """
```

### Rules
- One-line summary on the first line. Blank line before `Args`, `Returns`, `Raises`.
- `Args` section required when the function has parameters.
- `Returns` section required when the function returns a non-trivial value.
- `Raises` section required when the function raises exceptions explicitly.
- Private methods (`_method`) only need a docstring if the logic is non-obvious.
- Do not restate the type — it's in the signature. Describe intent and behavior.
- Do not add inline comments unless the logic is genuinely non-obvious.

### Coordinator and Inngest Consumer Step Comments

Coordinators and Inngest consumers are sequential by nature. Number each step with a comment so the flow is immediately readable.

Format: `# {n}. {description}`

**Coordinator example:**
```python
async def create(self, body: CreateSwingRequest) -> SwingResponse:
    """Orchestrate swing creation and kick off async analysis."""
    # 1. Persist the new swing record
    swing = await self.swing_provider.create(body)

    # 2. Prepare the analysis job metadata
    analysis_job = await self.analysis_provider.prepare(swing)

    # 3. Emit event to trigger async analysis pipeline
    await self.swing_producer.emit_created(swing)

    return SwingResponse.from_domain(swing)
```

**Inngest consumer example:**
```python
async def analyze_swing(ctx: inngest.Context, step: inngest.Step) -> None:
    """Durable pipeline for full swing analysis after creation."""
    # 1. Fetch the swing record from the database
    swing = await step.run("fetch-swing", lambda: swing_provider.fetch(ctx.event.data["swing_id"]))

    # 2. Run trajectory and biomechanics analysis
    result = await step.run("run-analysis", lambda: analysis_provider.run(swing))

    # 3. Persist the analysis result
    await step.run("save-result", lambda: analysis_provider.save(result))
```

---

## 8. Error Handling

- Raise domain-specific exceptions from providers. Catch and translate them to `HTTPException` in controllers only.
- Do not swallow exceptions silently.
- Do not catch broad `Exception` unless at the outermost application boundary.
- Inngest consumers let Inngest handle retries — do not wrap `step.run()` in try/except unless you are handling a known recoverable error with specific logic.

---

## Hard Rules (never violate)

- No logic in controllers or repositories
- No raw dicts crossing layer boundaries — always Pydantic
- All imports at the top of the file — never inside functions or classes
- Type annotations on every function signature
- Docstrings on all public functions, methods, and classes (Google style)
- No `step.run()` inside coordinators
- No provider calls inside Inngest consumers without `step.run()`
- No PII in Inngest event names
- `async` for all I/O — no blocking calls on the async event loop
