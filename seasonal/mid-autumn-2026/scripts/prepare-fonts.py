import re, urllib.parse, pathlib, html, subprocess
root=pathlib.Path(__file__).resolve().parents[1]/'public'
s=(root/'index.html').read_text()
s=re.sub(r'<[^>]+>','',s)
s=html.unescape(s)+(root.parent/'admin/index.html').read_text()+(root.parent/'admin/admin.js').read_text()+(root/'app.js').read_text()+(root/'sky.js').read_text()+''.join(str(i) for i in range(10))+'三二一再試一次正在送出月圓了。'
chars=''.join(sorted(set(s)))
# Google's text API returns only glyphs used by this local page. User responses
# are never passed to Google; other typed characters use the system fallback.
styles=[]
for family in ['Noto Serif TC','Noto Sans TC']:
  for weight in ([400,500,600] if family=='Noto Serif TC' else [400,500]):
    url='https://fonts.googleapis.com/css2?'+urllib.parse.urlencode({'family':family+':wght@'+str(weight),'text':chars,'display':'swap'})
    css=subprocess.check_output(['curl','-fsS','--max-time','30','-A','Mozilla/5.0',url]).decode()
    fonturl=re.search(r'src: url\(([^)]+)\)',css).group(1)
    name=('noto-serif-tc' if 'Serif' in family else 'noto-sans-tc')+'-'+str(weight)+'.ttf'
    data=subprocess.check_output(['curl','-fsS','--max-time','30',fonturl])
    (root/'assets'/name).write_bytes(data)
    styles.append(css.replace(fonturl,'/assets/'+name+'?v=3'))
    print(name,len(data),'magic',data[:4])
(root/'fonts.css').write_text('\n'.join(styles))
