import React, {useState} from 'react';
import EntryWall from './EntryWall';
import EntryTree from './EntryTree';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

export default function EntriesView(data) {
  let entries;

  const [ view, setView ] = useState(data.view || 'tree');
  const handleChange = (e, newValue) => {
    setView(newValue);
  };
  if (view === 'cards') {
    entries = <EntryWall entries={data.entries} onClick={data.onClick} includeDate={true} selected={data.selected} />;
  } else if (view === 'tree') {
    entries = <EntryTree entries={data.entries} onClick={data.onClick} sort="category" selected={data.selected} />;
  } else {
    entries = <EntryTree entries={data.entries} onClick={data.onClick} sort="date" selected={data.selected} />;   
  }
  return (<div>
                        <Tabs value={view} onChange={handleChange} aria-label="view type" >
                          <Tab value="tree" label="Tree"/>
                          <Tab value="list" label="List"/>
                          <Tab value="cards" label="Cards"/>
                        </Tabs>
                        {entries}
                      </div>);
}
