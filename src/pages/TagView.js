import React, { useState, useEffect } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import EntriesView from '../components/EntriesView';
import { useParams } from "react-router-dom";
import BulkOperations, { SelectedInfo } from '../components/BulkOperations';

export default function TagView(data) {
  const [entries, setEntries] = useState([]);
  const {tagParam} = useParams();
  const fetchData = () => {
    fetch(`/api/entries?q=` + encodeURIComponent('#' + tagParam) + '&regex=1')
      .then(res => res.json())
      .then(setEntries);
    return null;
  };
  useEffect(() => { fetchData(); }, [tagParam]);
  const [ selectedEntries, setSelectedEntries ] = useState([]);
  const bulkDone = () => { fetchData(); };
  const clearSelection = () => { setSelectedEntries([]); };
  const selectAll = () => { setSelectedEntries(entries.map((o) => o.ZIDString)); };
  const clickEntry = (event, entry) => {
    let index = selectedEntries.indexOf(entry.ZIDString);
    if (index === -1) {
      selectedEntries.push(entry.ZIDString);
    } else {
      selectedEntries.splice(index, 1);
    }
    setSelectedEntries([...selectedEntries]);
  };
  
  return (
    <div>
      <h1>{tagParam}</h1>
      <BulkOperations entries={entries} selected={selectedEntries} onDone={bulkDone} onClear={clearSelection} onSelectAll={selectAll}/>
      <EntriesView entries={entries} view="list" onClick={clickEntry} selected={selectedEntries}/>
      <BulkOperations entries={entries} selected={selectedEntries} onDone={bulkDone} onClear={clearSelection} onSelectAll={selectAll}/>
      <SelectedInfo entries={entries} selected={selectedEntries} />
    </div>
    
  );        
}

