from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from extensions import db, safe_cache
from models import Trek, StaffProfile, Booking
from utils import role_required

staff_bp = Blueprint("staff", __name__)


def _get_own_profile():
    return StaffProfile.query.filter_by(user_id=current_user.id).first()


@staff_bp.route("/treks", methods=["GET"])
@login_required
@role_required("staff")
def my_treks():
    profile = _get_own_profile()
    if not profile:
        return jsonify({"treks": []})
    return jsonify({"treks": [t.to_dict() for t in profile.treks]})


@staff_bp.route("/treks/<int:trek_id>", methods=["PUT"])
@login_required
@role_required("staff")
def update_my_trek(trek_id):
    profile = _get_own_profile()
    trek = Trek.query.get_or_404(trek_id)
    if not profile or trek.assigned_staff_id != profile.id:
        return jsonify({"error": "This trek is not assigned to you"}), 403

    data = request.get_json(force=True) or {}
    if "available_slots" in data:
        trek.available_slots = max(0, min(int(data["available_slots"]), trek.total_slots))
    if "status" in data and data["status"] in ("Open", "Closed"):
        trek.status = data["status"]

    db.session.commit()
    safe_cache.delete("public_treks")
    return jsonify({"message": "Trek updated", "trek": trek.to_dict()})


@staff_bp.route("/treks/<int:trek_id>/complete", methods=["PUT"])
@login_required
@role_required("staff")
def complete_trek(trek_id):
    profile = _get_own_profile()
    trek = Trek.query.get_or_404(trek_id)
    if not profile or trek.assigned_staff_id != profile.id:
        return jsonify({"error": "This trek is not assigned to you"}), 403

    trek.status = "Completed"
    for booking in trek.bookings:
        if booking.status == "Booked":
            booking.status = "Completed"
    db.session.commit()
    safe_cache.delete("public_treks")
    return jsonify({"message": "Trek marked completed", "trek": trek.to_dict()})


@staff_bp.route("/treks/<int:trek_id>/bookings", methods=["GET"])
@login_required
@role_required("staff")
def trek_bookings(trek_id):
    profile = _get_own_profile()
    trek = Trek.query.get_or_404(trek_id)
    if not profile or trek.assigned_staff_id != profile.id:
        return jsonify({"error": "This trek is not assigned to you"}), 403

    return jsonify({"bookings": [b.to_dict() for b in trek.bookings]})


@staff_bp.route("/bookings/<int:booking_id>/payment", methods=["PUT"])
@login_required
@role_required("staff")
def mark_payment(booking_id):
    """Staff marks a trekker's booking as paid (or another payment state) for
    any trek assigned to them. Reflects immediately in the trekker's booking
    history and in admin revenue reports."""
    profile = _get_own_profile()
    booking = Booking.query.get_or_404(booking_id)

    if not profile or booking.trek.assigned_staff_id != profile.id:
        return jsonify({"error": "This booking is not on a trek assigned to you"}), 403

    data = request.get_json(force=True) or {}
    payment_status = data.get("payment_status", "Paid")
    if payment_status not in ("Pending", "Paid", "Refunded"):
        return jsonify({"error": "Invalid payment_status"}), 400

    booking.payment_status = payment_status
    db.session.commit()
    safe_cache.delete("admin_report_stats")

    return jsonify({"message": "Payment status updated", "booking": booking.to_dict()})
