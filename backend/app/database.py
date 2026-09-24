"""
EduEye Database Layer
Configures PostgreSQL (Supabase / Neon) with fallback to SQLite for local development.
Also provides Redis client integration for caching.
"""

import os
import json
from datetime import datetime, timezone
from typing import Generator, Optional
from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# 1. Database Connection (PostgreSQL: Supabase/Neon, or local SQLite fallback)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    os.getenv("POSTGRES_URL", "sqlite:///./edueye.db")
)

# Fix for Heroku/Supabase postgres:// scheme if needed
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# 2. Redis Integration (for caching & Celery broker)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


# 3. Database ORM Models
class StudentRecord(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    predicted_grade = Column(Float, default=84.0)
    risk_tier = Column(String, default="OPTIMAL")  # OPTIMAL | REMEDIATING | CRITICAL
    attendance_rate = Column(Float, default=92.0)
    active_deficits_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def active_deficits(self):
        try:
            return json.loads(self.active_deficits_json)
        except Exception:
            return []

    @active_deficits.setter
    def active_deficits(self, val):
        self.active_deficits_json = json.dumps(val)


class AssessmentRecord(Base):
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, index=True, nullable=False)
    course = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    score = Column(Float, nullable=False)
    max_score = Column(Float, default=100.0)
    expected_lag_hours = Column(Float, default=24.0)
    actual_lag_hours = Column(Float, default=24.0)
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AuditLogRecord(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    student_id = Column(String, index=True, nullable=False)
    action_type = Column(String, nullable=False)  # AUTO_SCHEDULED | QUIZ_RESOLVED | TA_ESCALATED | LMS_INGESTED
    description = Column(Text, nullable=False)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
