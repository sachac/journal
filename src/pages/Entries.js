import React, { useState } from 'react';
import EntriesView from '../components/EntriesView';
import Button from '@material-ui/core/Button';
import useSelectEntries from '../hooks/useSelectEntries';
import { DatePicker } from '@material-ui/pickers';
import moment from 'moment';
import BulkOperations, { SelectedInfo } from '../components/BulkOperations';
import history from "../history";

const queryString = require('query-string');

export default function Entries(data) {
  const parsed = queryString.parse(data.location && data.location.search);
  const [fromDate, setFromDate] = useState(parsed.from ? moment(parsed.from).toDate() : new Date(Date.now() - 1000 * 60 * 60 * 24 * 8));
  const [toDate, setToDate] = useState(parsed.to ? moment(parsed.to).toDate() : new Date());
  const [entries, setEntries] = useState([]);
  const fetchData = () => {
    let from = moment(fromDate).format('YYYY-MM-DD');
    let to = moment(toDate).format('YYYY-MM-DD');
    history.push(`/entries?from=${from}&to=${to}`); 
    fetch(`/api/entries?from=${from}&to=${to}`)
      .then(res => res.json())
      .then(setEntries);
    return null;
  };
  const { selectedEntries, clickEntry, clearSelection, selectAll } = useSelectEntries({entries});
  const bulkDone = () => { fetchData(); };
  
  return (
    <div>
      From: <DatePicker value={fromDate} format="YYYY-MM-DD" onChange={setFromDate} />
      To: <DatePicker value={toDate} format="YYYY-MM-DD" onChange={setToDate} />
      <Button onClick={fetchData}>Go</Button>
      <div style={{position: 'relative'}}>
        <div style={{position: 'sticky', top: 0, background: '#303030'}}>
          <BulkOperations entries={entries} selected={selectedEntries} onDone={bulkDone} onClear={clearSelection} onSelectAll={selectAll}  />
        </div>
        <EntriesView entries={entries} onClick={clickEntry} selected={selectedEntries} {...data} />
      </div>
      <BulkOperations entries={entries} selected={selectedEntries} onDone={bulkDone} onClear={clearSelection} onSelectAll={selectAll}/>
      <SelectedInfo entries={entries} selected={selectedEntries} />      
    </div>
    
  );        
}

