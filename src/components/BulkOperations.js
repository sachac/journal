import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { Link } from 'react-router-dom';

export default function BulkOperations(data) {
  let selectedEntries = data.selected;
  const [ input, setInput ] = useState('');
  const tagSelected = () => {
    fetch('/api/entries/tag/bulk', {
      method: 'POST',
      body: JSON.stringify({tags: input.split(/ /), zids: data.selected}),
      headers: {'Content-Type': 'application/json'}}).then(res => res.json())
      .then((res) => { if (data.onDone) { data.onDone('tagged', res); }});
  };
  const linkSelected = () => {
    fetch('/api/entries/link/bulk', {
      method: 'POST',
      body: JSON.stringify({note: input, zids: data.selected}),
      headers: {'Content-Type': 'application/json'}}).then(res => res.json())
      .then((res) => { if (data.onDone) { data.onDone('tagged', res); }});
  };
  const handleChange = event => {
    if (event.target.name === 'input') { setInput(event.target.value); }
  };
  return (<div className="horizontal-form">
            <TextField label="Input" value={input} onChange={handleChange} name="input"/>
            <Button onClick={linkSelected}>Link</Button>
            <Button onClick={tagSelected}>Tag</Button>
            {selectedEntries.length} selected
            <Button onClick={data.onClear}>Select none</Button>
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
