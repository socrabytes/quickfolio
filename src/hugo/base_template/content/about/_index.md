---
title: "About Me"
date: {{ .Date }}
draft: false
---

# About Me

{{ .Bio }}

## Experience

{{ range .Experience }}
### {{ .Position }} at {{ .Company }}
*{{ .StartDate }} - {{ .EndDate }}*

{{ .Description }}

{{ if .Achievements }}
#### Key Achievements:
{{ range .Achievements }}
- {{ . }}
{{ end }}
{{ end }}

{{ end }}

## Education

{{ range .Education }}
### {{ .Degree }} in {{ .FieldOfStudy }}
**{{ .Institution }}** *{{ .StartDate }} - {{ .EndDate }}*

{{ .Description }}
{{ end }}
