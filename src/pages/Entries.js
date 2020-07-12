import React, { useState } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import EntriesView from '../components/EntriesView';
import Button from '@material-ui/core/Button';

import { DatePicker } from '@material-ui/pickers';
import moment from 'moment';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

export default function Entries(data) {
    const [fromDate, setFromDate] = useState(new Date(Date.now() - 1000 * 60 * 60 * 24 * 8));
    const [toDate, setToDate] = useState(new Date());
    const [entries, setEntries] = useState([]);
    const fetchData = () => {
        let from = moment(fromDate).format('YYYY-MM-DD');
        let to = moment(toDate).format('YYYY-MM-DD');
        fetch(`/api/entries?from=${from}&to=${to}`)
            .then(res => res.json())
            .then(setEntries);
        return null;
    };
    const [ view, setView ] = useState('tree');
    const handleChange = (e, newValue) => {
        console.log('event', e, newValue);
        setView(newValue);
    };
    
    return (
        <div>
          From: <DatePicker value={fromDate} format="yyyy-MM-dd" onChange={setFromDate} />
          To: <DatePicker value={toDate} format="yyyy-MM-dd" onChange={setToDate} />
          <Button onClick={fetchData}>Go</Button>
          <EntriesView entries={entries} />
        </div>
        
    );        
}

