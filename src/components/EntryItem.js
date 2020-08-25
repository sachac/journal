import React, { useState, useEffect } from 'react';
import PhotoList from './PhotoList';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import { Link } from 'react-router-dom';
import EntryNote from '../components/EntryNote';
import { QuickEntryForm } from '../components/EntryForm';
export default function EntryItem(data) {
  const [isEditing, setEditing] = useState(false);
  const [entry, setEntry] = useState({Category: ''});
  useEffect(() => {
    if (data.entry) setEntry(data.entry); }, [data.entry]);
  // <IconButton to={"/entries/" + entry.ID} component={Link}><EditIcon fontSize="small"/></IconButton>
  let onSubmit = function(res) {
    setEditing(false);
    if (res) { setEntry(res); }
    if (data.onSubmit) { data.onSubmit(); }
  };
  let zidLink = <Link className="date-link" to={"/zid/" + entry.ZIDString}>{entry.ZIDString}</Link>;
  if (entry) {
    if (isEditing) {
      return <QuickEntryForm entry={entry} onSubmit={onSubmit} />;
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
  } else {
    return null;
  }
};
