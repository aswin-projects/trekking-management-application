from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user

from extensions import db
from models import User, StaffProfile

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    phone = data.get("phone")

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(name=name, email=email, phone=phone, role="user")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    login_user(user)
    return jsonify({"message": "Registered successfully", "user": user.to_dict()}), 201


@auth_bp.route("/register-staff", methods=["POST"])
def register_staff():
    """Public self-registration for trek staff. The account is created in a
    'pending' state and cannot log in until an admin approves it."""
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    phone = data.get("phone")

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(name=name, email=email, phone=phone, role="staff")
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    profile = StaffProfile(
        user_id=user.id,
        contact_details=data.get("contact_details") or phone,
        bio=data.get("bio"),
        status="pending",
    )
    db.session.add(profile)
    db.session.commit()

    return jsonify({
        "message": "Registration submitted. An admin needs to approve your account before you can log in."
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    if user.is_blacklisted:
        return jsonify({"error": "Your account has been blacklisted. Contact admin."}), 403
    if not user.is_active_flag:
        return jsonify({"error": "Your account has been deactivated. Contact admin."}), 403

    if user.role == "staff":
        profile = StaffProfile.query.filter_by(user_id=user.id).first()
        if not profile or profile.status == "pending":
            return jsonify({"error": "Your staff registration is still pending admin approval."}), 403
        if profile.status == "inactive":
            return jsonify({"error": "Your staff account is inactive. Contact admin."}), 403

    login_user(user)
    return jsonify({"message": "Login successful", "user": user.to_dict()})


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out"})


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return jsonify({"user": current_user.to_dict()})
