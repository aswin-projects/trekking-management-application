from datetime import datetime
from extensions import db


class StaffProfile(db.Model):
    __tablename__ = "staff_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    contact_details = db.Column(db.String(255))
    # pending (self-registered, awaiting admin approval) | active | inactive
    status = db.Column(db.String(20), default="active")
    bio = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    treks = db.relationship("Trek", backref="assigned_staff")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.user.name if self.user else None,
            "email": self.user.email if self.user else None,
            "contact_details": self.contact_details,
            "status": self.status,
            "bio": self.bio,
            "assigned_trek_count": len(self.treks),
        }
