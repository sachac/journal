import { useState } from 'react';

export default function useSelectEntries(props) {
  const [ selectedEntries, setSelectedEntries ] = useState([]);
  const clearSelection = () => { setSelectedEntries([]); };
  const selectAll = () => { setSelectedEntries(props.entries.map((o) => o.ZIDString)); };
  const clickEntry = (event, entry) => {
    let index = selectedEntries.indexOf(entry.ZIDString);
    if (index === -1) {
      selectedEntries.push(entry.ZIDString);
    } else {
      selectedEntries.splice(index, 1);
    }
    setSelectedEntries([...selectedEntries]);
  };
  return { selectedEntries, clickEntry, clearSelection, selectAll };
}
