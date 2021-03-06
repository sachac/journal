import React, { useState, useEffect } from 'react';
import EntriesView from '../components/EntriesView';
import { useParams } from "react-router-dom";
import BulkOperations, { SelectedInfo } from '../components/BulkOperations';
import useSelectEntries from '../hooks/useSelectEntries';

export default function TagView() {
  const [entries, setEntries] = useState([]);
  const {tagParam} = useParams();
  const fetchData = () => {
    fetch('/api/entries/tag/' + encodeURIComponent(tagParam))
      .then(res => res.json())
      .then(setEntries);
    return null;
  };
  const { selectedEntries, clickEntry, clearSelection, selectAll } = useSelectEntries({entries});
  useEffect(() => { fetchData(); }, [tagParam]);
  const bulkDone = () => { fetchData(); };
  
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

