from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from app.modules.users.models import User  # noqa: E402,F401
from app.modules.auth.models import RefreshToken  # noqa: E402,F401