import React, { useState, useEffect } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import EntriesView from '../components/EntriesView';
import Button from '@material-ui/core/Button';

import { DatePicker } from '@material-ui/pickers';
import { useParams } from "react-router-dom";
import moment from 'moment';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

export default function TagView(data) {
    const [entries, setEntries] = useState([]);
    const {tagParam} = useParams();
    const fetchData = () => {
        fetch(`/api/entries?q=` + encodeURIComponent('#' + tagParam) + '&regex=1')
            .then(res => res.json())
            .then(setEntries);
        return null;
    };
    const [ view, setView ] = useState('tree');
    useEffect(() => { fetchData(); }, [tagParam]);
    const handleChange = (e, newValue) => {
        setView(newValue);
    };
    
    return (
        <div>
          <h1>{tagParam}</h1>
          <EntriesView entries={entries} view="list"/>
        </div>
        
    );        
}

