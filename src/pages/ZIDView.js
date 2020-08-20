import React, { useState, useEffect } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import Grid from '@material-ui/core/Grid';
import { useParams } from "react-router-dom";
import { EntryCard } from '../components/EntryWall';

export default function ZIDView(data) {
    const { zidParam } = useParams();
    const [ entry, setEntry ] = useState(null);
    const [ forwardLinks, setForwardLinks ] = useState([]);
    const [ backlinks, setBacklinks ] = useState([]);
    
    const fetchEntryByZID = (id) => {
        id = id.replace(/[^-0-9]/g, '');
        if (id) {
            fetch('/api/entries/zid/' + id).then((res) => res.json())
                .then((data) => { data && setEntry(data); });
            fetch('/api/entries/zid/' + id + '/links').then((res) => res.json())
                .then(setForwardLinks);
            fetch('/api/entries/zid/' + id + '/backlinks').then((res) => res.json())
                .then(setBacklinks);
        }
    };
    
    useEffect(() => { fetchEntryByZID(zidParam); }, [zidParam]);
    if (entry) {
        return <div className="zid-view">
        <Grid container spacing={3}>
        <Grid item sm>
          <h2>Entries linked from this</h2>
          {forwardLinks.map((entry) => { return <EntryCard includeDate={true} key={entry.ID} entry={entry}/>; })}
        </Grid>
        <Grid item sm>
        <EntryCard includeDate={true} entry={entry}/>
        </Grid>
        <Grid item sm>
        <h2>Entries that link to this</h2>
          {backlinks.map((entry) => { return <EntryCard includeDate={true} key={entry.ID} entry={entry}/>; })}
        </Grid>
        </Grid>
               </div>;
    } else {
        return <div/>;
    }
}

