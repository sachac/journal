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

export default function ZIDView(data) {
    const { zidParam } = useParams();
    const [ entry, setEntry ] = useState(null);
    const [ backlinks, setBacklinks ] = useState([]);
    
    const fetchEntryByZID = (id) => {
        id = id.replace(/[^-0-9]/g, '');
        if (id) {
            fetch('/api/entries?zid=' + id)
                .then((res) => res.json())
                .then((data) => { data && data[0] && setEntry(data[0]); });
            fetch('/api/entries?regex=1&q=ref:' + id)
                .then((res) => res.json())
                .then((data) => { setBacklinks(data); });
        }
    };
    
    useEffect(() => { fetchEntryByZID(zidParam); }, [zidParam]);
    if (entry) {
        return <div>
                 <EntryItem entry={entry}/>
                 <h2>Backlinks</h2>
                 <EntriesView entries={backlinks}/>
               </div>;
    } else {
        return <div/>;
    }
}

