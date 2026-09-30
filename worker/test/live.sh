#!/usr/bin/env bash
# Live checks against the deployed worker. Sends no email unless SEND=1, which sends ONE real
# email to support@palworks.ai and then checks that its challenge cannot be replayed.
# RESOLVE=ip pins the hostname, for a machine whose resolver still caches the name as missing.
set -u
H=gmail-tabs-contact.palworks.ai
B=https://$H
O=https://palworks.github.io
R=(); [ -n "${RESOLVE:-}" ] && R=(--resolve "$H:443:$RESOLVE")
c() { curl -s "${R[@]}" -w ' [%{http_code}]' "$@"; echo; }
solve() { node -e '
const enc=new TextEncoder();const [,n,b]=process.argv[1].split(".");
const lzb=h=>{let z=0;for(const x of h){if(x===0){z+=8;continue}return z+Math.clz32(x)-24}return z};
(async()=>{for(let i=0;;i++){const h=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(n+":"+i)));if(lzb(h)>=+b){console.log(i);return}}})()' "$1"; }
F=(-F name="Canary Test" -F email=support@palworks.ai -F topic=question -F subject="Contact form end-to-end test" -F message="This is an automated test of the website contact form. Please ignore." -F website=)
echo "health:           $(c $B/health)"
echo "no origin:        $(c $B/v1/challenge)"
echo "bad origin:       $(c -H "Origin: https://evil.example" $B/v1/challenge)"
CH=$(curl -s "${R[@]}" -H "Origin: $O" $B/v1/challenge | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).challenge))')
SOL=$(solve "$CH")
echo "too fast:         $(c -H "Origin: $O" "${F[@]}" -F challenge="$CH" -F solution=$SOL $B/v1/contact)"
sleep 4
echo "no work:          $(c -H "Origin: $O" "${F[@]}" -F challenge="$CH" -F solution=0 $B/v1/contact)"
echo "honeypot:         $(c -H "Origin: $O" -F name=x -F email=a@b.co -F message="spam spam spam" -F website=http://spam -F challenge="$CH" -F solution=$SOL $B/v1/contact)"
echo "short message:    $(c -H "Origin: $O" -F name=x -F email=a@b.co -F message=hi -F challenge="$CH" -F solution=$SOL $B/v1/contact)"
printf 'MZ\x90\x00\x01' > /tmp/claude-1000/tool.exe
echo "exe attachment:   $(c -H "Origin: $O" "${F[@]}" -F challenge="$CH" -F solution=$SOL -F attachments=@/tmp/claude-1000/tool.exe $B/v1/contact)"
printf '\x89PNG\r\n\x1a\n1234' > /tmp/claude-1000/fake.pdf
echo "disguised file:   $(c -H "Origin: $O" "${F[@]}" -F challenge="$CH" -F solution=$SOL -F attachments=@/tmp/claude-1000/fake.pdf $B/v1/contact)"
if [ "${SEND:-0}" = 1 ]; then
  printf '{"version":1,"tabs":[{"title":"Clients"}]}' > /tmp/claude-1000/gmail-tabs-export.json
  echo "send:             $(c -H "Origin: $O" "${F[@]}" -F challenge="$CH" -F solution=$SOL -F attachments=@/tmp/claude-1000/gmail-tabs-export.json $B/v1/contact)"
  echo "replay:           $(c -H "Origin: $O" "${F[@]}" -F challenge="$CH" -F solution=$SOL $B/v1/contact)"
else
  echo "send:             skipped; SEND=1 sends one real email"
fi
rm -f /tmp/claude-1000/tool.exe /tmp/claude-1000/fake.pdf /tmp/claude-1000/gmail-tabs-export.json
