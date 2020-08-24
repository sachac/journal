import React, { useState } from 'react';
import PhotoList from './PhotoList';
import EntryForm from '../components/EntryForm';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import { Link } from 'react-router-dom';
import EntryNote from '../components/EntryNote.js';

export default function EntryItem(data) {
  const [isEditing, setEditing] = useState(false);
  let entry = data.entry;
  // <IconButton to={"/entries/" + entry.ID} component={Link}><EditIcon fontSize="small"/></IconButton>
  let onSubmit = function() {
    setEditing(false);
    if (data.onSubmit) { data.onSubmit(); }
  };
  let zidLink = <Link className="date-link" to={"/zid/" + entry.ZIDString}>{entry.ZIDString}</Link>;
  if (isEditing) {
    return <EntryForm entry={entry} onSubmit={onSubmit} quick={true}/>;
  } else {
    let classes = 'entryItem';
    if (data.selected && data.selected.indexOf(entry.ZIDString) >= 0) {
      classes += ' selected';
    }
    let other = (data.options && data.options.other !== false) ? <EntryNote className="other" value={entry.Other}/> : null;
    let images = (data.options && data.options.images !== false) ? <PhotoList data={entry.PictureList} /> : null;
    return <div className={classes} onClick={(e) => data.onClick && data.onClick(e, entry)}>{images}
             <IconButton onClick={(e) => { setEditing(!isEditing); } }><EditIcon fontSize="small"/></IconButton>
             <EntryNote value={entry.Note} /> {other} ({zidLink})
           </div>;
  }
};
