# Pydantic v2 (FastAPI) — Deep Pattern Reference

Assumes Pydantic v2 (Rust-based core, 5–50x faster than v1). If inheriting a v1 codebase: `@validator`/`@root_validator` are **removed**, not deprecated — see the migration section at the bottom.

## Model config — set these deliberately

```python
from pydantic import BaseModel, ConfigDict

class StrictInput(BaseModel):
    model_config = ConfigDict(
        strict=True,             # reject type coercion — "29.99" is NOT accepted for a float field
        extra="forbid",          # reject unknown fields instead of silently dropping them
        str_strip_whitespace=True,  # auto-trim all string fields
    )
```

- **`strict=True`**: Pydantic normally coerces types for convenience (`"29.99"` → `29.99`, `123` → `"123"`). This is fine for most fields but dangerous for money, IDs, and auth-adjacent fields where a type mismatch usually means a client bug worth surfacing, not silently fixing. Turn it on per-model for sensitive inputs, not globally by default.
- **`extra="forbid"`**: without this, unexpected fields are silently dropped. Forbidding them catches client bugs early and is a cheap defense against mass-assignment-style issues (a client sending `role: "admin"` into a field you never intended to accept).
- **`from_attributes=True`**: put this on **response** models so you can build them directly from an ORM object (`UserResponse.model_validate(db_user)`), instead of manually unpacking fields.

## Field-level validation and normalization

```python
from pydantic import BaseModel, Field, field_validator

class CreateUserInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()   # normalize BEFORE any uniqueness check happens downstream
```

`@field_validator` supports `mode="before"` (runs before Pydantic's own type coercion — useful for pre-cleaning raw input) and `mode="after"` (default; runs on the already-typed value).

## Cross-field validation

```python
from pydantic import BaseModel, model_validator
from datetime import date

class Reservation(BaseModel):
    check_in: date
    check_out: date

    @model_validator(mode="after")
    def validate_date_range(self) -> "Reservation":
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self
```

Use `@model_validator(mode="after")` (replaces v1's `@root_validator`) whenever a rule spans multiple fields — password confirmation, date ranges, "field B required if field A is set."

## Async validation (uniqueness, DB-dependent checks)

Pydantic validators are synchronous by design. Don't fight this — validate shape in the model, then do async/DB-dependent checks explicitly in your service/route function, and raise your own domain exception mapped to a 409:

```python
class CreateUserInput(BaseModel):
    email: str
    # shape-only validation here

async def create_user(input: CreateUserInput):
    if await user_repo.exists_by_email(input.email):
        raise EmailAlreadyRegistered(input.email)  # → mapped to 409 Conflict in your error handler
    ...
```

## Computed fields (response-only derived values)

```python
from pydantic import BaseModel, ConfigDict, computed_field

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    items: list[OrderItemResponse]

    @computed_field
    @property
    def total_cents(self) -> int:
        return sum(i.quantity * i.unit_price_cents for i in self.items)
```

Keeps derived values (totals, counts, ages) out of the request handler and colocated with the shape that produces them.

## Discriminated unions (payloads that vary by a type field)

```python
from typing import Literal, Union, Annotated
from pydantic import BaseModel, Field

class EmailNotification(BaseModel):
    channel: Literal["email"]
    email_address: str

class SmsNotification(BaseModel):
    channel: Literal["sms"]
    phone_number: str

NotificationConfig = Annotated[
    Union[EmailNotification, SmsNotification],
    Field(discriminator="channel"),
]
```

## Reusable validation via Annotated types

Prefer this over repeating the same `@field_validator` across many models:

```python
from typing import Annotated
from pydantic import AfterValidator

def normalize_email(v: str) -> str:
    return v.strip().lower()

Email = Annotated[str, AfterValidator(normalize_email)]

class CreateUserInput(BaseModel):
    email: Email   # reusable across every model that needs an email field
```

## FastAPI integration essentials

```python
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/users", response_model=UserResponse)   # separate input/output models, always
async def create_user(input: CreateUserInput):
    ...

# Centralize error formatting instead of letting FastAPI's default 422 body leak through
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={
            "type": "https://api.example.com/errors/validation-failed",
            "title": "Validation failed",
            "status": 400,
            "errors": [
                {"field": ".".join(str(p) for p in e["loc"][1:]), "message": e["msg"]}
                for e in exc.errors()
            ],
        },
    )
```

`response_model=UserResponse` is what actually enforces the output shape — declaring the input model alone does not stop you from accidentally returning the raw DB entity from the function body; FastAPI filters it through `response_model` at serialization time.

## v1 → v2 migration gotchas (if inheriting an older codebase)

- `@validator` → `@field_validator`; `@root_validator` → `@model_validator`. These are **removed** in v2, not deprecated — old code fails at import/definition time, not silently at runtime, so it's at least loud.
- `class Config:` → `model_config = ConfigDict(...)`. A plain dict without `ConfigDict` will silently ignore settings — import `ConfigDict` explicitly.
- Optional fields need explicit defaults now — `age: int | None` without `= None` still requires the field to be passed.
- `.errors()` on a `ValidationError` returns a list of dicts (not tuples) — any code iterating over the old shape needs updating.
- Pin `pydantic>=2.x` and `fastapi>=0.100.0` together — older FastAPI versions don't support Pydantic v2 request validation.
