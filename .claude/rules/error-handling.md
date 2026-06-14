# Error Handling — Python / FastAPI / Inngest

> **DORMANT mechanics, live principle.** The FastAPI/Inngest specifics here apply only once a
> backend exists (see `backend.md`). But the *core principle* below — raise deep, catch at the
> edge, let exceptions bubble through intermediate layers — is language-agnostic and should
> guide error handling in the mobile app too (raise in `packages/core`/repositories, catch in
> coordinators which return a typed `Result<T>`). Ignore the Python code; keep the philosophy.

## The Fundamental Principle

**Raise where you know what went wrong. Catch at the edge of your system.**

Never catch exceptions at intermediate layers "just to be safe." Raise once, deep in the stack. Catch once, at the app boundary. Everything in between lets exceptions bubble automatically.

---

## Concept: Bubbling

When a function raises an exception and doesn't catch it, Python passes it up to the caller. If the caller doesn't catch it, it passes up again. This continues until something catches it.

```python
def provider():
    raise NotFoundError("Swing not found.")

def coordinator():
    return provider()   # NotFoundError bubbles through — no code needed

def controller():
    return coordinator()  # NotFoundError bubbles through — no code needed

# FastAPI global handler catches it here and returns 404 JSON
```

You write `raise` once. The exception travels the entire stack for free.

---

## Exception Hierarchy

Define exceptions as a class tree in `services/_common/exceptions/exceptions.py`.
The base class lets you catch everything if needed. Subclasses let you be specific.
These are **domain concepts** — they do not know about HTTP status codes.

```python
class AppError(Exception):
    """Base for all domain exceptions. Never raise this directly."""
    pass

class NotFoundError(AppError):
    """A requested resource does not exist."""
    pass

class ConflictError(AppError):
    """An operation conflicts with existing state (e.g. duplicate)."""
    pass

class ForbiddenError(AppError):
    """Caller is authenticated but lacks permission."""
    pass

class UnauthorizedError(AppError):
    """Caller is not authenticated."""
    pass

class BadRequestError(AppError):
    """Request violates a business rule."""
    pass
```

---

## Domain Exceptions vs Infrastructure Exceptions

**Domain errors** — your code decided something is wrong. Intentional and expected.

**Infrastructure errors** — the outside world failed (DB dropped, API timed out). Unexpected.

Infrastructure errors must never escape the repository layer. Wrap them in domain exceptions so the rest of the app only ever sees your language.

```python
async def fetch_swing(self, swing_id: str) -> SwingRecord:
    try:
        result = await self.db.table("swings").select("*").eq("id", swing_id).single().execute()
    except PostgresError as exc:
        raise AppError("Database unavailable.") from exc  # wrap, don't expose

    if result.data is None:
        raise NotFoundError(f"Swing {swing_id} not found.")  # domain decision

    return SwingRecord.model_validate(result.data)
```

`raise X from Y` preserves the original traceback in your logs while presenting only the domain exception to callers.

---

## What Each Layer Does With Exceptions

| Layer | Rule |
|---|---|
| Repository | Catches infrastructure errors, wraps in domain exceptions. Raises domain exceptions for missing/invalid data. |
| Provider | Raises domain exceptions directly. No catching. |
| Coordinator | No try/except. Calls providers in sequence. Exceptions bubble through. |
| Controller | No try/except. Calls coordinator, returns result. Exceptions bubble through. |
| Global handler | The one place domain exceptions become HTTP responses. |

---

## FastAPI Global Handlers

Register all handlers in `services/_common/exceptions/handlers.py`. This is the **only** place where domain exceptions are translated to HTTP responses.

