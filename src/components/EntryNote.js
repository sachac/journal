import React from 'react';

function markupLinks(s) {
    if (!s) return null;
    let v = s.replace(/(\b|^)(#[^ \t\r\n]+|ref:[0-9]+[0-9]+[0-9]+[0-9]+-[0-9]+[0-9]+-[0-9]+[0-9]+-[0-9]+[0-9]+)(\b|$)/g,
                      function(x) {
                          let m = x.match(/^ref:(.*)/);
                          if (m) {
                              return '<a class="zidref" href="/zid/' + m[1] + '">' + m[0] + '</a>';
                          }
                          m = x.match(/#([^ ]+)/);
                          if (m) {
                              return '<a class="tagref" href="/tag/' + m[1] + '">' + m[0] + '</a>';
                          }
                          return x;
                      });
    return v;
};
    
export default function EntryNote(data) {
    return <span className={data.className} dangerouslySetInnerHTML={{__html: markupLinks(data.value)}} />;
}
