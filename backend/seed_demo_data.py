"""
Optional helper to populate the database with sample staff and treks so the
app isn't empty on first run.

Usage:
    python seed_demo_data.py
"""
from datetime import date, timedelta
from app import create_app
from extensions import db
from models import User, StaffProfile, Trek

app = create_app()

with app.app_context():
    if not User.query.filter_by(email="staff1@tma.local").first():
        staff_user = User(name="Ravi Sherpa", email="staff1@tma.local", role="staff", phone="9800000001")
        staff_user.set_password("Staff@123")
        db.session.add(staff_user)
        db.session.flush()
        staff_profile = StaffProfile(
            user_id=staff_user.id, contact_details="9800000001", status="active",
            bio="Lead trek guide, 8 years in the Himalayas.",
        )
        db.session.add(staff_profile)
        db.session.commit()
        print("Created demo staff: staff1@tma.local / Staff@123")
    else:
        staff_profile = StaffProfile.query.join(User).filter(User.email == "staff1@tma.local").first()

    if not User.query.filter_by(email="trekker1@tma.local").first():
        u = User(name="Asha Rao", email="trekker1@tma.local", role="user", phone="9811111111")
        u.set_password("Trekker@123")
        db.session.add(u)
        db.session.commit()
        print("Created demo trekker: trekker1@tma.local / Trekker@123")

    sample_treks = [
        dict(name="Kedarkantha Winter Trek", location="Uttarakhand", difficulty="Moderate",
             duration_days=6, total_slots=20, price=8500,
             description="A classic snow trek through pine forests to a 12,500 ft summit.",
             status="Open", start_date=date.today() + timedelta(days=20),
             end_date=date.today() + timedelta(days=26)),
        dict(name="Valley of Flowers", location="Uttarakhand", difficulty="Easy",
             duration_days=5, total_slots=25, price=7200,
             description="Gentle trek through a UNESCO World Heritage alpine valley.",
             status="Open", start_date=date.today() + timedelta(days=35),
             end_date=date.today() + timedelta(days=40)),
        dict(name="Stok Kangri Expedition", location="Ladakh", difficulty="Hard",
             duration_days=9, total_slots=12, price=18500,
             description="High-altitude mountaineering expedition to a 20,000 ft peak.",
             status="Approved", start_date=date.today() + timedelta(days=60),
             end_date=date.today() + timedelta(days=69)),
        dict(name="Hampta Pass Crossing", location="Himachal Pradesh", difficulty="Moderate",
             duration_days=5, total_slots=18, price=7800,
             description="Dramatic crossover trek from green valleys to the Lahaul desert.",
             status="Open", start_date=date.today() + timedelta(days=10),
             end_date=date.today() + timedelta(days=15)),
    ]

    for t in sample_treks:
        if not Trek.query.filter_by(name=t["name"]).first():
            trek = Trek(**t, available_slots=t["total_slots"])
            if t["status"] == "Open" and staff_profile:
                trek.assigned_staff_id = staff_profile.id
            db.session.add(trek)

    db.session.commit()
    print("Demo treks seeded.")