```python
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from services._common.exceptions.exceptions import (
    NotFoundError, ConflictError, ForbiddenError,
    UnauthorizedError, BadRequestError, AppError,
)


def register_exception_handlers(app: FastAPI) -> None:
    """Register all global exception handlers on the FastAPI app.

    Specific handlers are registered first. The broad Exception catch-all
    is registered last — FastAPI matches most-specific first.

    Args:
        app: The FastAPI application instance.
    """

    async def _not_found(_: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse({"success": False, "error": str(exc)}, status_code=404)

    async def _conflict(_: Request, exc: ConflictError) -> JSONResponse:
        return JSONResponse({"success": False, "error": str(exc)}, status_code=409)

    async def _forbidden(_: Request, exc: ForbiddenError) -> JSONResponse:
        return JSONResponse({"success": False, "error": str(exc)}, status_code=403)

    async def _unauthorized(_: Request, exc: UnauthorizedError) -> JSONResponse:
        return JSONResponse({"success": False, "error": str(exc)}, status_code=401)

    async def _bad_request(_: Request, exc: BadRequestError) -> JSONResponse:
        return JSONResponse({"success": False, "error": str(exc)}, status_code=400)

    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        # Pydantic raised this when the request body failed schema validation.
        # Return 422 with a clean message — never expose Pydantic internals.
        return JSONResponse({"success": False, "error": "Invalid request."}, status_code=422)

    async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
        # A bug or truly unexpected failure. Log it. Never expose internal details.
        return JSONResponse({"success": False, "error": "An unexpected error occurred."}, status_code=500)

    app.add_exception_handler(NotFoundError, _not_found)
    app.add_exception_handler(ConflictError, _conflict)
    app.add_exception_handler(ForbiddenError, _forbidden)
    app.add_exception_handler(UnauthorizedError, _unauthorized)
    app.add_exception_handler(BadRequestError, _bad_request)
    app.add_exception_handler(RequestValidationError, _validation_error)
    app.add_exception_handler(Exception, _unhandled)  # catch-all — always last
```

In `main.py`:

```python
app = FastAPI(lifespan=lifespan)
register_exception_handlers(app)  # done — never touch exception handling again
```

---

## Full Layer Example

```python
# Repository — wraps infrastructure, raises domain exceptions
async def fetch_user(self, user_id: str) -> UserRecord:
    try:
        result = await self.db.table("users").select("*").eq("id", user_id).single().execute()
    except PostgresError as exc:
        raise AppError("Database unavailable.") from exc

    if result.data is None:
        raise NotFoundError(f"User {user_id} not found.")

    return UserRecord.model_validate(result.data)


# Provider — makes business decisions, raises domain exceptions
async def assign_coach(self, user_id: str, coach_id: str) -> None:
    user = await self.user_repo.fetch_user(user_id)   # bubbles NotFoundError if missing

    if user.coach_id is not None:
        raise ConflictError(f"User {user_id} already has a coach.")

    coach = await self.user_repo.fetch_user(coach_id)  # bubbles NotFoundError if missing

    if not coach.is_coach:
        raise BadRequestError(f"User {coach_id} is not a coach.")

    await self.user_repo.set_coach(user_id, coach_id)


# Coordinator — no exception handling
async def onboard(self, body: OnboardRequest) -> UserResponse:
    user = await self.user_provider.create(body)
    await self.user_producer.emit_created(user)
    return UserResponse.from_domain(user)


# Controller — no exception handling
@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    body: CreateUserRequest,
    coordinator: UserCoordinator = Depends(get_user_coordinator),
) -> UserResponse:
    return await coordinator.onboard(body)
```

---

## Inngest: Different Rules

Inngest consumers run in the background with a retry engine — not a waiting HTTP caller. The rules are inverted: **never catch exceptions inside consumers.** Let them propagate so Inngest can retry the failed step.

```python
@register
@inngest_client.create_function(
    fn_id="analyze-swing",
    trigger=inngest.TriggerEvent(event="swing/swing.created"),
    retries=3,
)
async def analyze_swing(ctx: inngest.Context, step: inngest.Step) -> None:
    """Durable pipeline for swing analysis after creation."""
    # If any step raises, Inngest retries that step.
    # Do NOT wrap in try/except.
    swing = await step.run("fetch-swing", lambda: swing_provider.fetch(ctx.event.data["swing_id"]))
    result = await step.run("run-analysis", lambda: analysis_provider.run(swing))
    await step.run("save-result", lambda: analysis_provider.save(result))
```

If data is permanently bad and retrying will never help, fail immediately:

```python
if not swing.has_keypoints:
    raise inngest.NonRetriableError("Swing has no keypoint data. Cannot analyze.")
```

---

## Hard Rules

- No `try/except` in controllers or coordinators — ever
- No `try/except` inside Inngest consumers — let Inngest retry
- Infrastructure errors (DB, external APIs) must not escape repositories — wrap them
- Never raise `HTTPException` from providers or below — that's HTTP leaking into domain
- Never expose internal error details (stack traces, DB errors) in HTTP responses
- Always use `raise X from Y` when wrapping one exception in another
- The `Exception` catch-all handler must always be registered last
