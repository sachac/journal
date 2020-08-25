import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { Link } from 'react-router-dom';

export default function BulkOperations(data) {
  let selectedEntries = data.selected;
  const tagSelected = () => {
    let list = selectedEntries.sort().reverse();
    let promises = list.map((o) => {
      return fetch('/api/entries/zid/' + o + '/tags/' + input.replace(/^#/, ''), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}});
    });
    Promise.all(promises).then(function() {
      if (data.onDone) { data.onDone('tagged');}
    });
  };
  const linkSelected = () => {
    let list = selectedEntries.sort().reverse();
    let i;
    let promises = [];
    for (i = 0; i < list.length - 1; i++) {
      promises.push(fetch('/api/entries/zid/' + list[i] + '/links/' + list[i + 1], {
        method: 'POST',
        body: JSON.stringify({note: input}),
        headers: {'Content-Type': 'application/json'}}));
    };
    Promise.all(promises).then(function() {
      if (data.onDone) { data.onDone('linked'); }
    });
  };
  const [ input, setInput ] = useState('');
  const handleChange = event => {
    if (event.target.name === 'input') { setInput(event.target.value); }
  };
  return (<div>
            <TextField label="Input" value={input} onChange={handleChange} name="input"/>
            <Button onClick={linkSelected}>Link selected</Button>
            <Button onClick={tagSelected}>Tag selected</Button>
            <Button onClick={data.onClear}>Clear selection</Button>
            <Button onClick={data.onSelectAll}>Select all</Button>
          </div>);
  
}

export function SelectedInfo(data) {
  let idList = data.selected.join(',');
  let reverseIdList = data.selected.reverse().join(',');
  let refList = data.selected.map((o) => { return `ref:${o}\n`; }).join('');
  const quoteImage = function(s) {
    s = s.replace(/[*?"]/g, (x) => '\\' + x);
    return '"' + s + '"';
  };
  let imageList = [];
  if (data.entries) {
    imageList = data.entries.reduce((prev, o) => {
      if (data.selected.includes(o.ZIDString)) {
        return prev.concat((o.PictureList || []).map(quoteImage));
      } else {
        return prev;
      }
    }, []).join(' ');
  }
  return (data.selected.length > 0) ?
    (<div><div>IDs: {idList} <Link to={'/zids/' + idList }>Open</Link></div> 
         <div>Reverse: {reverseIdList}</div>
         <div>Refs: {refList}</div>
         <div>Images: {imageList}</div></div>) : null;
}
