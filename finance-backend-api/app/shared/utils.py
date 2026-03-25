from datetime import datetime, date
from typing import Optional
from fastapi import Query


def get_pagination(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of records to return"),
):
    return {"skip": skip, "limit": limit}


def parse_month(month_str: str) -> tuple[date, date]:
    """Given 'YYYY-MM', return first and last day of that month as dates."""
    dt = datetime.strptime(month_str, "%Y-%m")
    first_day = dt.date().replace(day=1)
    if first_day.month == 12:
        last_day = first_day.replace(year=first_day.year + 1, month=1, day=1)
    else:
        last_day = first_day.replace(month=first_day.month + 1, day=1)
    return first_day, last_day
