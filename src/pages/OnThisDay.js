import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import EntriesView from '../components/EntriesView';
import Button from '@material-ui/core/Button';

import DateSelector from '../components/DateSelector';
import moment from 'moment';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import history from "../history";

export default function OnThisDay(data) {
    const { dateParam } = useParams();
    const [date, setDate] = useState(dateParam ? moment(dateParam).toDate() : new Date());
    const [entries, setEntries] = useState([]);
    const onChange = date => {
        setDate(date);
        history.push('/onThisDay/' + moment(date).format('YYYY-MM-DD'));
    };
    
    const fetchData = () => {
        let month = date.getMonth() + 1;
        let day = date.getDate();
        fetch('/api/onThisDay/' + month + '/' + day)
            .then(res => res.json())
            .then(setEntries);
        return null;
    };
    useEffect(() => { fetchData(); }, [date]);
    
    return (
        <div>
          <DateSelector value={date} format="MM-dd" onChange={onChange} />
          <EntriesView entries={entries} view='list'/>
        </div>
    );        
}

