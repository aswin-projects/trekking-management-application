from datetime import datetime, timedelta
from extensions import celery, db, safe_cache
from models import Booking, Trek, Notification, User


@celery.task(name="tasks.send_booking_confirmation")
def send_booking_confirmation(booking_id):
    """Simulates sending a confirmation email/SMS when a user books a trek."""
    booking = Booking.query.get(booking_id)
    if not booking:
        return f"Booking {booking_id} not found"

    subject = f"Booking Confirmed: {booking.trek.name}"
    body = (
        f"Hi {booking.user.name}, your booking for '{booking.trek.name}' "
        f"({booking.num_slots} slot(s)) on {booking.trek.start_date} has been confirmed. "
        f"Status: {booking.status}."
    )
    note = Notification(user_id=booking.user_id, subject=subject, body=body)
    db.session.add(note)
    db.session.commit()
    print(f"[celery] {subject} -> {booking.user.email}")
    return subject


@celery.task(name="tasks.send_cancellation_notice")
def send_cancellation_notice(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return f"Booking {booking_id} not found"

    subject = f"Booking Cancelled: {booking.trek.name}"
    body = f"Hi {booking.user.name}, your booking for '{booking.trek.name}' has been cancelled."
    note = Notification(user_id=booking.user_id, subject=subject, body=body)
    db.session.add(note)
    db.session.commit()
    print(f"[celery] {subject} -> {booking.user.email}")
    return subject


@celery.task(name="tasks.send_upcoming_trek_reminders")
def send_upcoming_trek_reminders():
    """Batch job: notify all users with bookings on treks starting within 3 days."""
    soon = datetime.utcnow().date() + timedelta(days=3)
    upcoming = Trek.query.filter(
        Trek.start_date != None,  # noqa: E711
        Trek.start_date <= soon,
        Trek.start_date >= datetime.utcnow().date(),
        Trek.status == "Open",
    ).all()

    sent = 0
    for trek in upcoming:
        for booking in trek.bookings:
            if booking.status == "Booked":
                subject = f"Reminder: {trek.name} starts soon"
                body = (
                    f"Hi {booking.user.name}, your trek '{trek.name}' starts on "
                    f"{trek.start_date}. Get your gear ready!"
                )
                db.session.add(
                    Notification(user_id=booking.user_id, subject=subject, body=body)
                )
                sent += 1
    db.session.commit()
    return f"Sent {sent} reminder(s)"


@celery.task(name="tasks.generate_report_cache")
def generate_report_cache():
    """Batch job: precompute admin dashboard stats and store in Redis cache."""
    total_users = User.query.filter_by(role="user").count()
    total_staff = User.query.filter_by(role="staff").count()
    total_treks = Trek.query.count()
    total_bookings = Booking.query.count()
    completed_treks = Trek.query.filter_by(status="Completed").count()
    revenue = 0.0
    for b in Booking.query.filter(Booking.payment_status == "Paid").all():
        revenue += (b.trek.price or 0) * b.num_slots

    stats = {
        "total_users": total_users,
        "total_staff": total_staff,
        "total_treks": total_treks,
        "total_bookings": total_bookings,
        "completed_treks": completed_treks,
        "revenue": revenue,
        "generated_at": datetime.utcnow().isoformat(),
    }
    safe_cache.set("admin_report_stats", stats, timeout=300)
    return stats
