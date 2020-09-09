import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import EntriesView from '../components/EntriesView';
import BulkOperations, { SelectedInfo } from '../components/BulkOperations';
import useSelectEntries from '../hooks/useSelectEntries';

export default function ZIDList(props) {
  const { zids } = useParams();
  const [ entries, setEntries ] = useState([]);
  const { selectedEntries, clickEntry, clearSelection, selectAll } = useSelectEntries({entries});
  const fetchEntries = (id) => {
    id = id.replace(/[^-0-9,]/g, '');
    if (id) {
      fetch('/api/entries?zidre=' + id.replace(/,/g, '|')).then((res) => res.json())
        .then((data) => {
          let hash = data.reduce((prev, o) => { prev[o.ZIDString] = o; return prev; }, {});
          setEntries(zids.split(',').map((k) => hash[k]));
        });
    }
  };
  const bulkDone = () => { fetchEntries(zids); };
  useEffect(() => { fetchEntries(zids); }, [zids]);
  return (<div>
            <div style={{position: 'sticky', top: 0, background: '#303030'}}>
              <BulkOperations entries={entries} selected={selectedEntries} onDone={bulkDone} onClear={clearSelection} onSelectAll={selectAll}/>
            </div>
            <EntriesView clickEntry={clickEntry} entries={entries} selected={selectedEntries} />
            <BulkOperations entries={entries} selected={selectedEntries} onDone={bulkDone} onClear={clearSelection} onSelectAll={selectAll}/>
            <SelectedInfo entries={entries} selected={selectedEntries} />
         </div>);
}
