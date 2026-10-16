from flask import Blueprint, request, jsonify
from flask_login import login_required

from extensions import db, safe_cache, safe_delay
from models import User, StaffProfile, Trek, Booking
from utils import role_required, parse_date

admin_bp = Blueprint("admin", __name__)


# ---------------------------------------------------------------- Treks ----
@admin_bp.route("/treks", methods=["GET"])
@login_required
@role_required("admin")
def list_treks():
    treks = Trek.query.order_by(Trek.created_at.desc()).all()
    return jsonify({"treks": [t.to_dict() for t in treks]})


@admin_bp.route("/treks", methods=["POST"])
@login_required
@role_required("admin")
def create_trek():
    data = request.get_json(force=True) or {}
    required = ["name", "location", "difficulty", "duration_days", "total_slots"]
    missing = [f for f in required if not data.get(f) and data.get(f) != 0]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    trek = Trek(
        name=data["name"],
        location=data["location"],
        difficulty=data["difficulty"],
        duration_days=int(data["duration_days"]),
        total_slots=int(data["total_slots"]),
        available_slots=int(data["total_slots"]),
        price=float(data.get("price") or 0),
        description=data.get("description"),
        status=data.get("status", "Pending"),
        start_date=parse_date(data.get("start_date")),
        end_date=parse_date(data.get("end_date")),
    )
    db.session.add(trek)
    db.session.commit()
    safe_cache.delete("public_treks")
    return jsonify({"message": "Trek created", "trek": trek.to_dict()}), 201


@admin_bp.route("/treks/<int:trek_id>", methods=["PUT"])
@login_required
@role_required("admin")
def update_trek(trek_id):
    trek = Trek.query.get_or_404(trek_id)
    data = request.get_json(force=True) or {}

    for field in ["name", "location", "difficulty", "description", "status"]:
        if field in data:
            setattr(trek, field, data[field])

    if "duration_days" in data:
        trek.duration_days = int(data["duration_days"])
    if "price" in data:
        trek.price = float(data["price"])
    if "total_slots" in data:
        diff = int(data["total_slots"]) - trek.total_slots
        trek.total_slots = int(data["total_slots"])
        trek.available_slots = max(0, trek.available_slots + diff)
    if "available_slots" in data:
        trek.available_slots = int(data["available_slots"])
    if "start_date" in data:
        trek.start_date = parse_date(data["start_date"])
    if "end_date" in data:
        trek.end_date = parse_date(data["end_date"])

    db.session.commit()
    safe_cache.delete("public_treks")
    return jsonify({"message": "Trek updated", "trek": trek.to_dict()})


@admin_bp.route("/treks/<int:trek_id>", methods=["DELETE"])
@login_required
@role_required("admin")
def delete_trek(trek_id):
    trek = Trek.query.get_or_404(trek_id)
    db.session.delete(trek)
    db.session.commit()
    safe_cache.delete("public_treks")
    return jsonify({"message": "Trek removed"})


@admin_bp.route("/treks/<int:trek_id>/assign", methods=["PUT"])
@login_required
@role_required("admin")
def assign_staff(trek_id):
    trek = Trek.query.get_or_404(trek_id)
    data = request.get_json(force=True) or {}
    staff_profile_id = data.get("staff_profile_id")

    if staff_profile_id is None:
        trek.assigned_staff_id = None
    else:
        staff = StaffProfile.query.get_or_404(staff_profile_id)
        trek.assigned_staff_id = staff.id

    db.session.commit()
    safe_cache.delete("public_treks")
    return jsonify({"message": "Staff assignment updated", "trek": trek.to_dict()})


# ---------------------------------------------------------------- Staff ----
@admin_bp.route("/staff", methods=["GET"])
@login_required
@role_required("admin")
def list_staff():
    profiles = StaffProfile.query.all()
    return jsonify({"staff": [p.to_dict() for p in profiles]})


