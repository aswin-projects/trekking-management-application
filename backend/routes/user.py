from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from extensions import db, safe_cache, safe_delay
from models import Trek, Booking
from utils import role_required
from tasks import send_booking_confirmation, send_cancellation_notice

user_bp = Blueprint("user", __name__)


@user_bp.route("/treks", methods=["GET"])
def browse_treks():
    """Public listing of open treks, filterable by difficulty/location/duration.
    Base unfiltered list is cached in Redis; filtered queries hit the DB directly.
    """
    difficulty = request.args.get("difficulty")
    location = request.args.get("location")
    duration = request.args.get("duration")  # exact match on duration_days
    q = request.args.get("q")

    if not (difficulty or location or duration or q):
        cached = safe_cache.get("public_treks")
        if cached:
            return jsonify({"treks": cached, "source": "cache"})

        treks = Trek.query.filter(Trek.status == "Open").order_by(Trek.start_date).all()
        data = [t.to_dict() for t in treks]
        safe_cache.set("public_treks", data, timeout=120)
        return jsonify({"treks": data, "source": "live"})

    query = Trek.query.filter(Trek.status == "Open")
    if difficulty:
        query = query.filter(Trek.difficulty == difficulty)
    if location:
        query = query.filter(Trek.location.ilike(f"%{location}%"))
    if duration:
        query = query.filter(Trek.duration_days == int(duration))
    if q:
        query = query.filter(
            db.or_(Trek.name.ilike(f"%{q}%"), Trek.location.ilike(f"%{q}%"))
        )

    treks = query.order_by(Trek.start_date).all()
    return jsonify({"treks": [t.to_dict() for t in treks], "source": "live"})


@user_bp.route("/treks/<int:trek_id>", methods=["GET"])
def trek_detail(trek_id):
    trek = Trek.query.get_or_404(trek_id)
    return jsonify({"trek": trek.to_dict()})


@user_bp.route("/bookings", methods=["POST"])
@login_required
@role_required("user")
def book_trek():
    data = request.get_json(force=True) or {}
    trek_id = data.get("trek_id")
    num_slots = int(data.get("num_slots", 1))

    trek = Trek.query.get_or_404(trek_id)
    if trek.status != "Open":
        return jsonify({"error": "This trek is not open for booking"}), 400
    if trek.available_slots < num_slots:
        return jsonify({"error": "Not enough slots available"}), 400
    if num_slots < 1:
        return jsonify({"error": "num_slots must be at least 1"}), 400

    booking = Booking(
        user_id=current_user.id,
        trek_id=trek.id,
        num_slots=num_slots,
        status="Booked",
        payment_status=data.get("payment_status", "Pending"),
    )
    trek.available_slots -= num_slots
    db.session.add(booking)
    db.session.commit()
    safe_cache.delete("public_treks")

    safe_delay(send_booking_confirmation, booking.id)

    return jsonify({"message": "Trek booked successfully", "booking": booking.to_dict()}), 201


@user_bp.route("/bookings/my", methods=["GET"])
@login_required
@role_required("user")
def my_bookings():
    bookings = (
        Booking.query.filter_by(user_id=current_user.id)
        .order_by(Booking.booking_date.desc())
        .all()
    )
    return jsonify({"bookings": [b.to_dict() for b in bookings]})


@user_bp.route("/bookings/<int:booking_id>/cancel", methods=["PUT"])
@login_required
@role_required("user")
def cancel_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    if booking.user_id != current_user.id:
        return jsonify({"error": "Not your booking"}), 403
    if booking.status != "Booked":
        return jsonify({"error": "Only active bookings can be cancelled"}), 400

    booking.status = "Cancelled"
    booking.trek.available_slots += booking.num_slots
    db.session.commit()
    safe_cache.delete("public_treks")

    safe_delay(send_cancellation_notice, booking.id)

    return jsonify({"message": "Booking cancelled", "booking": booking.to_dict()})


@user_bp.route("/profile", methods=["GET"])
@login_required
def get_profile():
    return jsonify({"user": current_user.to_dict()})


@user_bp.route("/profile", methods=["PUT"])
@login_required
def update_profile():
    data = request.get_json(force=True) or {}
    if "name" in data and data["name"].strip():
        current_user.name = data["name"].strip()
    if "phone" in data:
        current_user.phone = data["phone"]
    if data.get("password"):
        current_user.set_password(data["password"])
    db.session.commit()
    return jsonify({"message": "Profile updated", "user": current_user.to_dict()})
