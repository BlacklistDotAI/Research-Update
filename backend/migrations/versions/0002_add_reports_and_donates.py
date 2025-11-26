"""Add reports and donates tables

Revision ID: 0002
Revises: 0001
Create Date: 2025-11-26 10:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import enum

# revision identifiers, used by Alembic.
revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None

# Enums
class ContributionInterestEnum(enum.Enum):
    skills_time = "Skills and time"
    project_data = "Project/Data"
    infra = "Infrastructure"
    fin_commitment = "Financial Commitment"

class ContributionSkillEnum(enum.Enum):
    ai_ml = "AI/ML"
    software = "Software (FE/BE)"
    design_ux = "Design/UX"
    product = "Product"
    data_bi = "Data/BI"
    security_legal = "Security/Legal"
    moderation = "Moderation"
    growth_content = "Growth/Content"

class ParticipationTimeEnum(enum.Enum):
    ad_hoc = "Ad-hoc / Mini Task"
    part_time = "Part-time"
    full_time = "Temporary full-time (per sprint)"

class CategoryEnum(enum.Enum):
    Phone_Number = "Phone Number"
    Personnel_KOL = "Personnel/KOL"
    Company = "Company"
    Event = "Event"

class StatusEnum(enum.Enum):
    Draft = "Draft"
    Publish = "Publish"
    Blacklist = "Blacklist"

class ProofTypeEnum(enum.Enum):
    image = "image"
    video = "video"
    audio = "audio"


def upgrade() -> None:
    # Donate table
    op.create_table(
        'donates',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(100), nullable=False),
        sa.Column('phone_number', sa.String(20), nullable=True),
        sa.Column('organization', sa.String(100), nullable=True),
        sa.Column('contribution_interest', sa.Enum(ContributionInterestEnum, name="contribution_interest_enum"), nullable=False),
        sa.Column('contribution_skill', sa.Enum(ContributionSkillEnum, name="contribution_skill_enum"), nullable=True),
        sa.Column('participation_time', sa.Enum(ParticipationTimeEnum, name="participation_time_enum"), nullable=True),
        sa.Column('referral_link', sa.String(255), nullable=True),
        sa.Column('note', sa.Text, nullable=True),
        sa.Column('accept_information', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('accept_no_abuse', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # Reports table
    op.create_table(
        'reports',
        sa.Column('id', sa.String(36), primary_key=True, default=lambda: str(uuid.uuid4())),
        sa.Column('title', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('category', sa.Enum(CategoryEnum, name="category_enum"), nullable=False),
        sa.Column('detail', sa.Text, nullable=True),
        sa.Column('proof_file', sa.String, nullable=True),
        sa.Column('proof_type', sa.Enum(ProofTypeEnum, name="prooftype_enum"), nullable=True),
        sa.Column('status', sa.Enum(StatusEnum, name="status_enum"), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )
    op.create_index('ix_reports_title', 'reports', ['title'])


def downgrade() -> None:
    op.drop_index('ix_reports_title', table_name='reports')
    op.drop_table('reports')
    op.drop_table('donates')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS contribution_interest_enum')
    op.execute('DROP TYPE IF EXISTS contribution_skill_enum')
    op.execute('DROP TYPE IF EXISTS participation_time_enum')
    op.execute('DROP TYPE IF EXISTS category_enum')
    op.execute('DROP TYPE IF EXISTS status_enum')
    op.execute('DROP TYPE IF EXISTS prooftype_enum')