@admin_bp.route("/staff", methods=["POST"])
@login_required
@role_required("admin")
def create_staff():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(name=name, email=email, phone=data.get("phone"), role="staff")
    user.set_password(password)
    db.session.add(user)
    db.session.flush()  # get user.id before commit

    profile = StaffProfile(
        user_id=user.id,
        contact_details=data.get("contact_details"),
        bio=data.get("bio"),
        status="active",
    )
    db.session.add(profile)
    db.session.commit()
    return jsonify({"message": "Staff created", "staff": profile.to_dict()}), 201


@admin_bp.route("/staff/<int:profile_id>", methods=["PUT"])
@login_required
@role_required("admin")
def update_staff(profile_id):
    profile = StaffProfile.query.get_or_404(profile_id)
    data = request.get_json(force=True) or {}

    if "contact_details" in data:
        profile.contact_details = data["contact_details"]
    if "bio" in data:
        profile.bio = data["bio"]
    if "status" in data:
        profile.status = data["status"]
    if "name" in data and profile.user:
        profile.user.name = data["name"]
    if "phone" in data and profile.user:
        profile.user.phone = data["phone"]

    db.session.commit()
    return jsonify({"message": "Staff updated", "staff": profile.to_dict()})


@admin_bp.route("/staff/<int:profile_id>", methods=["DELETE"])
@login_required
@role_required("admin")
def delete_staff(profile_id):
    profile = StaffProfile.query.get_or_404(profile_id)
    for trek in profile.treks:
        trek.assigned_staff_id = None
    user = profile.user
    db.session.delete(profile)
    if user:
        db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Staff removed"})


# ---------------------------------------------------------------- Users ----
@admin_bp.route("/users", methods=["GET"])
@login_required
@role_required("admin")
def list_users():
    users = User.query.filter_by(role="user").order_by(User.created_at.desc()).all()
    return jsonify({"users": [u.to_dict() for u in users]})


@admin_bp.route("/users/<int:user_id>/status", methods=["PUT"])
@login_required
@role_required("admin")
def update_user_status(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json(force=True) or {}

    if "is_active" in data:
        user.is_active_flag = bool(data["is_active"])
    if "is_blacklisted" in data:
        user.is_blacklisted = bool(data["is_blacklisted"])

    db.session.commit()
    return jsonify({"message": "User status updated", "user": user.to_dict()})


# --------------------------------------------------------------- Search ----
@admin_bp.route("/search", methods=["GET"])
@login_required
@role_required("admin")
def search():
    entity = request.args.get("type", "treks")
    q = f"%{request.args.get('q', '')}%"

    if entity == "users":
        results = User.query.filter_by(role="user").filter(
            db.or_(User.name.ilike(q), User.email.ilike(q))
        ).all()
        return jsonify({"results": [r.to_dict() for r in results]})

    if entity == "staff":
        results = (
            StaffProfile.query.join(User)
            .filter(db.or_(User.name.ilike(q), User.email.ilike(q)))
            .all()
        )
        return jsonify({"results": [r.to_dict() for r in results]})

    # default: treks
    results = Trek.query.filter(
        db.or_(Trek.name.ilike(q), Trek.location.ilike(q))
    ).all()
    return jsonify({"results": [r.to_dict() for r in results]})


# -------------------------------------------------------------- Reports ----
@admin_bp.route("/reports", methods=["GET"])
@login_required
@role_required("admin")
def reports():
    cached = safe_cache.get("admin_report_stats")
    if cached:
        return jsonify({"stats": cached, "source": "cache"})

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
    }
    safe_cache.set("admin_report_stats", stats, timeout=300)
    return jsonify({"stats": stats, "source": "live"})


@admin_bp.route("/reports/refresh", methods=["POST"])
@login_required
@role_required("admin")
def refresh_reports():
    """Trigger the Celery batch job that precomputes report stats."""
    from tasks import generate_report_cache

    safe_delay(generate_report_cache)
    return jsonify({"message": "Report refresh queued"})


@admin_bp.route("/reminders/send", methods=["POST"])
@login_required
@role_required("admin")
def trigger_reminders():
    """Trigger the Celery batch job that reminds users of upcoming treks."""
    from tasks import send_upcoming_trek_reminders

    safe_delay(send_upcoming_trek_reminders)
    return jsonify({"message": "Reminder batch job queued"})
