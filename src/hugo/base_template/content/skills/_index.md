---
title: "Skills"
date: {{ .Date }}
draft: false
---

# Skills & Expertise

{{ .SkillsSummary }}

## Technical Skills

{{ range .Skills }}
{{ if eq .Category "technical" }}
- **{{ .Name }}**{{ if .Level }} - {{ .Level }}{{ end }}
{{ end }}
{{ end }}

## Professional Skills

{{ range .Skills }}
{{ if eq .Category "professional" }}
- **{{ .Name }}**{{ if .Level }} - {{ .Level }}{{ end }}
{{ end }}
{{ end }}

## Languages

{{ range .Languages }}
- {{ . }}
{{ end }}

## Certifications

{{ range .Certifications }}
- {{ . }}
{{ end }}
