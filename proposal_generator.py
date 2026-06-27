import os
from pathlib import Path

import requests
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet


def _try_download_logo(logo_url: str, local_logo: str) -> bool:
    """
    Downloads a logo image only when the URL returns an actual image content type.
    This avoids writing a web page HTML response into a PNG file.
    """
    try:
        response = requests.get(logo_url, timeout=5)
        content_type = response.headers.get("content-type", "").lower()
        if response.status_code == 200 and "image" in content_type:
            with open(local_logo, "wb") as file:
                file.write(response.content)
            return True
    except Exception:
        return False
    return False


def generate_branded_proposal(
    project_name: str,
    capacity_mwp: float,
    total_cost: float,
    tx_mva: int,
    cable_size: int,
    output_path: str = "GridMind_Proposal.pdf",
    logo_path: str | None = None,
    logo_url: str = "",
) -> str:
    """
    Compiles an official GridMind EPC engineering bid proposal using current design outputs.
    Works with either a local company logo file or a direct image URL. If no logo is available,
    the PDF still generates with a clean GridMind EPC brand header.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )
    story = []

    local_logo = "gsi_logo_temp.png"
    temp_logo_created = False

    if logo_path and Path(logo_path).exists():
        story.append(Image(logo_path, width=120, height=50))
        story.append(Spacer(1, 10))
    elif logo_url:
        temp_logo_created = _try_download_logo(logo_url, local_logo)
        if temp_logo_created:
            story.append(Image(local_logo, width=120, height=50))
            story.append(Spacer(1, 10))

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=22,
        textColor=colors.HexColor("#002B49"),
        spaceAfter=15,
    )
    section_style = ParagraphStyle(
        "Sec",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#FF8C00"),
        spaceBefore=12,
        spaceAfter=6,
    )
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, leading=14)

    story.append(Paragraph("GRIDMIND EPC™ AUTOMATED ENGINEERING BID", title_style))
    story.append(Paragraph(f"<b>Asset Key:</b> {project_name}", body_style))
    story.append(Paragraph(f"<b>System Configuration Capacity:</b> {capacity_mwp:.2f} MWp Utility Scale", body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. Infrastructure Optimization Summary", section_style))
    table_data = [
        ["Optimized Infrastructure Component", "Engine Selected Specification Value"],
        ["Main Substation Step-Up Transformer", f"{tx_mva} MVA Capacity Unit"],
        ["Underground MV Collection Cables", f"{cable_size} mm² Cross-Section (Al)"],
        ["Gross Project EPC CAPEX Evaluation", f"${total_cost:,.2f} USD"],
    ]

    result_table = Table(table_data, colWidths=[240, 240])
    result_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#002B49")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, -1), (-1, -1), colors.HexColor("#FF8C00")),
            ]
        )
    )
    story.append(result_table)

    story.append(Spacer(1, 12))
    story.append(Paragraph("2. Engineering Notes", section_style))
    story.append(Paragraph(
        "This proposal is automatically generated from the GridMind EPC™ calculation engine. "
        "Final values must be reviewed against site survey data, grid-code constraints, procurement quotations, "
        "and utility interconnection requirements before contract execution.",
        body_style,
    ))

    doc.build(story)

    if temp_logo_created and os.path.exists(local_logo):
        os.remove(local_logo)

    return output_path
