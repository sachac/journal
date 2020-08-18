import React, { useState } from 'react';
import PhotoList from './PhotoList';
import EntryForm from '../pages/EntryForm';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import InsertLinkIcon from '@material-ui/icons/InsertLink';
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
        return <div className="entryItem" onClick={(e) => data.onEntryLink && data.onEntryLink(e, entry)}><PhotoList data={entry.PictureList} />
                 <IconButton onClick={(e) => { setEditing(!isEditing); } }><EditIcon fontSize="small"/></IconButton>
                 <EntryNote value={entry.Note} /> <EntryNote className="other" value={entry.Other}/> ({zidLink})
               </div>;
    }
};
