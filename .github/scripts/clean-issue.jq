# The bug report as the agent sees it (agent-fix.yml). Removes what GitHub doesn't show on the
# issue page, so the agent can't read text Leo never saw: HTML comments (also unclosed ones),
# markdown comments and invisible characters. Visible text stays as it is.
def clean:
  gsub("<!--[\\s\\S]*?-->"; "")
  | gsub("<!--[\\s\\S]*$"; "")
  | gsub("(?<start>^|\n)\\[//\\]: #[^\n]*"; "\(.start)")
  | gsub("[\u00AD\u034F\u061C\u115F\u1160\u180E\u200B-\u200F\u2028-\u202E\u2060-\u2069\u3164\uFE00-\uFE0F\uFEFF]"; "")
  | gsub("[\uDB40\uDC00-\uDB40\uDC7F\uDB40\uDD00-\uDB40\uDDEF]"; "");

((.body // "") | clean) as $body
| {
    number,
    labels: [.labels[].name],
    title: (.title | clean | .[0:200]),
    body: $body[0:4000],
    body_truncated: ($body | length > 4000)
  }
