#!/usr/bin/env python3
"""
Generate a sample resume PDF for testing.

This script creates a simple PDF with resume-like content
that can be used to test the resume parser functionality.
"""
import os
from datetime import datetime
from pathlib import Path

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
except ImportError:
    print("ReportLab is required to generate PDFs.")
    print("Install it with: pip install reportlab")
    exit(1)


def generate_sample_resume(output_path: Path) -> None:
    """
    Generate a sample resume PDF.
    
    Args:
        output_path: Path where the PDF will be saved
    """
    # Create directory if it doesn't exist
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Create PDF document
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72,
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = styles["Heading2"]
    normal_style = styles["Normal"]
    
    # Create custom styles
    section_title = ParagraphStyle(
        "SectionTitle",
        parent=heading_style,
        fontSize=14,
        spaceAfter=6,
        spaceBefore=12,
    )
    job_title = ParagraphStyle(
        "JobTitle",
        parent=normal_style,
        fontSize=12,
        fontName="Helvetica-Bold",
    )
    
    # Build content
    content = []
    
    # Header
    content.append(Paragraph("John Doe", title_style))
    content.append(Spacer(1, 12))
    content.append(Paragraph("Software Engineer", heading_style))
    content.append(Spacer(1, 12))
    
    # Contact info
    contact_data = [
        ["Email:", "john.doe@example.com"],
        ["Phone:", "(555) 123-4567"],
        ["Location:", "San Francisco, CA"],
        ["LinkedIn:", "linkedin.com/in/johndoe"],
        ["GitHub:", "github.com/johndoe"],
    ]
    contact_table = Table(contact_data, colWidths=[80, 300])
    contact_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold"),
    ]))
    content.append(contact_table)
    content.append(Spacer(1, 24))
    
    # Summary
    content.append(Paragraph("Professional Summary", section_title))
    content.append(Paragraph(
        "Experienced software engineer with over 8 years of expertise in full-stack development, "
        "cloud architecture, and DevOps. Passionate about creating scalable, maintainable solutions "
        "that solve real-world problems. Skilled in Python, JavaScript, and cloud technologies.",
        normal_style
    ))
    content.append(Spacer(1, 12))
    
    # Experience
    content.append(Paragraph("Professional Experience", section_title))
    
    # Job 1
    content.append(Paragraph("Senior Software Engineer", job_title))
    content.append(Paragraph("TechCorp Inc. | Jan 2020 - Present", normal_style))
    content.append(Spacer(1, 6))
    content.append(Paragraph("• Led development of a microservices architecture that improved system reliability by 35%", normal_style))
    content.append(Paragraph("• Implemented CI/CD pipelines reducing deployment time from days to minutes", normal_style))
    content.append(Paragraph("• Mentored junior developers and conducted code reviews for team of 8 engineers", normal_style))
    content.append(Spacer(1, 12))
    
    # Job 2
    content.append(Paragraph("Software Engineer", job_title))
    content.append(Paragraph("DataSystems LLC | Mar 2017 - Dec 2019", normal_style))
    content.append(Spacer(1, 6))
    content.append(Paragraph("• Developed RESTful APIs serving 10,000+ daily users with 99.9% uptime", normal_style))
    content.append(Paragraph("• Optimized database queries resulting in 40% performance improvement", normal_style))
    content.append(Paragraph("• Collaborated with product managers to implement new features based on user feedback", normal_style))
    content.append(Spacer(1, 12))
    
    # Education
    content.append(Paragraph("Education", section_title))
    content.append(Paragraph("Master of Science in Computer Science", job_title))
    content.append(Paragraph("Stanford University | 2015 - 2017", normal_style))
    content.append(Spacer(1, 6))
    content.append(Paragraph("Bachelor of Science in Computer Engineering", job_title))
    content.append(Paragraph("University of California, Berkeley | 2011 - 2015", normal_style))
    content.append(Spacer(1, 12))
    
    # Skills
    content.append(Paragraph("Technical Skills", section_title))
    
    skills_data = [
        ["Languages:", "Python, JavaScript, TypeScript, Go, SQL"],
        ["Frameworks:", "React, Node.js, Django, Flask, Express"],
        ["Cloud:", "AWS, GCP, Azure, Docker, Kubernetes"],
        ["Tools:", "Git, Jenkins, GitHub Actions, Terraform"],
        ["Databases:", "PostgreSQL, MongoDB, Redis, Elasticsearch"],
    ]
    skills_table = Table(skills_data, colWidths=[80, 400])
    skills_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold"),
    ]))
    content.append(skills_table)
    content.append(Spacer(1, 12))
    
    # Projects
    content.append(Paragraph("Projects", section_title))
    
    # Project 1
    content.append(Paragraph("Cloud Cost Optimizer", job_title))
    content.append(Paragraph(
        "Developed a tool that analyzes cloud resource usage and provides recommendations "
        "for cost optimization. Reduced AWS costs by 25% for multiple clients.",
        normal_style
    ))
    content.append(Spacer(1, 6))
    
    # Project 2
    content.append(Paragraph("Open Source Contribution Manager", job_title))
    content.append(Paragraph(
        "Created a platform for tracking and managing open source contributions across an organization. "
        "Used by 500+ developers to coordinate work on 50+ projects.",
        normal_style
    ))
    
    # Build PDF
    doc.build(content)
    
    print(f"Sample resume generated at: {output_path}")


def main():
    """Main entry point for the sample resume generator."""
    script_dir = Path(__file__).parent
    samples_dir = script_dir.parent / "samples"
    output_path = samples_dir / "sample_resume.pdf"
    
    generate_sample_resume(output_path)


if __name__ == "__main__":
    main()
