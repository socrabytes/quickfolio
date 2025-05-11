---
title: "Contact"
date: {{ .Date }}
draft: false
---

# Contact Me

I'm always open to discussing new projects, opportunities, or collaborations.

## Get In Touch

- **Email:** {{ .Email }}
{{ if .Phone }}
- **Phone:** {{ .Phone }}
{{ end }}
{{ if .Location }}
- **Location:** {{ .Location }}
{{ end }}

## Connect Online

{{ if .LinkedIn }}
- [LinkedIn]({{ .LinkedIn }})
{{ end }}
{{ if .GitHub }}
- [GitHub]({{ .GitHub }})
{{ end }}
{{ if .Website }}
- [Personal Website]({{ .Website }})
{{ end }}
