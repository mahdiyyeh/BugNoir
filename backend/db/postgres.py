"""
PostgreSQL connection and conversation logging.
Falls back gracefully if DB unavailable.
"""
import os
from contextlib import contextmanager
from typing import Optional, Generator
import logging

logger = logging.getLogger(__name__)

# TODO: Real DATABASE_URL when PostgreSQL is running
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost:5432/local_db")

_engine = None


def get_engine():
    """Lazy init SQLAlchemy engine; returns None if DB unavailable."""
    global _engine
    if _engine is not None:
        return _engine
    try:
        from sqlalchemy import create_engine
        _engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        return _engine
    except Exception as e:
        logger.warning("PostgreSQL unavailable, conversation logging disabled: %s", e)
        return None


@contextmanager
def get_session() -> Generator[Optional[object], None, None]:
    """Yield a DB session or None if DB unavailable."""
    engine = get_engine()
    if engine is None:
        yield None
        return
    try:
        from sqlalchemy.orm import sessionmaker
        Session = sessionmaker(bind=engine, autoflush=False)
        session = Session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
    except Exception as e:
        logger.warning("Session failed: %s", e)
        yield None


def log_conversation(user_id: str, location_type: str, query_preview: str, response_preview: str) -> None:
    """Log conversation to PostgreSQL. No-op if DB unavailable."""
    engine = get_engine()
    if engine is None:
        return
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(
                text(
                    """
                    INSERT INTO conversation_log (user_id, location_type, query_preview, response_preview, created_at)
                    VALUES (:user_id, :location_type, :query_preview, :response_preview, NOW())
                    """
                ),
                {
                    "user_id": user_id,
                    "location_type": location_type,
                    "query_preview": query_preview[:500],
                    "response_preview": response_preview[:500],
                },
            )
            conn.commit()
    except Exception as e:
        logger.warning("Failed to log conversation: %s", e)
