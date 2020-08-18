import React, { useState, useEffect } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import Button from '@material-ui/core/Button';
import EntryItem from '../components/EntryItem';
import EntriesView from '../components/EntriesView';

import { DatePicker } from '@material-ui/pickers';
import moment from 'moment';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
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
            fetch('/api/entries?zid=' + id)
                .then((res) => res.json())
                .then((data) => {
                    data && data[0] && setEntry(data[0]);
                    let m = data[0].Other.match(/(?<=^|[ \t\r\n])ref:[0-9]+[0-9]+[0-9]+[0-9]+-[0-9]+[0-9]+-[0-9]+[0-9]+-[0-9]+[0-9]+(?=$|[ \t\r\n])/g);
                    let re = m.map((o) => o.replace('ref:', '')).join('|');
                    fetch('/api/entries?zidre=' + re)
                        .then((res) => res.json())
                        .then((data) => { setForwardLinks(data); });
                });
            fetch('/api/entries?regex=1&q=ref:' + id)
                .then((res) => res.json())
                .then((data) => { setBacklinks(data); });
        }
    };
    
    useEffect(() => { fetchEntryByZID(zidParam); }, [zidParam]);
    if (entry) {
        return <div>
                 <EntryCard includeDate={true} entry={entry}/>
                 <h2>Entries that link to this</h2>
                 <EntriesView entries={backlinks} view="cards"/>
                 <h2>Entries linked from this</h2>
                 <EntriesView entries={forwardLinks} view="cards"/>
                                  
               </div>;
    } else {
        return <div/>;
    }
}

