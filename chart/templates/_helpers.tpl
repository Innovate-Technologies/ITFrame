{{/* vim: set filetype=mustache: */}}
{{- define "itframe.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "itframe.fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "itframe.labels" -}}
app: {{ template "itframe.name" . }}
chart: "{{ .Chart.Name }}-{{ .Chart.Version }}"
release: {{ .Release.Name | quote }}
heritage: {{ .Release.Service | quote }}
{{- end -}}

{{- define "itframe.selector" -}}
app: {{ template "itframe.name" . }}
release: {{ .Release.Name }}
{{- end -}}