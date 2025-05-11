---
title: "Projects"
date: {{ .Date }}
draft: false
---

# Projects

{{ .SkillsSummary }}

{{ range .Projects }}
## {{ .Name }}

{{ .Description }}

{{ if .Technologies }}
**Technologies used:** {{ delimit .Technologies ", " }}
{{ end }}

{{ if .URL }}
[View Project]({{ .URL }})
{{ end }}
{{ end }}
